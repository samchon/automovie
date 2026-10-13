

/**
 * Explicit JSON admission depth policy: value dispatch refuses a depth counter greater than 256 regardless of otherwise valid grammar.
 */
export const AUTOMOVIE_STRUCTURED_JSON_MAX_JSON_NESTING_DEPTH: ReturnType<() => 256> = 256;
