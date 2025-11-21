package main

import (
	"encoding/csv"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"runtime"
	"syscall"
	"time"
)

type cpuTimes struct {
	utime     int64
	stime     int64
	timestamp time.Time
}

type Logger struct {
	csvFile          *os.File
	csvWriter        *csv.Writer
	filePath         string
	resourcesFile    *os.File
	resourcesWriter  *csv.Writer
	resourcesPath    string
	lastCPU          cpuTimes
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
			header := []string{"timestamp", "cpu_user_ms", "cpu_system_ms", "cpu_percent", "cpu_goroutines", "memory_alloc_mb", "memory_sys_mb", "gc_count"}
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

func (l *Logger) getCPUPercent() (float64, int64, int64) {
	var rusage syscall.Rusage
	if err := syscall.Getrusage(syscall.RUSAGE_SELF, &rusage); err != nil {
		return 0, 0, 0
	}

	now := time.Now()
	// Convert timeval to microseconds
	utime := rusage.Utime.Sec*1000000 + int64(rusage.Utime.Usec)
	stime := rusage.Stime.Sec*1000000 + int64(rusage.Stime.Usec)

	cpuPercent := 0.0
	if !l.lastCPU.timestamp.IsZero() {
		elapsed := now.Sub(l.lastCPU.timestamp).Microseconds()
		if elapsed > 0 {
			cpuUsed := (utime - l.lastCPU.utime) + (stime - l.lastCPU.stime)
			cpuPercent = float64(cpuUsed) / float64(elapsed) * 100
		}
	}

	l.lastCPU = cpuTimes{
		utime:     utime,
		stime:     stime,
		timestamp: now,
	}

	// Convert to milliseconds for reporting (matching Node.js format)
	utimeMs := utime / 1000
	stimeMs := stime / 1000

	return cpuPercent, utimeMs, stimeMs
}

func (l *Logger) AppendResourceMetrics() {
	if l.resourcesWriter == nil {
		return
	}

	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	cpuPercent, cpuUserMs, cpuSystemMs := l.getCPUPercent()

	timestamp := time.Now().UTC().Format("2006-01-02T15:04:05.000Z")
	record := []string{
		timestamp,
		fmt.Sprintf("%.2f", float64(cpuUserMs)),              // CPU user time (ms)
		fmt.Sprintf("%.2f", float64(cpuSystemMs)),            // CPU system time (ms)
		fmt.Sprintf("%.2f", cpuPercent),                      // CPU percent
		fmt.Sprintf("%d", runtime.NumGoroutine()),            // Goroutines
		fmt.Sprintf("%.2f", float64(m.Alloc)/1024/1024),      // MB
		fmt.Sprintf("%.2f", float64(m.Sys)/1024/1024),        // MB
		fmt.Sprintf("%d", m.NumGC),                           // GC count
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
