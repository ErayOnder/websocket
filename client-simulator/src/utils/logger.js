import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Logger {
  constructor(dataDir = '../../data/raw') {
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
   * Write connection time metrics to CSV
   * @param {string} library - Library name (e.g., 'ws', 'socketio')
   * @param {number} numClients - Number of clients in this test
   * @param {Array<{clientId: number, connectionTime: number}>} data - Connection time data
   */
  writeConnectionTime(library, numClients, data) {
    const filename = `connection_time_${library}_${numClients}clients.csv`;
    const filepath = path.join(this.dataDir, filename);

    const header = 'client_id,connection_time_ms\n';
    const rows = data.map(d => `${d.clientId},${d.connectionTime}`).join('\n');
    const content = header + rows + '\n';

    fs.writeFileSync(filepath, content);
    console.log(`[Logger] Wrote connection time data to ${filename}`);
  }

  /**
   * Write RTT (Round Trip Time) metrics to CSV
   * @param {string} library - Library name (e.g., 'ws', 'socketio')
   * @param {number} numClients - Number of clients in this test
   * @param {Array<{clientId: number, rtt: number, timestamp: number}>} data - RTT data
   */
  writeRTT(library, numClients, data) {
    const filename = `rtt_${library}_${numClients}clients.csv`;
    const filepath = path.join(this.dataDir, filename);

    const header = 'client_id,rtt_ms,timestamp\n';
    const rows = data.map(d => `${d.clientId},${d.rtt},${d.timestamp}`).join('\n');
    const content = header + rows + '\n';

    fs.writeFileSync(filepath, content);
    console.log(`[Logger] Wrote RTT data to ${filename}`);
  }

  /**
   * Write broadcast latency metrics to CSV
   * @param {string} library - Library name (e.g., 'ws', 'socketio')
   * @param {number} numClients - Number of clients in this test
   * @param {Array<{clientId: number, latency: number, timestamp: number}>} data - Broadcast latency data
   */
  writeBroadcastLatency(library, numClients, data) {
    const filename = `broadcast_latency_${library}_${numClients}clients.csv`;
    const filepath = path.join(this.dataDir, filename);

    const header = 'client_id,latency_ms,timestamp\n';
    const rows = data.map(d => `${d.clientId},${d.latency},${d.timestamp}`).join('\n');
    const content = header + rows + '\n';

    fs.writeFileSync(filepath, content);
    console.log(`[Logger] Wrote broadcast latency data to ${filename}`);
  }
}

export default Logger;
