package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/gobwas/ws"
	"github.com/gobwas/ws/wsutil"
)

type Message struct {
	Type      string  `json:"type"`
	ID        int     `json:"id"`
	Timestamp float64 `json:"timestamp"`
}

type Client struct {
	conn net.Conn
	mu   sync.Mutex
}

type Server struct {
	port             string
	enableLogging    bool
	clients          map[*Client]bool
	clientsMux       sync.RWMutex
	logger           *Logger
	messageCount     int
	messageCountMux  sync.Mutex
	throughputTicker *time.Ticker
	shutdownChan     chan struct{}
}

func NewServer(port string, enableLogging bool) *Server {
	if port == "" {
		port = "8080"
	}

	return &Server{
		port:          port,
		enableLogging: enableLogging,
		clients:       make(map[*Client]bool),
		logger:        NewLogger(),
		shutdownChan:  make(chan struct{}),
	}
}

func (s *Server) Start() error {
	if s.enableLogging {
		s.startThroughputTracking()
	}

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
	fmt.Println("Gobwas WebSocket Server (v1.2.1)")
	fmt.Println("============================================================")
	fmt.Printf("Port: %s\n", s.port)
	if s.enableLogging {
		fmt.Println("Logging: ENABLED")
	} else {
		fmt.Println("Logging: DISABLED")
	}
	fmt.Println()
	fmt.Println("Supported message types:")
	fmt.Println("  - Ping: {\"type\": \"ping\", \"id\": 1, \"timestamp\": ...}")
	fmt.Println("  - Broadcast: {\"type\": \"broadcast\", \"id\": 1, \"timestamp\": ...}")
	fmt.Println()
	if s.enableLogging {
		fmt.Printf("Throughput metrics logged to: data/raw/throughput_golang_gobwas.csv\n")
		fmt.Printf("Resource metrics logged to: data/raw/resources_golang_gobwas.csv\n")
	}
	fmt.Println("Press Ctrl+C to stop")
	fmt.Println("============================================================")
	fmt.Println()

	s.logger.Log(fmt.Sprintf("Gobwas WebSocket server listening on port %s", s.port))

	return http.ListenAndServe(":"+s.port, nil)
}

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, _, _, err := ws.UpgradeHTTP(r, w)
	if err != nil {
		s.logger.Error(fmt.Sprintf("Failed to upgrade connection: %v", err))
		return
	}

	client := &Client{conn: conn}
	s.addClient(client)
	defer s.removeClient(client)

	for {
		data, op, err := wsutil.ReadClientData(conn)
		if err != nil {
			if err != nil {
				s.logger.Error(fmt.Sprintf("WebSocket error: %v", err))
			}
			break
		}

		if op == ws.OpText {
			s.handleMessage(client, data)
		}
	}
}

func (s *Server) handleMessage(client *Client, data []byte) {
	s.incrementMessageCount()

	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		s.logger.Log(fmt.Sprintf("Failed to parse JSON message: %v, raw data: %s", err, string(data)))
		// Not a valid JSON message, echo it back
		client.mu.Lock()
		wsutil.WriteServerMessage(client.conn, ws.OpText, data)
		client.mu.Unlock()
		return
	}

	switch msg.Type {
	case "ping":
		s.handlePing(client, &msg)
	case "broadcast":
		s.handleBroadcast(client, &msg)
	default:
		s.logger.Log(fmt.Sprintf("Unknown message type: '%s', echoing back", msg.Type))
		// Unknown message type, echo it back
		client.mu.Lock()
		wsutil.WriteServerMessage(client.conn, ws.OpText, data)
		client.mu.Unlock()
	}
}

func (s *Server) handlePing(client *Client, msg *Message) {
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

	client.mu.Lock()
	defer client.mu.Unlock()

	if err := wsutil.WriteServerMessage(client.conn, ws.OpText, data); err != nil {
		s.logger.Error(fmt.Sprintf("Failed to send pong message: %v", err))
	}
}

func (s *Server) handleBroadcast(sender *Client, msg *Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		s.logger.Error(fmt.Sprintf("Failed to marshal broadcast message: %v", err))
		return
	}

	s.clientsMux.RLock()
	receiverCount := 0
	for client := range s.clients {
		if client != sender {
			client.mu.Lock()
			if err := wsutil.WriteServerMessage(client.conn, ws.OpText, data); err != nil {
				s.logger.Error(fmt.Sprintf("Failed to send broadcast to client: %v", err))
			} else {
				receiverCount++
			}
			client.mu.Unlock()
		}
	}
	s.clientsMux.RUnlock()

	s.logger.Log(fmt.Sprintf("Broadcasted message %d to %d clients", msg.ID, receiverCount))
}

func (s *Server) addClient(client *Client) {
	s.clientsMux.Lock()
	s.clients[client] = true
	clientCount := len(s.clients)
	s.clientsMux.Unlock()

	s.logger.Log(fmt.Sprintf("Client connected. Total clients: %d", clientCount))
}

func (s *Server) removeClient(client *Client) {
	s.clientsMux.Lock()
	delete(s.clients, client)
	clientCount := len(s.clients)
	s.clientsMux.Unlock()

	client.conn.Close()
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

				s.logger.AppendThroughput(messagesPerSecond, activeConnections)
				s.logger.AppendResourceMetrics(activeConnections)

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
		client.conn.Close()
	}
	s.clientsMux.Unlock()

	s.logger.Close()
	s.logger.Log("Server stopped")
}

func main() {
	port := "8080"
	enableLogging := false

	// Parse command-line arguments
	for i := 1; i < len(os.Args); i++ {
		arg := os.Args[i]
		switch arg {
		case "--port", "-p":
			if i+1 < len(os.Args) {
				port = os.Args[i+1]
				i++
			}
		case "--log":
			enableLogging = true
		default:
			// Support legacy format: ./server 8080
			if len(os.Args) == 2 {
				port = os.Args[1]
			}
		}
	}

	// Check environment variable as fallback
	if envPort := os.Getenv("PORT"); envPort != "" && port == "8080" {
		port = envPort
	}

	server := NewServer(port, enableLogging)
	if err := server.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
