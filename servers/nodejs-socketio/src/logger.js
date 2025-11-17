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
   * Append throughput data to CSV
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
}

export default Logger;
