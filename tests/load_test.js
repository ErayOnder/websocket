#!/usr/bin/env node

/**
 * Progressive Load Test for WebSocket Servers
 *
 * This test progressively increases client load until performance
 * degradation thresholds are reached, measuring:
 * - Maximum healthy capacity
 * - Performance degradation curves
 * - Failure modes
 * - Resource efficiency
 */

import { spawn } from 'child_process';
import WebSocket from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import config from './configs/load_test_config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Server configurations
const SERVERS = {
  'ws': {
    name: 'nodejs-ws',
    path: '../servers/nodejs-ws/src/server.js',
    port: 8080
  },
  'socketio': {
    name: 'nodejs-socketio',
    path: '../servers/nodejs-socketio/src/server.js',
    port: 8081
  },
  'golang-ws': {
    name: 'golang-websocket',
    path: '../servers/golang-websocket/main.go',
    port: 8082,
    isGo: true
  },
  'golang-gorilla': {
    name: 'golang-gorilla-websocket',
    path: '../servers/golang-gorilla-websocket/main.go',
    port: 8083,
    isGo: true
  }
};

class LoadTest {
  constructor(serverKey, useQuickMode = false) {
    this.serverConfig = SERVERS[serverKey];
    if (!this.serverConfig) {
      throw new Error(`Unknown server: ${serverKey}`);
    }

    this.config = useQuickMode ? config.quick : config.rampUp;
    this.thresholds = config.thresholds;
    this.measurement = config.measurement;

    this.serverProcess = null;
    this.clients = [];
    this.metrics = [];
    this.healthHistory = [];
    this.startTime = null;
    this.dataDir = path.resolve(__dirname, '../data/raw');
    this.currentClientCount = 0;
    this.consecutiveYellowCount = 0;
    this.testComplete = false;

    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Main test execution
   */
  async run() {
    console.log('='.repeat(70));
    console.log('WebSocket Load Test');
    console.log('='.repeat(70));
    console.log(`Server: ${this.serverConfig.name}`);
    console.log(`Port: ${this.serverConfig.port}`);
    console.log(`Baseline: ${this.config.baselineClients} clients`);
    console.log(`Increment: ${this.config.incrementSize} clients/step`);
    console.log(`Max clients: ${this.config.maxClients}`);
    console.log('='.repeat(70));
    console.log();

    this.startTime = Date.now();

    try {
      // Start server
      console.log('Starting server...');
      await this.startServer();
      await this.sleep(3000); // Give server time to initialize

      // Establish baseline
      console.log(`\nEstablishing baseline with ${this.config.baselineClients} clients...`);
      await this.addClients(this.config.baselineClients);
      await this.stabilizeAndMeasure(true);

      // Progressive ramp-up loop
      let stepNumber = 1;
      while (!this.testComplete) {
        // Check safety limits
        if (this.currentClientCount >= this.config.maxClients) {
          console.log(`\n⚠️  Reached max client limit: ${this.config.maxClients}`);
          this.recordFailure('max_clients_reached');
          break;
        }

        if (Date.now() - this.startTime >= this.config.maxDuration) {
          console.log(`\n⏱️  Reached max duration: ${this.config.maxDuration / 1000}s`);
          this.recordFailure('max_duration_reached');
          break;
        }

        // Add increment of clients
        const targetCount = this.currentClientCount + this.config.incrementSize;
        console.log(`\n--- Step ${stepNumber}: Adding ${this.config.incrementSize} clients (${this.currentClientCount} → ${targetCount}) ---`);

        await this.addClients(this.config.incrementSize);
        stepNumber++;

        // Stabilize and measure
        const shouldContinue = await this.stabilizeAndMeasure(false);
        if (!shouldContinue) {
          break;
        }
      }

      // Generate report
      console.log('\n' + '='.repeat(70));
      console.log('Test Complete!');
      console.log('='.repeat(70));
      this.generateReport();

    } catch (error) {
      console.error('\n❌ Test failed with error:', error.message);
      this.recordFailure('server_crashed', error.message);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Start the WebSocket server
   */
  async startServer() {
    const serverPath = path.resolve(__dirname, this.serverConfig.path);

    if (this.serverConfig.isGo) {
      this.serverProcess = spawn('go', ['run', serverPath], {
        env: { ...process.env, PORT: this.serverConfig.port.toString() },
        cwd: path.dirname(serverPath)
      });
    } else {
      this.serverProcess = spawn('node', [serverPath], {
        env: { ...process.env, PORT: this.serverConfig.port.toString() }
      });
    }

    this.serverProcess.stdout.on('data', (data) => {
      // Suppress normal output, only show errors
    });

    this.serverProcess.stderr.on('data', (data) => {
      console.error(`Server error: ${data}`);
    });

    this.serverProcess.on('close', (code) => {
      if (code !== 0 && !this.testComplete) {
        console.error(`\n❌ Server process exited with code ${code}`);
        this.recordFailure('server_crashed', `Exit code: ${code}`);
      }
    });

    console.log(`  Server started (PID: ${this.serverProcess.pid})`);
  }

  /**
   * Add N new clients
   */
  async addClients(count) {
    const url = `ws://localhost:${this.serverConfig.port}`;
    const connectionPromises = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < count; i++) {
      const promise = new Promise((resolve) => {
        const client = new WebSocket(url);
        const clientId = this.clients.length;

        const timeout = setTimeout(() => {
          failureCount++;
          client.terminate();
          resolve(false);
        }, 5000);

        client.on('open', () => {
          clearTimeout(timeout);
          successCount++;
          this.clients.push({
            id: clientId,
            socket: client,
            rttSamples: [],
            messagesSent: 0,
            messagesReceived: 0,
            connected: true
          });
          resolve(true);
        });

        client.on('error', () => {
          clearTimeout(timeout);
          failureCount++;
          resolve(false);
        });

        client.on('message', (data) => {
          const clientData = this.clients.find(c => c.id === clientId);
          if (clientData) {
            clientData.messagesReceived++;

            // Parse RTT measurements
            try {
              const msg = JSON.parse(data);
              if (msg.type === 'pong' && msg.timestamp) {
                const rtt = Date.now() - msg.timestamp;
                clientData.rttSamples.push(rtt);
              }
            } catch (e) {
              // Not a JSON message, ignore
            }
          }
        });

        client.on('close', () => {
          const clientData = this.clients.find(c => c.id === clientId);
          if (clientData) {
            clientData.connected = false;
          }
        });
      });

      connectionPromises.push(promise);
    }

    await Promise.all(connectionPromises);
    this.currentClientCount = this.clients.filter(c => c.connected).length;

    console.log(`  ✓ Connected: ${successCount}/${count} (${((successCount / count) * 100).toFixed(1)}%)`);
    if (failureCount > 0) {
      console.log(`  ✗ Failed: ${failureCount}/${count}`);
    }
    console.log(`  → Total active clients: ${this.currentClientCount}`);

    return { successCount, failureCount, successRate: (successCount / count) * 100 };
  }

  /**
   * Stabilize system and measure performance
   */
  async stabilizeAndMeasure(isBaseline) {
    // Stabilization period
    if (!isBaseline) {
      console.log(`  Stabilizing for ${this.config.stabilizationTime / 1000}s...`);
      await this.sleep(this.config.stabilizationTime);
    }

    // Measurement window
    console.log(`  Measuring performance for ${this.config.measurementWindow / 1000}s...`);
    const metrics = await this.measurePerformance(this.config.measurementWindow);

    // Evaluate health
    const health = this.evaluateHealth(metrics);
    console.log(`  Health Status: ${this.formatHealthStatus(health.status)}`);
    console.log(`    Connection Success: ${metrics.connectionSuccessRate.toFixed(1)}%`);
    console.log(`    Message Loss: ${metrics.messageLossRate.toFixed(2)}%`);
    console.log(`    RTT P95: ${metrics.rtt_p95.toFixed(1)}ms`);
    console.log(`    RTT P99: ${metrics.rtt_p99.toFixed(1)}ms`);
    if (metrics.cpu_percent !== null) {
      console.log(`    CPU: ${metrics.cpu_percent.toFixed(1)}%`);
    }

    // Record metrics
    this.metrics.push({
      timestamp: new Date().toISOString(),
      ...metrics,
      health_status: health.status
    });

    // Decision logic
    if (health.status === 'RED') {
      console.log(`  ❌ FAILURE: ${health.reason}`);
      this.recordFailure(health.failureType, health.reason);
      return false;
    }

    if (health.status === 'YELLOW') {
      this.consecutiveYellowCount++;
      console.log(`  ⚠️  Performance degraded (${this.consecutiveYellowCount}/${this.thresholds.consecutiveYellowCount})`);

      if (this.consecutiveYellowCount >= this.thresholds.consecutiveYellowCount) {
        console.log(`  ❌ Too many consecutive degraded states`);
        this.recordFailure('consecutive_degradation', `${this.consecutiveYellowCount} consecutive YELLOW states`);
        return false;
      }
    } else {
      this.consecutiveYellowCount = 0;
    }

    return true;
  }

  /**
   * Measure performance during measurement window
   */
  async measurePerformance(duration) {
    const startTime = Date.now();
    const resourceSamples = [];

    // Reset RTT samples
    this.clients.forEach(c => {
      c.rttSamples = [];
      c.messagesSent = 0;
      c.messagesReceived = 0;
    });

    // Collect RTT samples
    const sampleInterval = this.measurement.rttSampleInterval;
    const sampleCount = Math.floor(duration / sampleInterval);

    for (let i = 0; i < sampleCount; i++) {
      // Send ping to all clients
      const timestamp = Date.now();
      this.clients.forEach(client => {
        if (client.connected) {
          try {
            client.socket.send(JSON.stringify({ type: 'ping', timestamp }));
            client.messagesSent++;
          } catch (e) {
            // Client disconnected
          }
        }
      });

      // Collect server resources
      const resources = await this.getServerResources();
      if (resources) {
        resourceSamples.push(resources);
      }

      await this.sleep(sampleInterval);
    }

    // Calculate metrics
    const activeClients = this.clients.filter(c => c.connected);
    const allRttSamples = activeClients.flatMap(c => c.rttSamples);

    const totalSent = activeClients.reduce((sum, c) => sum + c.messagesSent, 0);
    const totalReceived = activeClients.reduce((sum, c) => sum + c.messagesReceived, 0);
    const messagesLost = totalSent - totalReceived;
    const messageLossRate = totalSent > 0 ? (messagesLost / totalSent) * 100 : 0;

    // Connection success rate (based on current active vs expected)
    const connectionSuccessRate = (activeClients.length / this.currentClientCount) * 100;

    // RTT percentiles
    const rtt_mean = allRttSamples.length > 0 ? allRttSamples.reduce((a, b) => a + b, 0) / allRttSamples.length : 0;
    const rtt_p50 = this.percentile(allRttSamples, 50);
    const rtt_p95 = this.percentile(allRttSamples, 95);
    const rtt_p99 = this.percentile(allRttSamples, 99);

    // Resource metrics
    const avgCpu = resourceSamples.length > 0
      ? resourceSamples.reduce((sum, s) => sum + (s.cpu_percent || 0), 0) / resourceSamples.length
      : null;
    const avgMemory = resourceSamples.length > 0
      ? resourceSamples.reduce((sum, s) => sum + (s.memory_mb || 0), 0) / resourceSamples.length
      : null;

    // Memory growth rate (MB/min)
    let memoryGrowthRate = 0;
    if (resourceSamples.length >= 2) {
      const firstMem = resourceSamples[0].memory_mb || 0;
      const lastMem = resourceSamples[resourceSamples.length - 1].memory_mb || 0;
      const durationMin = duration / 60000;
      memoryGrowthRate = (lastMem - firstMem) / durationMin;
    }

    // Throughput
    const durationSec = duration / 1000;
    const messagesPerSecond = totalReceived / durationSec;

    return {
      client_count: this.currentClientCount,
      connection_success_rate: connectionSuccessRate,
      connection_failures: this.currentClientCount - activeClients.length,
      rtt_mean,
      rtt_p50,
      rtt_p95,
      rtt_p99,
      message_loss_rate: messageLossRate,
      messages_per_second: messagesPerSecond,
      cpu_percent: avgCpu,
      memory_mb: avgMemory,
      memory_growth_rate: memoryGrowthRate
    };
  }

  /**
   * Get server resource metrics
   */
  async getServerResources() {
    // Read from latest resource CSV file
    const resourceFile = path.join(this.dataDir, `resources_${this.serverConfig.name}.csv`);

    if (!fs.existsSync(resourceFile)) {
      return null;
    }

    try {
      const content = fs.readFileSync(resourceFile, 'utf-8');
      const lines = content.trim().split('\n');
      if (lines.length < 2) return null;

      const lastLine = lines[lines.length - 1];
      const values = lastLine.split(',');

      // Parse based on server type
      if (this.serverConfig.isGo) {
        // Go: timestamp,cpu_goroutines,memory_alloc_mb,memory_sys_mb,gc_count
        return {
          cpu_percent: null, // Go doesn't track CPU %
          memory_mb: parseFloat(values[2]) || 0
        };
      } else {
        // Node.js: timestamp,cpu_user_ms,cpu_system_ms,cpu_percent,memory_rss_mb,...
        return {
          cpu_percent: parseFloat(values[3]) || 0,
          memory_mb: parseFloat(values[4]) || 0
        };
      }
    } catch (e) {
      return null;
    }
  }

  /**
   * Evaluate health status based on metrics
   */
  evaluateHealth(metrics) {
    // Check RED conditions (failure)
    if (metrics.connectionSuccessRate < this.thresholds.connectionSuccessRate) {
      return {
        status: 'RED',
        reason: `Connection success rate ${metrics.connectionSuccessRate.toFixed(1)}% < ${this.thresholds.connectionSuccessRate}%`,
        failureType: 'connection_failure_threshold'
      };
    }

    if (metrics.messageLossRate > this.thresholds.messageLossRate) {
      return {
        status: 'RED',
        reason: `Message loss rate ${metrics.messageLossRate.toFixed(2)}% > ${this.thresholds.messageLossRate}%`,
        failureType: 'message_loss_threshold'
      };
    }

    if (metrics.rtt_p95 > this.thresholds.p95RttThreshold) {
      return {
        status: 'RED',
        reason: `P95 RTT ${metrics.rtt_p95.toFixed(1)}ms > ${this.thresholds.p95RttThreshold}ms`,
        failureType: 'latency_threshold_p95'
      };
    }

    if (metrics.rtt_p99 > this.thresholds.p99RttThreshold) {
      return {
        status: 'RED',
        reason: `P99 RTT ${metrics.rtt_p99.toFixed(1)}ms > ${this.thresholds.p99RttThreshold}ms`,
        failureType: 'latency_threshold_p99'
      };
    }

    if (metrics.cpu_percent !== null && metrics.cpu_percent > this.thresholds.cpuThreshold) {
      return {
        status: 'RED',
        reason: `CPU ${metrics.cpu_percent.toFixed(1)}% > ${this.thresholds.cpuThreshold}%`,
        failureType: 'cpu_threshold'
      };
    }

    if (Math.abs(metrics.memory_growth_rate) > this.thresholds.memoryGrowthRate) {
      return {
        status: 'RED',
        reason: `Memory growth ${metrics.memory_growth_rate.toFixed(2)} MB/min > ${this.thresholds.memoryGrowthRate} MB/min`,
        failureType: 'memory_growth_threshold'
      };
    }

    // Check YELLOW conditions (degraded)
    if (metrics.connectionSuccessRate < 99 ||
        metrics.messageLossRate > 1 ||
        metrics.rtt_p95 > 100 ||
        (metrics.cpu_percent !== null && metrics.cpu_percent > 70)) {
      return { status: 'YELLOW', reason: 'Performance degraded' };
    }

    // GREEN (healthy)
    return { status: 'GREEN', reason: 'Healthy' };
  }

  /**
   * Record test failure
   */
  recordFailure(failureType, reason = '') {
    this.testComplete = true;
    const lastMetric = this.metrics[this.metrics.length - 1];
    if (lastMetric) {
      lastMetric.failure_reason = failureType;
      lastMetric.failure_details = reason;
    }
  }

  /**
   * Generate and save test report
   */
  generateReport() {
    const duration = (Date.now() - this.startTime) / 1000;
    const maxClients = Math.max(...this.metrics.map(m => m.client_count));
    const lastMetric = this.metrics[this.metrics.length - 1];

    // Find last healthy state
    const lastHealthyMetric = [...this.metrics].reverse().find(m => m.health_status === 'GREEN');
    const maxHealthyClients = lastHealthyMetric ? lastHealthyMetric.client_count : this.config.baselineClients;

    console.log();
    console.log('Summary:');
    console.log(`  Duration: ${duration.toFixed(1)}s`);
    console.log(`  Max Healthy Clients: ${maxHealthyClients}`);
    console.log(`  Max Total Clients: ${maxClients}`);
    console.log(`  Total Steps: ${this.metrics.length}`);
    if (lastMetric && lastMetric.failure_reason) {
      console.log(`  Failure Reason: ${lastMetric.failure_reason}`);
      if (lastMetric.failure_details) {
        console.log(`  Details: ${lastMetric.failure_details}`);
      }
    }

    // Save CSV
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const csvPath = path.join(this.dataDir, `load_test_${this.serverConfig.name}_${timestamp}.csv`);

    const header = 'timestamp,client_count,connection_success_rate,connection_failures,rtt_mean,rtt_p50,rtt_p95,rtt_p99,message_loss_rate,messages_per_second,cpu_percent,memory_mb,memory_growth_rate,health_status,failure_reason,failure_details\n';
    const rows = this.metrics.map(m =>
      `${m.timestamp},${m.client_count},${m.connection_success_rate.toFixed(2)},${m.connection_failures},${m.rtt_mean.toFixed(2)},${m.rtt_p50.toFixed(2)},${m.rtt_p95.toFixed(2)},${m.rtt_p99.toFixed(2)},${m.message_loss_rate.toFixed(2)},${m.messages_per_second.toFixed(2)},${m.cpu_percent !== null ? m.cpu_percent.toFixed(2) : ''},${m.memory_mb !== null ? m.memory_mb.toFixed(2) : ''},${m.memory_growth_rate.toFixed(2)},${m.health_status},${m.failure_reason || ''},${m.failure_details || ''}`
    ).join('\n');

    fs.writeFileSync(csvPath, header + rows);
    console.log(`\n📊 Results saved to: ${csvPath}`);
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    console.log('\nCleaning up...');

    // Close all client connections
    this.clients.forEach(client => {
      try {
        if (client.connected) {
          client.socket.close();
        }
      } catch (e) {
        // Ignore
      }
    });

    // Stop server
    if (this.serverProcess) {
      this.serverProcess.kill();
      console.log('  Server stopped');
    }

    await this.sleep(1000);
  }

  /**
   * Helper: Calculate percentile
   */
  percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Helper: Sleep
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper: Format health status
   */
  formatHealthStatus(status) {
    const colors = {
      'GREEN': '\x1b[32m✓ GREEN\x1b[0m',
      'YELLOW': '\x1b[33m⚠ YELLOW\x1b[0m',
      'RED': '\x1b[31m✗ RED\x1b[0m'
    };
    return colors[status] || status;
  }
}

// CLI
const args = process.argv.slice(2);
const libraryArg = args.find(arg => arg.startsWith('--library='));
const quickMode = args.includes('--quick');
const allLibraries = args.includes('--all');

if (!libraryArg && !allLibraries) {
  console.log('Usage:');
  console.log('  node load_test.js --library=<ws|socketio|golang-ws|golang-gorilla> [--quick]');
  console.log('  node load_test.js --all [--quick]');
  console.log();
  console.log('Options:');
  console.log('  --library=<name>  Test specific library');
  console.log('  --all             Test all libraries sequentially');
  console.log('  --quick           Use quick mode (smaller limits, faster test)');
  process.exit(1);
}

async function runTests() {
  let librariesToTest = [];

  if (allLibraries) {
    librariesToTest = Object.keys(SERVERS);
  } else {
    const library = libraryArg.split('=')[1];
    if (!SERVERS[library]) {
      console.error(`Unknown library: ${library}`);
      console.error(`Available: ${Object.keys(SERVERS).join(', ')}`);
      process.exit(1);
    }
    librariesToTest = [library];
  }

  for (const library of librariesToTest) {
    const test = new LoadTest(library, quickMode);
    await test.run();

    if (librariesToTest.length > 1) {
      console.log('\nWaiting 5 seconds before next test...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
