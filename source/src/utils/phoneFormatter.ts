/**
 * Format phone numbers based on country
 */

export function formatPhoneNumber(phoneNumber: string, country?: string): string {
  if (!phoneNumber) return "";

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, "");

  // Format based on country
  switch (country?.toLowerCase()) {
    case "united states":
    case "usa":
    case "us":
      return formatUSPhoneNumber(digits);
    case "canada":
    case "ca":
      return formatCanadianPhoneNumber(digits);
    case "united kingdom":
    case "uk":
    case "gb":
      return formatUKPhoneNumber(digits);
    case "australia":
    case "au":
      return formatAustralianPhoneNumber(digits);
    case "mexico":
    case "mx":
      return formatMexicanPhoneNumber(digits);
    default:
      // Default: return original format
      return phoneNumber;
  }
}

function formatUSPhoneNumber(digits: string): string {
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return digits;
}

function formatCanadianPhoneNumber(digits: string): string {
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === "1") {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return digits;
}

function formatUKPhoneNumber(digits: string): string {
  // UK format: +44 20 1234 5678 or +44 123 456 7890
  if (digits.length >= 10) {
    if (digits.startsWith("44")) {
      const rest = digits.slice(2);
      if (rest.startsWith("20")) {
        // London
        return `+44 20 ${rest.slice(2, 6)} ${rest.slice(6)}`;
      } else {
        // Other areas
        return `+44 ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
      }
    } else if (digits.startsWith("0")) {
      // Domestic format
      if (digits.startsWith("020")) {
        return `0${digits.slice(1, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}`;
      } else {
        return `0${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
      }
    }
  }
  return digits;
}

function formatAustralianPhoneNumber(digits: string): string {
  // AU format: +61 2 1234 5678 or (02) 1234 5678
  if (digits.length >= 9) {
    if (digits.startsWith("61")) {
      const rest = digits.slice(2);
      return `+61 ${rest.slice(0, 1)} ${rest.slice(1, 5)} ${rest.slice(5)}`;
    } else if (digits.startsWith("0")) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)} ${digits.slice(6)}`;
    }
  }
  return digits;
}

function formatMexicanPhoneNumber(digits: string): string {
  // MX format: +52 55 1234 5678
  if (digits.length >= 10) {
    if (digits.startsWith("52")) {
      const rest = digits.slice(2);
      return `+52 ${rest.slice(0, 2)} ${rest.slice(2, 6)} ${rest.slice(6)}`;
    } else {
      return `+52 ${digits.slice(0, 2)} ${digits.slice(2, 6)} ${digits.slice(6)}`;
    }
  }
  return digits;
}
