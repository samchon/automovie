

/**
 * Largest explicit serialized-result allowance accepted by either transport.
 *
 *
 * The shared SDK and local schemas admit explicit complete-result allowances through 1 MiB and refuse larger values. Comparing the numeric ceiling is O(1), separate from serialization cost; this module-owned scalar retains no caller response.
 */
export const MAX_BUDGET: number = 1_048_576;
