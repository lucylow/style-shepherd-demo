/**
 * Hash utility for computing integrity hashes
 * Used for audit trail verification
 */

import crypto from 'crypto';

/**
 * Compute SHA-256 hash of input string
 * @param input - String to hash
 * @returns Hexadecimal hash string
 */
export function computeHash(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}


