import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Logger {
  constructor(dataDir = '../../../data/raw') {
    this.dataDir = path.resolve(__dirname, dataDir);
    this.ensureDataDirectory();
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
   * Clear CSV files for a specific server and client counts before starting a new phased test
   * @param {string} serverName - Server name (e.g., 'ws', 'socketio')
   * @param {Array<number>} clientCounts - Array of client counts to clear data for
   * @param {Array<string>} fileTypes - Array of file types to clear (e.g., ['rtt', 'reliability'])
   */
  clearPhasedTestData(serverName, clientCounts, fileTypes) {
    let filesDeleted = 0;

    for (const numClients of clientCounts) {
      for (const fileType of fileTypes) {
        const filename = `${fileType}_${serverName}_${numClients}clients.csv`;
        const filepath = path.join(this.dataDir, filename);
        
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          filesDeleted++;
        }
      }
    }
  }

  /**
   * Write connection time metrics to CSV (appends to existing file if present)
   * @param {string} serverName - Server name (e.g., 'ws', 'socketio')
   * @param {number} numClients - Number of clients in this test
   * @param {Array<{clientId: number, connectionTime: number}>} data - Connection time data
   */
  writeConnectionTime(serverName, numClients, data) {
    const filename = `connection_time_${serverName}_${numClients}clients.csv`;
    const filepath = path.join(this.dataDir, filename);

    const fileExists = fs.existsSync(filepath);

    let content = '';
    if (!fileExists) {
      content = 'client_id,connection_time_ms\n';
    }

    const rows = data.map(d => `${d.clientId},${d.connectionTime.toFixed(3)}`).join('\n');
    content += rows + '\n';

    fs.appendFileSync(filepath, content);
  }

  /**
   * Write RTT (Round Trip Time) metrics to CSV (appends to existing file if present)
   * @param {string} serverName - Server name (e.g., 'ws', 'socketio')
   * @param {number} numClients - Number of clients in this test
   * @param {Array<{clientId: number, rtt: number, timestamp: number}>} data - RTT data
   */
  writeRTT(serverName, numClients, data) {
    const filename = `rtt_${serverName}_${numClients}clients.csv`;
    const filepath = path.join(this.dataDir, filename);

    const fileExists = fs.existsSync(filepath);

    let content = '';
    if (!fileExists) {
      content = 'client_id,rtt_ms,timestamp\n';
    }

    if (data && data.length > 0) {
      const rows = data.map(d => `${d.clientId},${d.rtt.toFixed(3)},${d.timestamp}`).join('\n');
      content += rows + '\n';
    }

    fs.appendFileSync(filepath, content);
  }

  /**
   * Write broadcast latency metrics to CSV (appends to existing file if present)
   * @param {string} serverName - Server name (e.g., 'ws', 'socketio')
   * @param {number} numClients - Number of clients in this test
   * @param {Array<{clientId: number, latency: number, timestamp: number}>} data - Broadcast latency data
   */
  writeBroadcastLatency(serverName, numClients, data) {
    const filename = `broadcast_latency_${serverName}_${numClients}clients.csv`;
    const filepath = path.join(this.dataDir, filename);

    const fileExists = fs.existsSync(filepath);

    let content = '';
    if (!fileExists) {
      content = 'client_id,latency_ms,timestamp\n';
    }

    const rows = data.map(d => `${d.clientId},${d.latency.toFixed(3)},${d.timestamp}`).join('\n');
    content += rows + '\n';

    fs.appendFileSync(filepath, content);
  }

  /**
   * Write reliability metrics to CSV (appends to existing file if present)
   * @param {string} serverName - Server name (e.g., 'ws', 'socketio')
   * @param {number} numClients - Number of clients in this test
   * @param {Object|Array} data - Reliability data (single object or array of objects)
   */
  writeReliabilityData(serverName, numClients, data) {
    const filename = `reliability_${serverName}_${numClients}clients.csv`;
    const filepath = path.join(this.dataDir, filename);

    const fileExists = fs.existsSync(filepath);

    let content = '';
    if (!fileExists) {
      content = 'client_id,messages_sent,messages_received,messages_lost,loss_rate_percent\n';
    }

    if (data) {
      const dataArray = Array.isArray(data) ? data : [data];
      if (dataArray.length > 0) {
        const rows = dataArray.map(d => {
          const clientId = d.clientId !== undefined ? d.clientId : 'overall';
          return `${clientId},${d.messagesSent},${d.messagesReceived},${d.messagesLost},${d.lossRate.toFixed(2)}`;
        }).join('\n');
        content += rows + '\n';
      }
    }

    fs.appendFileSync(filepath, content);
  }

  /**
   * Write connection stability metrics to CSV (appends to existing file if present)
   * @param {string} serverName - Server name (e.g., 'ws', 'socketio')
   * @param {number} numClients - Number of clients in this test
   * @param {Array<{clientId: number, disconnectCount: number}>} data - Connection stability data
   */
  writeConnectionStability(serverName, numClients, data) {
    const filename = `connection_stability_${serverName}_${numClients}clients.csv`;
    const filepath = path.join(this.dataDir, filename);

    const fileExists = fs.existsSync(filepath);

    let content = '';
    if (!fileExists) {
      content = 'client_id,disconnect_count\n';
    }

    const rows = data.map(d => `${d.clientId},${d.disconnectCount}`).join('\n');
    content += rows + '\n';

    fs.appendFileSync(filepath, content);
  }

}

export default Logger;
