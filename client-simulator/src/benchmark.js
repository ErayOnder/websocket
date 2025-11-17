import TestRunner from './runners/test-runner.js';

/**
 * Main Benchmark Orchestrator
 * Runs complete benchmark suite with both Echo and Broadcast tests
 */

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    serverUrl: 'ws://localhost:8080',
    libraryName: 'ws',
    clientType: 'ws',
    testType: 'all', // 'echo', 'broadcast', or 'all'
    loadPhases: [100, 200, 400, 600, 800, 1000],
    iterations: 3,
    testDuration: 60000, // 60 seconds
    messageInterval: 100, // For echo test
    broadcastInterval: 3000 // For broadcast test
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--server' || arg === '-s') {
      config.serverUrl = args[++i];
    } else if (arg === '--library' || arg === '-l') {
      config.libraryName = args[++i];
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
    } else if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  return config;
}

function printUsage() {
  console.log(`
WebSocket Benchmark Suite

Usage: node benchmark.js [options]

Options:
  -s, --server <url>           Server URL (default: ws://localhost:8080)
  -l, --library <name>         Library name for CSV files (default: ws)
  -c, --client-type <type>     Client type: ws or socketio (default: ws)
  -t, --test <type>            Test type: echo, broadcast, or all (default: all)
  -p, --load-phases <phases>   Comma-separated client counts (default: 100,200,400,600,800,1000)
  -i, --iterations <n>         Iterations per phase (default: 3)
  -d, --duration <seconds>     Test duration in seconds (default: 60)
  -h, --help                   Show this help message

Examples:
  # Run all tests with default settings
  node benchmark.js

  # Run only echo test with custom load phases
  node benchmark.js --test echo --load-phases 10,50,100

  # Run broadcast test with Socket.IO client
  node benchmark.js --test broadcast --client-type socketio --server http://localhost:3000

  # Quick test with 5-second duration
  node benchmark.js --duration 5 --load-phases 5,10
  `);
}

async function main() {
  const config = parseArgs();

  console.log('');
  console.log('='.repeat(70));
  console.log('WebSocket Benchmark Suite');
  console.log('='.repeat(70));
  console.log('');
  console.log('Configuration:');
  console.log(`  Server URL:         ${config.serverUrl}`);
  console.log(`  Library Name:       ${config.libraryName}`);
  console.log(`  Client Type:        ${config.clientType}`);
  console.log(`  Test Type:          ${config.testType}`);
  console.log(`  Load Phases:        ${config.loadPhases.join(', ')}`);
  console.log(`  Iterations:         ${config.iterations}`);
  console.log(`  Test Duration:      ${config.testDuration / 1000}s`);
  console.log('');
  console.log('='.repeat(70));
  console.log('');

  const runner = new TestRunner(config);

  try {
    // Run Echo Test
    if (config.testType === 'echo' || config.testType === 'all') {
      console.log('');
      console.log('Starting Echo Test Suite...');
      console.log('');
      const echoResults = await runner.runPhasedEchoTest(
        config.loadPhases,
        config.iterations
      );

      console.log('');
      console.log('Echo Test Results Summary:');
      console.log('---');
      echoResults.forEach(result => {
        if (result.success) {
          console.log(`${result.numClients} clients (iteration ${result.iteration}): Mean RTT=${result.stats.mean}ms, Messages=${result.messageCount}`);
        } else {
          console.log(`${result.numClients} clients (iteration ${result.iteration}): FAILED - ${result.error}`);
        }
      });
    }

    // Run Broadcast Test
    if (config.testType === 'broadcast' || config.testType === 'all') {
      console.log('');
      console.log('Starting Broadcast Test Suite...');
      console.log('');
      const broadcastResults = await runner.runPhasedBroadcastTest(
        config.loadPhases,
        config.iterations,
        config.broadcastInterval
      );

      console.log('');
      console.log('Broadcast Test Results Summary:');
      console.log('---');
      broadcastResults.forEach(result => {
        if (result.success) {
          console.log(`${result.numClients} clients (iteration ${result.iteration}): Mean Latency=${result.stats.mean}ms, Broadcasts=${result.broadcastCount}`);
        } else {
          console.log(`${result.numClients} clients (iteration ${result.iteration}): FAILED - ${result.error}`);
        }
      });
    }

    console.log('');
    console.log('='.repeat(70));
    console.log('Benchmark Complete!');
    console.log('Results saved to ../../data/raw/');
    console.log('='.repeat(70));
    console.log('');

  } catch (error) {
    console.error('');
    console.error('='.repeat(70));
    console.error('Benchmark Failed!');
    console.error(`Error: ${error.message}`);
    console.error('='.repeat(70));
    console.error('');
    process.exit(1);
  }
}

main();
