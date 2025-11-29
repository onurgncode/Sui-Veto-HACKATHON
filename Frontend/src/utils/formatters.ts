/**
 * Format a timestamp into a human-readable date string
 */
export function formatTimestamp(timestamp: string | number): string {
  const date = new Date(Number(timestamp));
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a Sui address to show only the beginning and end
 */
export function formatAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
