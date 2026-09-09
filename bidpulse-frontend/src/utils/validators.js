export function isValidPhoneNumber(value) {
  const digitsOnly = (value || '').replace(/\D/g, '');
  return digitsOnly.length === 10;
}
