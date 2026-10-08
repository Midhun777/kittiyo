// Client-side validation utilities

export const MAX_CONTENT_LENGTH = 10 * 1024; // 10 KB

/**
 * Validates if a string is a safe HTTP/HTTPS URL
 */
export function isSafeUrl(str: string): boolean {
  const trimmed = str.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Automatically detects if content is a URL or plain text
 */
export function detectContentType(content: string): 'text' | 'url' {
  return isSafeUrl(content) ? 'url' : 'text';
}

/**
 * Validates a 4-digit numeric code
 */
export function isValidCode(code: string): boolean {
  return /^\d{4}$/.test(code.trim());
}

/**
 * Formats seconds into MM:SS
 */
export function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
