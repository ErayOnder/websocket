import LoadTestRunner from './runners/load-test-runner.js';
import BroadcastTestRunner from './runners/broadcast-test-runner.js';
import StressTestRunner from './runners/stress-test-runner.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    mode: 'load', // 'init', 'load', 'broadcast', 'stress'
    serverUrl: 'ws://localhost:8080',
    serverName: 'ws',
    clientType: 'ws',

    // Defaults (will be overridden by mode settings)
    loadPhases: [400, 800, 1600, 3200, 6400],
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
  -p, --load-phases <phases>     Comma-separated client counts (default: 200,400,800,1600,3200)
  -i, --iterations <n>           Iterations per phase (default: 3)
  -d, --duration <seconds>       Test duration in seconds (default: 60)
  --message-interval <ms>        Message interval for load/stress test (default: 100ms, stress: 5ms)
  --broadcast-interval <ms>      Broadcast interval (default: 3000ms)

Direct CLI Examples:
  node benchmark.js --mode init --server ws://localhost:8080 --name ws --client-type ws
  node benchmark.js --mode load --server http://localhost:3000 --name socketio --client-type socketio
  node benchmark.js --mode broadcast --server ws://localhost:8080 --name golang-gorilla --client-type ws
  node benchmark.js --mode stress --server ws://localhost:8080 --name ws --client-type ws

NPM Script Examples:
  npm run benchmark:help                    # Show this help
  
  # Init tests (quick sanity check)
  npm run test:ws                           # Test WebSocket server
  npm run test:socketio                     # Test Socket.IO server
  npm run test:go_gorilla                   # Test Go Gorilla server
  npm run test:go_coder                     # Test Go Coder server
  npm run test:go_gobwas                    # Test Go Gobwas server
  npm run test:go_fasthttp                  # Test Go FastHTTP server
  
  # Load tests (RTT, Connection Time)
  npm run test:load:ws                      # Load test WebSocket
  npm run test:load:socketio                # Load test Socket.IO
  npm run test:load:go_gorilla              # Load test Go Gorilla
  npm run test:load:go_coder                # Load test Go Coder
  npm run test:load:go_gobwas               # Load test Go Gobwas
  npm run test:load:go_fasthttp             # Load test Go FastHTTP
  
  # Broadcast tests (Latency)
  npm run test:broadcast:ws                 # Broadcast test WebSocket
  npm run test:broadcast:socketio           # Broadcast test Socket.IO
  npm run test:broadcast:go_gorilla         # Broadcast test Go Gorilla
  npm run test:broadcast:go_coder           # Broadcast test Go Coder
  npm run test:broadcast:go_gobwas          # Broadcast test Go Gobwas
  npm run test:broadcast:go_fasthttp        # Broadcast test Go FastHTTP
  
  # Stress tests (Throughput, Stability, Reliability)
  npm run test:stress:ws                    # Stress test WebSocket
  npm run test:stress:socketio              # Stress test Socket.IO
  npm run test:stress:go_gorilla            # Stress test Go Gorilla
  npm run test:stress:go_coder              # Stress test Go Coder
  npm run test:stress:go_gobwas             # Stress test Go Gobwas
  npm run test:stress:go_fasthttp           # Stress test Go FastHTTP
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

async function runStressTest(config, metrics) {
  console.log('');
  console.log(`Starting Stress Test: ${config.mode} mode...`);
  console.log('─'.repeat(70));

  const runner = new StressTestRunner({
    serverUrl: config.serverUrl,
    serverName: config.serverName,
    clientType: config.clientType,
    testDuration: config.testDuration,
    messageInterval: config.messageInterval
  });

  const results = await runner.runRampUp(config.loadPhases, metrics);

  console.log('');
  console.log('Stress Test Results Summary:');
  console.log('─'.repeat(70));
  results.forEach(result => {
    if (result.success) {
      const { numClients, reliabilityData } = result;
      console.log(`${numClients} clients: Loss=${reliabilityData.lossRate}% | Sent=${reliabilityData.messagesSent}`);
    } else {
      console.log(`${result.numClients} clients: FAILED - ${result.error}`);
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
    if (config.mode === 'init') {
      // Run all tests for init
      await runLoadTest(config, ['rtt', 'connection_time']);
      await runBroadcastTest(config, ['broadcast_latency']);
      await runStressTest(config, ['reliability', 'connection_stability']);
    } else if (config.mode === 'broadcast') {
      await runBroadcastTest(config, ['broadcast_latency']);
    } else if (config.mode === 'stress') {
      await runStressTest(config, ['reliability', 'connection_stability']);
    } else {
      await runLoadTest(config, ['rtt', 'connection_time']);
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
