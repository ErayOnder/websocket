import LoadTestRunner from './runners/load-test-runner.js';
import BroadcastTestRunner from './runners/broadcast-test-runner.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    mode: 'load', // 'init', 'load', 'broadcast', 'stress'
    serverUrl: 'ws://localhost:8080',
    serverName: 'ws',
    clientType: 'ws',

    // Defaults (will be overridden by mode settings)
    loadPhases: [200, 400, 800, 1600, 3200],
    iterations: 3,
    testDuration: 60000, // 60 seconds
    messageInterval: 100, // For load test
    broadcastInterval: 3000 // For broadcast test
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--mode' || arg === '-m') {
      config.mode = args[++i];
    } else if (arg === '--server' || arg === '-s') {
      config.serverUrl = args[++i];
    } else if (arg === '--name' || arg === '-n') {
      config.serverName = args[++i];
    } else if (arg === '--client-type' || arg === '-c') {
      config.clientType = args[++i];
    } else if (arg === '--load-phases' || arg === '-p') {
      config.loadPhases = args[++i].split(',').map(n => parseInt(n.trim()));
    } else if (arg === '--iterations' || arg === '-i') {
      config.iterations = parseInt(args[++i]);
    } else if (arg === '--duration' || arg === '-d') {
      config.testDuration = parseInt(args[++i]) * 1000; // Convert to ms
    } else if (arg === '--message-interval') {
      config.messageInterval = parseInt(args[++i]);
    } else if (arg === '--broadcast-interval') {
      config.broadcastInterval = parseInt(args[++i]);
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  applyModeDefaults(config);
  return config;
}

function applyModeDefaults(config) {
  switch (config.mode) {
    case 'init':
      config.loadPhases = [5];
      config.iterations = 1;
      config.testDuration = 5000; // 5 seconds
      break;

    case 'load':
      // Default settings are already good for load test
      // Metrics: connection_time, rtt
      break;

    case 'broadcast':
      // Metrics: broadcast_latency
      break;

    case 'stress':
      // High throughput settings
      // Metrics: throughput, resources, stability, reliability
      if (!process.argv.includes('--load-phases') && !process.argv.includes('-p')) {
        config.loadPhases = [50, 100, 200, 400, 800];
      }
      if (!process.argv.includes('--message-interval')) {
        config.messageInterval = 5; // 5ms interval
      }
      if (!process.argv.includes('--duration') && !process.argv.includes('-d')) {
        config.testDuration = 30000; // 30 seconds
      }
      break;

    default:
      console.error(`Unknown mode: ${config.mode}`);
      printUsage();
      process.exit(1);
  }
}

function printUsage() {
  console.log(`
WebSocket Benchmark Suite
==========================

Usage: node benchmark.js [options]

Modes:
  --mode, -m <mode>              Test mode (required):
                                 - init: Quick sanity check (5s, 5 clients)
                                 - load: Standard load test (records RTT, Connection Time)
                                 - broadcast: Broadcast test (records Latency)
                                 - stress: Stress test (records Throughput, Stability, Reliability)

Server Configuration:
  -s, --server <url>             Server URL (default: ws://localhost:8080)
  -n, --name <name>              Server name for CSV files (default: ws)
  -c, --client-type <type>       Client type: ws or socketio (default: ws)

Test Configuration:
  -p, --load-phases <phases>     Comma-separated client counts
  -i, --iterations <n>           Iterations per phase (default: 3)
  -d, --duration <seconds>       Test duration in seconds
  --message-interval <ms>        Message interval for load test
  --broadcast-interval <ms>      Broadcast interval

Examples:
  node benchmark.js --mode init
  node benchmark.js --mode load
  node benchmark.js --mode broadcast
  node benchmark.js --mode stress
  `);
}

