import TestRunner from './runners/test-runner.js';

/**
 * Demo script for Echo Test
 * Run this to test the echo functionality with a single client
 */

async function main() {
  const config = {
    serverUrl: 'ws://localhost:8080',
    libraryName: 'ws',
    clientType: 'ws',
    testDuration: 5000, // 5 seconds for demo
    messageInterval: 100 // Send message every 100ms
  };

  const runner = new TestRunner(config);

  console.log('');
  console.log('='.repeat(60));
  console.log('WebSocket Echo Test Demo');
  console.log('='.repeat(60));
  console.log('');
  console.log('This demo will:');
  console.log('1. Connect to the WebSocket server');
  console.log('2. Send echo messages every 100ms for 5 seconds');
  console.log('3. Measure Round Trip Time (RTT) for each message');
  console.log('4. Save results to CSV files in ../../data/raw/');
  console.log('');
  console.log('Prerequisites: WebSocket server running on ws://localhost:8080');
  console.log('');
  console.log('='.repeat(60));
  console.log('');

  const result = await runner.runSingleEchoTest();

  console.log('');
  console.log('='.repeat(60));
  if (result.success) {
    console.log('Test completed successfully!');
    console.log('');
    console.log('Results:');
    console.log(`- Messages sent/received: ${result.messageCount}`);
    console.log(`- Connection time: ${result.connectionTime}ms`);
    console.log(`- Average RTT: ${result.stats.mean}ms`);
    console.log(`- Median RTT: ${result.stats.median}ms`);
    console.log(`- Min RTT: ${result.stats.min}ms`);
    console.log(`- Max RTT: ${result.stats.max}ms`);
    console.log('');
    console.log('CSV files created:');
    console.log('- ../../data/raw/rtt_ws_1clients.csv');
    console.log('- ../../data/raw/connection_time_ws_1clients.csv');
  } else {
    console.log('Test failed!');
    console.log(`Error: ${result.error}`);
  }
  console.log('='.repeat(60));
  console.log('');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
