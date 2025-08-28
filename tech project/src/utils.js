import { validate as uuidValidate } from "uuid";
export const VALID_API_KEYS = ["my-secret-key-123"];

export function isValidApiKey(req) {
  const key = req.headers["x-api-key"];
  return VALID_API_KEYS.includes(key);
}

// ✅ For WebSocket headers
export function isValidApiKeyRawHeader(apiKey) {
  return VALID_API_KEYS.includes(apiKey);
}

export function isValidUUID(uuid) {
  return uuidValidate(uuid);
}

export function nowTs() {
  return new Date().toISOString();
}
