/**
 * Configuration for load testing WebSocket servers.
 *
 * This configuration defines the progressive load test strategy,
 * failure thresholds, and measurement settings for comparative
 * performance analysis across WebSocket libraries.
 */

export default {
  // Ramp-up strategy
  rampUp: {
    baselineClients: 50,          // Initial client count
    incrementSize: 100,            // Clients added per step
    stabilizationTime: 15000,      // ms - time to stabilize after adding clients
    measurementWindow: 30000,      // ms - duration to collect metrics
    maxClients: 10000,             // Safety limit - stop at this client count
    maxDuration: 600000            // ms (10 min) - safety timeout
  },

  // Failure thresholds - any threshold exceeded stops the test
  thresholds: {
    connectionSuccessRate: 95,     // % - below this = failure
    messageLossRate: 5,            // % - above this = failure
    p95RttThreshold: 500,          // ms - above this = failure
    p99RttThreshold: 1000,         // ms - above this = failure
    cpuThreshold: 85,              // % - above this = failure (Node.js servers)
    memoryGrowthRate: 10,          // MB/min - above this = failure
    consecutiveYellowCount: 3      // Stop after N consecutive degraded states
  },

  // Measurement settings
  measurement: {
    rttSamplesPerClient: 10,       // RTT pings per client during measurement
    rttSampleInterval: 2000,       // ms between RTT pings
    resourcePollInterval: 1000,    // ms - server resource polling frequency
    messagePattern: 'echo'         // 'echo' or 'broadcast'
  },

  // Quick mode - for testing the load test itself
  quick: {
    baselineClients: 20,
    incrementSize: 50,
    stabilizationTime: 10000,
    measurementWindow: 20000,
    maxClients: 500,
    maxDuration: 180000            // 3 min
  }
};
