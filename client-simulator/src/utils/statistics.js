/**
 * Calculate statistics from an array of objects by extracting a specific field
 * @param {Array<Object>} data - Array of objects
 * @param {string} valueField - Field name to extract numeric values from (e.g., 'rtt', 'latency')
 * @param {Object} options - Options including includePercentiles and includeJitter
 * @returns {Object} Statistics object
 */
export function calculateStatistics(data, valueField, options = {}) {
  if (!Array.isArray(data) || data.length === 0) {
    return calculateStats([], options);
  }

  const values = data.map(d => d[valueField]).filter(val => typeof val === 'number');
  return calculateStats(values, options);
}

/**
 * Calculate message loss rate as a percentage
 * @param {number} messagesSent - Total number of messages sent
 * @param {number} messagesReceived - Total number of messages received
 * @param {number} decimalPlaces - Number of decimal places to round to (default: 2)
 * @returns {number} Message loss rate as a percentage (0-100)
 */
export function calculateMessageLossRate(messagesSent, messagesReceived, decimalPlaces = 2) {
  if (messagesSent === 0) {
    return 0;
  }
  const lostMessages = messagesSent - messagesReceived;
  const lossRate = (lostMessages / messagesSent) * 100;
  return decimalPlaces !== undefined 
    ? parseFloat(lossRate.toFixed(decimalPlaces))
    : lossRate;
}

function calculateStats(values, options = {}) {
  const { includePercentiles = false, includeJitter = false } = options;

  if (!values || values.length === 0) {
    return {
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      count: 0,
      ...(includePercentiles && { p95: 0, p99: 0 }),
      ...(includeJitter && { jitter: 0 })
    };
  }

  const sortedValues = [...values].sort((a, b) => a - b);
  const length = sortedValues.length;

  const sum = sortedValues.reduce((acc, val) => acc + val, 0);
  const mean = sum / length;

  const median = length % 2 === 0
    ? (sortedValues[length / 2 - 1] + sortedValues[length / 2]) / 2
    : sortedValues[Math.floor(length / 2)];

  const min = sortedValues[0];
  const max = sortedValues[length - 1];

  const stats = {
    mean: parseFloat(mean.toFixed(2)),
    median: parseFloat(median.toFixed(2)),
    min: min,
    max: max,
    count: length
  };

  if (includePercentiles) {
    const p95Index = Math.floor(length * 0.95);
    const p99Index = Math.floor(length * 0.99);
    const p95 = sortedValues[p95Index] || sortedValues[length - 1];
    const p99 = sortedValues[p99Index] || sortedValues[length - 1];
    
    stats.p95 = parseFloat(p95.toFixed(2));
    stats.p99 = parseFloat(p99.toFixed(2));
  }

  if (includeJitter) {
    const variance = sortedValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / length;
    const stdDev = Math.sqrt(variance);
    stats.jitter = parseFloat(stdDev.toFixed(2));
  }

  return stats;
}