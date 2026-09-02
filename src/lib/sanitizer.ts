/**
 * Security & Input Validation utilities
 * Adheres strictly to threat modeling by sanitizing and escaping all user input.
 */

export function sanitizeUserInput(input: string, maxLength: number = 5000): string {
  if (!input || typeof input !== "string") return "";
  
  // Truncate to maximum allowable length to prevent memory exhaust / payload overflow
  const truncated = input.slice(0, maxLength);

  // Strip null bytes and control chars (except newline, carriage return, tab)
  const stripped = truncated.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return stripped.trim();
}

/**
 * Escapes HTML entities to ensure zero HTML/script injection in rendering contexts
 */
export function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validates email format strictly
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}
