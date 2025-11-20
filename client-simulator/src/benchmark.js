import LoadTestRunner from './runners/load-test-runner.js';
import BroadcastTestRunner from './runners/broadcast-test-runner.js';

/**
 * WebSocket Benchmark Suite
 * Single entry point for all performance testing
 *
 * Modes:
 * 1. Init mode: Quick sanity check with 5 clients, 1 iteration
 * 2. Full mode: Complete benchmark with load and broadcast tests
 */

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    mode: 'full', // 'init' or 'full'
    serverUrl: 'ws://localhost:8080',
    serverName: 'ws',
    clientType: 'ws',
    testType: 'all', // 'load', 'broadcast', or 'all'

    // Full benchmark defaults
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
    } else if (arg === '--test' || arg === '-t') {
      config.testType = args[++i];
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

  // Override settings for init mode
  if (config.mode === 'init') {
    config.loadPhases = [5];
    config.iterations = 1;
    config.testDuration = 5000; // 5 seconds
  }

  return config;
}

function printUsage() {
  console.log(`
WebSocket Benchmark Suite
==========================

Single entry point for all WebSocket performance testing.

Usage: node benchmark.js [options]

Modes:
  --mode, -m <mode>              Test mode: 'init' or 'full' (default: full)
                                 - init: Quick test with 1 client, 1 iteration (5s)
                                 - full: Complete benchmark suite

Server Configuration:
  -s, --server <url>             Server URL (default: ws://localhost:8080)
  -n, --name <name>              Server name for CSV files (default: ws)
  -c, --client-type <type>       Client type: ws or socketio (default: ws)

Test Configuration:
  -t, --test <type>              Test type: load, broadcast, or all (default: all)
  -p, --load-phases <phases>     Comma-separated client counts (default: 200,400,800,1600,3200)
  -i, --iterations <n>           Iterations per phase (default: 3)
  -d, --duration <seconds>       Test duration in seconds (default: 60)
  --message-interval <ms>        Message interval for load test (default: 100)
  --broadcast-interval <ms>      Broadcast interval (default: 3000)

Other:
  -h, --help                     Show this help message

Examples:
  # Quick initialization test (recommended first run)
  node benchmark.js --mode init

  # Full benchmark with default settings
  node benchmark.js

  # Full benchmark for Socket.IO server
  node benchmark.js --server http://localhost:3000 --name socketio --client-type socketio

  # Only load test with custom phases
  node benchmark.js --test load --load-phases 100,200,400

  # Quick 10-second test
  node benchmark.js --duration 10 --load-phases 50,100
  `);
}

async function runLoadTest(config) {
  console.log('');
  console.log('Starting Load Test...');
  console.log('─'.repeat(70));

  const runner = new LoadTestRunner({
    serverUrl: config.serverUrl,
    serverName: config.serverName,
    clientType: config.clientType,
    testDuration: config.testDuration,
    messageInterval: config.messageInterval
  });

  const results = await runner.runPhased(config.loadPhases, config.iterations);

  console.log('');
  console.log('Load Test Results Summary:');
  console.log('─'.repeat(70));
  results.forEach(result => {
    if (result.success) {
      const { numClients, iteration, stats, reliabilityData } = result;
      console.log(`${numClients} clients (iter ${iteration}): RTT p50=${stats.median}ms p95=${stats.p95}ms p99=${stats.p99}ms | Loss=${reliabilityData.lossRate}%`);
    } else {
      console.log(`${result.numClients} clients (iter ${result.iteration}): FAILED - ${result.error}`);
    }
  });

  return results;
}

async function runBroadcastTest(config) {
  console.log('');
  console.log('Starting Broadcast Test...');
  console.log('─'.repeat(70));

  const runner = new BroadcastTestRunner({
    serverUrl: config.serverUrl,
    serverName: config.serverName,
    clientType: config.clientType,
    testDuration: config.testDuration,
    broadcastInterval: config.broadcastInterval
  });

  const results = await runner.runPhased(config.loadPhases, config.iterations);

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
  console.log('Mode:               ' + (config.mode === 'init' ? 'INITIALIZATION TEST' : 'FULL BENCHMARK'));
  console.log('Server URL:         ' + config.serverUrl);
  console.log('Server Name:        ' + config.serverName);
  console.log('Client Type:        ' + config.clientType);
  console.log('Test Type:          ' + config.testType);
  console.log('Load Phases:        ' + config.loadPhases.join(', '));
  console.log('Iterations:         ' + config.iterations);
  console.log('Test Duration:      ' + (config.testDuration / 1000) + 's');

  if (config.mode === 'init') {
    console.log('');
    console.log('Running quick initialization test to verify setup...');
    console.log('This will create CSV files and test basic functionality.');
  }

  console.log('');
  console.log('═'.repeat(70));

  try {
    const allResults = {
      load: null,
      broadcast: null
    };

    // Run Load Test
    if (config.testType === 'load' || config.testType === 'all') {
      allResults.load = await runLoadTest(config);
    }

    // Run Broadcast Test
    if (config.testType === 'broadcast' || config.testType === 'all') {
      allResults.broadcast = await runBroadcastTest(config);
    }

    console.log('');
    console.log('═'.repeat(70));
    console.log('✓ Benchmark Complete!');
    console.log('═'.repeat(70));
    console.log('');
    console.log('Results saved to: ../../data/raw/');
    console.log('');

    if (config.mode === 'init') {
      console.log('Initialization successful! CSV files created.');
      console.log('You can now run the full benchmark with: node benchmark.js');
      console.log('');
    }

  } catch (error) {
    console.error('');
    console.error('═'.repeat(70));
    console.error('✗ Benchmark Failed!');
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
