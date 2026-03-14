/**
 * Security Utilities
 * Adapted from WorldMonitor's XSS prevention pattern.
 * All user-visible content from external sources MUST be sanitised.
 */

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escape HTML entities to prevent XSS.
 * Apply to ALL external content before DOM insertion.
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Sanitise URLs — only allow http/https protocols.
 * Prevents javascript: and data: URL injection.
 */
export function sanitiseUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return parsed.href;
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Strip HTML tags from a string.
 * Use for RSS feed content that may contain markup.
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1).trim() + '…';
}

/**
 * Validate and clamp a numeric parameter.
 * Use for API proxy input validation.
 */
export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validate a string against an allowed pattern.
 * Returns the string if valid, empty string otherwise.
 */
export function validatePattern(str: string, pattern: RegExp, maxLength = 100): string {
  if (str.length > maxLength) return '';
  return pattern.test(str) ? str : '';
}
