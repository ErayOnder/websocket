package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"
)

type Logger struct {
	csvFile   *os.File
	csvWriter *csv.Writer
	filePath  string
}

func NewLogger() *Logger {
	// Create data/raw directory if it doesn't exist
	dataDir := filepath.Join("..", "..", "data", "raw")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Printf("Warning: Failed to create data directory: %v", err)
	}

	filePath := filepath.Join(dataDir, "throughput_golang_coder.csv")

	// Open CSV file for appending
	csvFile, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("Warning: Failed to open CSV file: %v", err)
		return &Logger{filePath: filePath}
	}

	csvWriter := csv.NewWriter(csvFile)

	// Write header if file is empty
	fileInfo, _ := csvFile.Stat()
	if fileInfo.Size() == 0 {
		header := []string{"timestamp", "messages_per_second", "active_connections"}
		if err := csvWriter.Write(header); err != nil {
			log.Printf("Warning: Failed to write CSV header: %v", err)
		}
		csvWriter.Flush()
	}

	return &Logger{
		csvFile:   csvFile,
		csvWriter: csvWriter,
		filePath:  filePath,
	}
}

func (l *Logger) Log(message string) {
	timestamp := time.Now().UTC().Format("2006-01-02T15:04:05.000Z")
	log.Printf("[%s] %s", timestamp, message)
}

func (l *Logger) Error(message string) {
	timestamp := time.Now().UTC().Format("2006-01-02T15:04:05.000Z")
	log.Printf("[%s] ERROR: %s", timestamp, message)
}

func (l *Logger) AppendThroughput(messagesPerSecond int, activeConnections int) {
	if l.csvWriter == nil {
		return
	}

	timestamp := time.Now().UTC().Format("2006-01-02T15:04:05.000Z")
	record := []string{
		timestamp,
		fmt.Sprintf("%d", messagesPerSecond),
		fmt.Sprintf("%d", activeConnections),
	}

	if err := l.csvWriter.Write(record); err != nil {
		log.Printf("Warning: Failed to write throughput data: %v", err)
	}
	l.csvWriter.Flush()
}

func (l *Logger) Close() {
	if l.csvWriter != nil {
		l.csvWriter.Flush()
	}
	if l.csvFile != nil {
		l.csvFile.Close()
	}
}
