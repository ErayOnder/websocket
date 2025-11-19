import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Logger {
  constructor(dataDir = '../../../data/raw') {
    this.dataDir = path.resolve(__dirname, dataDir);
    this.ensureDataDirectory();
    // Track CPU usage for percentage calculation
    this.lastCpuUsage = null;
    this.lastCpuTime = null;
  }

  ensureDataDirectory() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  log(message) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }

  error(message) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${message}`);
  }

  /**
   * Append throughput data to CSV
   * @param {string} serverName - Server name
   * @param {number} timestamp - Unix timestamp
   * @param {number} messagesPerSecond - Messages processed per second
   * @param {number} activeConnections - Number of active connections
   */
  appendThroughput(serverName, timestamp, messagesPerSecond, activeConnections) {
    const filename = `throughput_${serverName}.csv`;
    const filepath = path.join(this.dataDir, filename);

    // Create file with header if it doesn't exist
    if (!fs.existsSync(filepath)) {
      const header = 'timestamp,messages_per_second,active_connections\n';
      fs.writeFileSync(filepath, header);
    }

    const row = `${timestamp},${messagesPerSecond},${activeConnections}\n`;
    fs.appendFileSync(filepath, row);
  }

  /**
   * Append resource metrics data to CSV
   * @param {string} serverName - Server name
   * @param {number} timestamp - Unix timestamp
   */
  appendResourceMetrics(serverName, timestamp) {
    const filename = `resources_${serverName}.csv`;
    const filepath = path.join(this.dataDir, filename);

    // Get memory usage
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const now = Date.now();

    // Calculate CPU percentage
    let cpuPercent = 0;
    if (this.lastCpuUsage && this.lastCpuTime) {
      const elapsedTime = (now - this.lastCpuTime) * 1000; // Convert to microseconds
      const userDelta = cpuUsage.user - this.lastCpuUsage.user;
      const systemDelta = cpuUsage.system - this.lastCpuUsage.system;
      const totalDelta = userDelta + systemDelta;

      // CPU percentage = (total CPU time used / elapsed real time) * 100
      cpuPercent = (totalDelta / elapsedTime) * 100;
    }

    // Store for next calculation
    this.lastCpuUsage = cpuUsage;
    this.lastCpuTime = now;

    // Create file with header if it doesn't exist
    if (!fs.existsSync(filepath)) {
      const header = 'timestamp,cpu_user_ms,cpu_system_ms,cpu_percent,memory_rss_mb,memory_heap_used_mb,memory_heap_total_mb,memory_external_mb\n';
      fs.writeFileSync(filepath, header);
    }

    const row = `${timestamp},${(cpuUsage.user / 1000).toFixed(2)},${(cpuUsage.system / 1000).toFixed(2)},${cpuPercent.toFixed(2)},${(memUsage.rss / 1024 / 1024).toFixed(2)},${(memUsage.heapUsed / 1024 / 1024).toFixed(2)},${(memUsage.heapTotal / 1024 / 1024).toFixed(2)},${(memUsage.external / 1024 / 1024).toFixed(2)}\n`;
    fs.appendFileSync(filepath, row);
  }
}

export default Logger;
