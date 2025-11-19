package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"time"
)

type Logger struct {
	csvFile          *os.File
	csvWriter        *csv.Writer
	filePath         string
	resourcesFile    *os.File
	resourcesWriter  *csv.Writer
	resourcesPath    string
}

func NewLogger() *Logger {
	dataDir := filepath.Join("..", "..", "data", "raw")
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		log.Printf("Warning: Failed to create data directory: %v", err)
	}

	// Throughput CSV
	filePath := filepath.Join(dataDir, "throughput_golang_coder.csv")
	csvFile, err := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("Warning: Failed to open CSV file: %v", err)
		return &Logger{filePath: filePath}
	}

	csvWriter := csv.NewWriter(csvFile)
	fileInfo, _ := csvFile.Stat()
	if fileInfo.Size() == 0 {
		header := []string{"timestamp", "messages_per_second", "active_connections"}
		if err := csvWriter.Write(header); err != nil {
			log.Printf("Warning: Failed to write CSV header: %v", err)
		}
		csvWriter.Flush()
	}

	// Resources CSV
	resourcesPath := filepath.Join(dataDir, "resources_golang_coder.csv")
	resourcesFile, err := os.OpenFile(resourcesPath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		log.Printf("Warning: Failed to open resources CSV file: %v", err)
	}

	var resourcesWriter *csv.Writer
	if resourcesFile != nil {
		resourcesWriter = csv.NewWriter(resourcesFile)
		resInfo, _ := resourcesFile.Stat()
		if resInfo.Size() == 0 {
			header := []string{"timestamp", "cpu_goroutines", "memory_alloc_mb", "memory_sys_mb", "gc_count"}
			if err := resourcesWriter.Write(header); err != nil {
				log.Printf("Warning: Failed to write resources CSV header: %v", err)
			}
			resourcesWriter.Flush()
		}
	}

	return &Logger{
		csvFile:         csvFile,
		csvWriter:       csvWriter,
		filePath:        filePath,
		resourcesFile:   resourcesFile,
		resourcesWriter: resourcesWriter,
		resourcesPath:   resourcesPath,
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

func (l *Logger) AppendResourceMetrics() {
	if l.resourcesWriter == nil {
		return
	}

	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	timestamp := time.Now().UTC().Format("2006-01-02T15:04:05.000Z")
	record := []string{
		timestamp,
		fmt.Sprintf("%d", runtime.NumGoroutine()),
		fmt.Sprintf("%.2f", float64(m.Alloc)/1024/1024),       // MB
		fmt.Sprintf("%.2f", float64(m.Sys)/1024/1024),         // MB
		fmt.Sprintf("%d", m.NumGC),
	}

	if err := l.resourcesWriter.Write(record); err != nil {
		log.Printf("Warning: Failed to write resource data: %v", err)
	}
	l.resourcesWriter.Flush()
}

func (l *Logger) Close() {
	if l.csvWriter != nil {
		l.csvWriter.Flush()
	}
	if l.csvFile != nil {
		l.csvFile.Close()
	}
	if l.resourcesWriter != nil {
		l.resourcesWriter.Flush()
	}
	if l.resourcesFile != nil {
		l.resourcesFile.Close()
	}
}
