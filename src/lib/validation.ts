import type { University, UserRole } from "../types";

export function emailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase().trim() ?? "";
}

/**
 * No email domain restrictions — everyone signs in with any Google email.
 */
export function emailSatisfiesRole(_email: string, _role: UserRole, _university: University | undefined): boolean {
  return true;
}

// Matches +263 71/72/73/77/78 X XXX XXX style Zimbabwean mobile numbers,
// tolerating optional spaces exactly like the sample format +263 71X XXX XXX.
const ZW_PHONE_REGEX = /^\+263\s?7[1-8]\d\s?\d{3}\s?\d{3,4}$/;

export function isValidZwPhone(phone: string): boolean {
  return ZW_PHONE_REGEX.test(phone.trim());
}