async function runLoadTest(config, metrics) {
  console.log('');
  console.log(`Starting Test: ${config.mode} mode...`);
  console.log('─'.repeat(70));

  const runner = new LoadTestRunner({
    serverUrl: config.serverUrl,
    serverName: config.serverName,
    clientType: config.clientType,
    testDuration: config.testDuration,
    messageInterval: config.messageInterval
  });

  const results = await runner.runPhased(config.loadPhases, config.iterations, metrics);

  console.log('');
  console.log('Load Test Results Summary:');
  console.log('─'.repeat(70));
  results.forEach(result => {
    if (result.success) {
      const { numClients, iteration, stats, reliabilityData } = result;
      console.log(`${numClients} clients (iter ${iteration}): RTT p50=${stats.median}ms p95=${stats.p95}ms | Loss=${reliabilityData.lossRate}%`);
    } else {
      console.log(`${result.numClients} clients (iter ${result.iteration}): FAILED - ${result.error}`);
    }
  });

  return results;
}

async function runBroadcastTest(config, metrics) {
  console.log('');
  console.log(`Starting Broadcast Test (${config.mode} mode)...`);
  console.log('─'.repeat(70));

  const runner = new BroadcastTestRunner({
    serverUrl: config.serverUrl,
    serverName: config.serverName,
    clientType: config.clientType,
    testDuration: config.testDuration,
    broadcastInterval: config.broadcastInterval
  });

  const results = await runner.runPhased(config.loadPhases, config.iterations, metrics);

  console.log('');
  console.log('Broadcast Test Results Summary:');
  console.log('─'.repeat(70));
  results.forEach(result => {
    if (result.success) {
      const { numClients, iteration, stats, broadcastCount } = result;
      console.log(`${numClients} clients (iter ${iteration}): Latency mean=${stats.mean}ms p50=${stats.median}ms | Broadcasts=${broadcastCount}`);
    } else {
      console.log(`${result.numClients} clients (iter ${result.iteration}): FAILED - ${result.error}`);
    }
  });

  return results;
}

async function main() {
  const config = parseArgs();

  console.log('');
  console.log('═'.repeat(70));
  console.log('WebSocket Benchmark Suite');
  console.log('═'.repeat(70));
  console.log('');
  console.log('Mode:               ' + config.mode.toUpperCase());
  console.log('Server URL:         ' + config.serverUrl);
  console.log('Server Name:        ' + config.serverName);
  console.log('Client Type:        ' + config.clientType);
  console.log('Load Phases:        ' + config.loadPhases.join(', '));
  console.log('Iterations:         ' + config.iterations);
  console.log('Test Duration:      ' + (config.testDuration / 1000) + 's');

  if (config.mode === 'stress') {
    console.log('Message Interval:   ' + config.messageInterval + 'ms');
  }

  console.log('');
  console.log('═'.repeat(70));

  try {
    // Define metrics to record based on mode
    let metrics = [];

    if (config.mode === 'init') {
      // Record everything for init
      metrics = ['rtt', 'connection_time', 'broadcast_latency', 'reliability', 'stability'];
    } else if (config.mode === 'load') {
      metrics = ['rtt', 'connection_time'];
    } else if (config.mode === 'broadcast') {
      metrics = ['broadcast_latency'];
    } else if (config.mode === 'stress') {
      // Note: throughput and resources are recorded by server side
      metrics = ['reliability', 'stability'];
    }

    if (config.mode === 'broadcast') {
      await runBroadcastTest(config, metrics);
    } else if (config.mode === 'init') {
      // Run both for init
      await runLoadTest(config, metrics);
      await runBroadcastTest(config, metrics);
    } else {
      // load and stress modes use LoadTestRunner
      await runLoadTest(config, metrics);
    }

    console.log('');
    console.log('═'.repeat(70));
    console.log('✓ Test Complete!');
    console.log('═'.repeat(70));
    console.log('');
    console.log('Results saved to: ../../data/raw/');
    console.log('');

  } catch (error) {
    console.error('');
    console.error('═'.repeat(70));
    console.error('✗ Test Failed!');
    console.error('═'.repeat(70));
    console.error('');
    console.error('Error: ' + error.message);
    console.error('');
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    console.error('');
    process.exit(1);
  }
}

main();
