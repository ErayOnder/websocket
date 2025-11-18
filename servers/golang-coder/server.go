package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/coder/websocket"
)

type Message struct {
	Type      string  `json:"type"`
	ID        int     `json:"id"`
	Timestamp float64 `json:"timestamp"`
}

type Client struct {
	conn *websocket.Conn
	mu   sync.Mutex
}

type Server struct {
	port               string
	clients            map[*Client]bool
	clientsMux         sync.RWMutex
	logger             *Logger
	messageCount       int
	messageCountMux    sync.Mutex
	throughputTicker   *time.Ticker
	shutdownChan       chan struct{}
}

func NewServer(port string) *Server {
	return &Server{
		port:             port,
		clients:          make(map[*Client]bool),
		logger:           NewLogger(),
		throughputTicker: time.NewTicker(1 * time.Second),
		shutdownChan:     make(chan struct{}),
	}
}

func (s *Server) Start() error {
	// Start throughput tracker
	go s.trackThroughput()

	// Set up graceful shutdown
	go s.handleShutdown()

	// Create HTTP server
	http.HandleFunc("/", s.handleWebSocket)

	s.logger.Log(fmt.Sprintf("Coder WebSocket server listening on port %s", s.port))

	return http.ListenAndServe(":"+s.port, nil)
}

func (s *Server) handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// Accept WebSocket connection
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		InsecureSkipVerify: true,
	})
	if err != nil {
		s.logger.Error(fmt.Sprintf("Failed to accept WebSocket: %v", err))
		return
	}

	client := &Client{conn: conn}
	s.addClient(client)
	defer s.removeClient(client)

	// Read messages from client
	ctx := context.Background()
	for {
		msgType, data, err := conn.Read(ctx)
		if err != nil {
			s.logger.Error(fmt.Sprintf("WebSocket error: %v", err))
			break
		}

		if msgType != websocket.MessageText {
			continue
		}

		s.handleMessage(client, data)
	}
}

func (s *Server) handleMessage(client *Client, data []byte) {
	s.incrementMessageCount()

	var msg Message
	if err := json.Unmarshal(data, &msg); err != nil {
		s.logger.Log(fmt.Sprintf("Failed to parse JSON message: %v, raw data: %s", err, string(data)))
		// Not a valid JSON message, echo it back
		client.mu.Lock()
		client.conn.Write(context.Background(), websocket.MessageText, data)
		client.mu.Unlock()
		return
	}

	switch msg.Type {
	case "echo":
		s.handleEcho(client, &msg)
	case "broadcast":
		s.handleBroadcast(client, &msg)
	default:
		s.logger.Log(fmt.Sprintf("Unknown message type: '%s', echoing back", msg.Type))
		// Unknown message type, echo it back
		client.mu.Lock()
		client.conn.Write(context.Background(), websocket.MessageText, data)
		client.mu.Unlock()
	}
}

func (s *Server) handleEcho(client *Client, msg *Message) {
	data, err := json.Marshal(msg)
	if err != nil {
		s.logger.Error(fmt.Sprintf("Failed to marshal echo message: %v", err))
		return
	}

	client.mu.Lock()
	defer client.mu.Unlock()

	if err := client.conn.Write(context.Background(), websocket.MessageText, data); err != nil {
		s.logger.Error(fmt.Sprintf("Failed to send echo message: %v", err))
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
			if err := client.conn.Write(context.Background(), websocket.MessageText, data); err != nil {
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
	count := len(s.clients)
	s.clientsMux.Unlock()

	s.logger.Log(fmt.Sprintf("Client connected. Total clients: %d", count))
}

func (s *Server) removeClient(client *Client) {
	s.clientsMux.Lock()
	delete(s.clients, client)
	count := len(s.clients)
	s.clientsMux.Unlock()

	client.conn.Close(websocket.StatusNormalClosure, "")
	s.logger.Log(fmt.Sprintf("Client disconnected. Total clients: %d", count))
}

func (s *Server) incrementMessageCount() {
	s.messageCountMux.Lock()
	s.messageCount++
	s.messageCountMux.Unlock()
}

func (s *Server) trackThroughput() {
	for {
		select {
		case <-s.throughputTicker.C:
			s.messageCountMux.Lock()
			messagesPerSecond := s.messageCount
			s.messageCount = 0
			s.messageCountMux.Unlock()

			s.clientsMux.RLock()
			activeConnections := len(s.clients)
			s.clientsMux.RUnlock()

			s.logger.Log(fmt.Sprintf("Throughput: %d msg/s, Active connections: %d", messagesPerSecond, activeConnections))
			s.logger.AppendThroughput(messagesPerSecond, activeConnections)

		case <-s.shutdownChan:
			return
		}
	}
}

func (s *Server) handleShutdown() {
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	<-sigChan
	s.logger.Log("Shutting down server...")

	close(s.shutdownChan)
	s.throughputTicker.Stop()

	// Close all client connections
	s.clientsMux.Lock()
	for client := range s.clients {
		client.conn.Close(websocket.StatusGoingAway, "Server shutting down")
	}
	s.clientsMux.Unlock()

	s.logger.Close()
	os.Exit(0)
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	fmt.Println("============================================================")
	fmt.Println("Coder WebSocket Server (v1.8.13)")
	fmt.Println("============================================================")
	fmt.Printf("Port: %s\n\n", port)
	fmt.Println("Supported message types:")
	fmt.Println(`  - Echo: {"type": "echo", "id": 1, "timestamp": ...}`)
	fmt.Println(`  - Broadcast: {"type": "broadcast", "id": 1, "timestamp": ...}`)
	fmt.Println()
	fmt.Println("Throughput metrics logged to: data/raw/throughput_golang_coder.csv")
	fmt.Println("Press Ctrl+C to stop")
	fmt.Println("============================================================")

	server := NewServer(port)
	if err := server.Start(); err != nil {
		fmt.Printf("Server error: %v\n", err)
		os.Exit(1)
	}
}
