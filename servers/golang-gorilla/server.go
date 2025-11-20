package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
)

type Message struct {
	Type      string  `json:"type"`
	ID        int     `json:"id"`
	Timestamp float64 `json:"timestamp"`
}

type Server struct {
	port             string
	upgrader         websocket.Upgrader
	clients          map[*websocket.Conn]bool
	clientsMux       sync.RWMutex
	logger           *Logger
	messageCount     int
	messageCountMux  sync.Mutex
	throughputTicker *time.Ticker
	shutdownChan     chan struct{}
}

func NewServer(port string) *Server {
	if port == "" {
		port = "8080"
	}

	return &Server{
		port: port,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
			ReadBufferSize:  1024,
			WriteBufferSize: 1024,
		},
		clients:      make(map[*websocket.Conn]bool),
		logger:       NewLogger(),
		shutdownChan: make(chan struct{}),
	}
}

func (s *Server) Start() error {
	s.startThroughputTracking()

	http.HandleFunc("/", s.handleWebSocket)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	go func() {
		<-sigChan
		s.logger.Log("Shutting down server...")
		s.Stop()
		os.Exit(0)
	}()

	fmt.Println("============================================================")
	fmt.Println("Gorilla WebSocket Server (v1.5.3)")
	fmt.Println("============================================================")
	fmt.Printf("Port: %s\n\n", s.port)
	fmt.Println("Supported message types:")
	fmt.Println("  - Ping: {\"type\": \"ping\", \"id\": 1, \"timestamp\": ...}")
	fmt.Println("  - Broadcast: {\"type\": \"broadcast\", \"id\": 1, \"timestamp\": ...}")
	fmt.Println()
	fmt.Printf("Throughput metrics logged to: data/raw/throughput_golang_gorilla.csv\n")
	fmt.Printf("Resource metrics logged to: data/raw/resources_golang_gorilla.csv\n")
	fmt.Println("Press Ctrl+C to stop")
	fmt.Println("============================================================")
	fmt.Println()

	s.logger.Log(fmt.Sprintf("Gorilla WebSocket server listening on port %s", s.port))

	return http.ListenAndServe(":"+s.port, nil)
}

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		s.logger.Error(fmt.Sprintf("Failed to upgrade connection: %v", err))
		return
	}

	s.addClient(conn)
	defer s.removeClient(conn)

	for {
		messageType, data, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				s.logger.Error(fmt.Sprintf("WebSocket error: %v", err))
			}
			break
		}

		if messageType == websocket.TextMessage {
			s.handleMessage(conn, data)
		}
	}
}

func (s *Server) handleMessage(conn *websocket.Conn, data []byte) {
	s.incrementMessageCount()

	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		s.logger.Log(fmt.Sprintf("Failed to parse JSON message: %v, raw data: %s", err, string(data)))
		// Not a valid JSON message, echo it back
		conn.WriteMessage(websocket.TextMessage, data)
		return
	}

	switch msg.Type {
	case "ping":
		s.handlePing(conn, &msg)
	case "broadcast":
		s.handleBroadcast(conn, &msg)
	default:
		s.logger.Log(fmt.Sprintf("Unknown message type: '%s', echoing back", msg.Type))
		// Unknown message type, echo it back
		conn.WriteMessage(websocket.TextMessage, data)
	}
}

func (s *Server) handlePing(conn *websocket.Conn, msg *Message) {
	pongMsg := Message{
		Type:      "pong",
		ID:        msg.ID,
		Timestamp: msg.Timestamp,
	}

	data, err := json.Marshal(pongMsg)
	if err != nil {
		s.logger.Error(fmt.Sprintf("Failed to marshal pong message: %v", err))
		return
	}

	if err := conn.WriteMessage(websocket.TextMessage, data); err != nil {
		s.logger.Error(fmt.Sprintf("Failed to send pong message: %v", err))
	}
}

func (s *Server) handleBroadcast(sender *websocket.Conn, msg *Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		s.logger.Error(fmt.Sprintf("Failed to marshal broadcast message: %v", err))
		return
	}

	s.clientsMux.RLock()
	receiverCount := 0
	for client := range s.clients {
		if client != sender {
			if err := client.WriteMessage(websocket.TextMessage, data); err != nil {
				s.logger.Error(fmt.Sprintf("Failed to send broadcast to client: %v", err))
			} else {
				receiverCount++
			}
		}
	}
	s.clientsMux.RUnlock()

	s.logger.Log(fmt.Sprintf("Broadcasted message %d to %d clients", msg.ID, receiverCount))
}

func (s *Server) addClient(conn *websocket.Conn) {
	s.clientsMux.Lock()
	s.clients[conn] = true
	clientCount := len(s.clients)
	s.clientsMux.Unlock()

	s.logger.Log(fmt.Sprintf("Client connected. Total clients: %d", clientCount))
}

func (s *Server) removeClient(conn *websocket.Conn) {
	s.clientsMux.Lock()
	delete(s.clients, conn)
	clientCount := len(s.clients)
	s.clientsMux.Unlock()

	conn.Close()
	s.logger.Log(fmt.Sprintf("Client disconnected. Total clients: %d", clientCount))
}

func (s *Server) incrementMessageCount() {
	s.messageCountMux.Lock()
	s.messageCount++
	s.messageCountMux.Unlock()
}

func (s *Server) getAndResetMessageCount() int {
	s.messageCountMux.Lock()
	count := s.messageCount
	s.messageCount = 0
	s.messageCountMux.Unlock()
	return count
}

func (s *Server) getClientCount() int {
	s.clientsMux.RLock()
	count := len(s.clients)
	s.clientsMux.RUnlock()
	return count
}

func (s *Server) startThroughputTracking() {
	s.throughputTicker = time.NewTicker(1 * time.Second)

	go func() {
		for {
			select {
			case <-s.throughputTicker.C:
				messagesPerSecond := s.getAndResetMessageCount()
				activeConnections := s.getClientCount()

				s.logger.Log(fmt.Sprintf("Throughput: %d msg/s, Active connections: %d",
					messagesPerSecond, activeConnections))
				s.logger.AppendThroughput(messagesPerSecond, activeConnections)
				s.logger.AppendResourceMetrics()

			case <-s.shutdownChan:
				return
			}
		}
	}()
}

func (s *Server) Stop() {
	if s.throughputTicker != nil {
		s.throughputTicker.Stop()
	}
	close(s.shutdownChan)

	s.clientsMux.Lock()
	for client := range s.clients {
		client.Close()
	}
	s.clientsMux.Unlock()

	s.logger.Close()
	s.logger.Log("Server stopped")
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := NewServer(port)
	if err := server.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
