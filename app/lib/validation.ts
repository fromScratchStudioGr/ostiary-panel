/** Enforces the admin panel's password policy. Returns the first violation found, or null if the password is valid. */
export function validatePassword(value: string): string | null {
  if (value.length < 8) return "Must be at least 8 characters.";
  if (!/[A-Z]/.test(value)) return "Must include an uppercase letter.";
  if (!/[a-z]/.test(value)) return "Must include a lowercase letter.";
  if (!/[0-9]/.test(value)) return "Must include a number.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Must include a symbol.";
  return null;
}
