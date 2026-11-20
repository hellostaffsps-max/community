// Preserve leading zeroes and accept Arabic mobile keyboard digits.
export function normalizeEmailCode(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 16) return null;
  const code = value.trim().replace(/[٠-٩۰-۹]/g, char =>
    String(char.charCodeAt(0) - (char >= '۰' ? 0x6f0 : 0x660)),
  );
  return /^[0-9]{6}$/.test(code) ? code : null;
}
