

/**
 * Largest explicit serialized-result allowance accepted by either transport.
 *
 *
 * The 1 MiB ceiling bounds an explicit serialized-result allowance in the common request schemas.
 * A maximum allowance is one shared transport-independent schema policy.
 * Over-limit caller budgets refuse rather than weakening response-resource admission.
 * The comment identifies the largest explicit complete result allowance.
 * Comparing a numeric schema value is O(1), separate from response serialization cost.
 * SDK and local request grammar reuse the same ceiling.
 * The scalar is module-owned and retains no caller response.
 */
export const MAX_BUDGET: number = 1_048_576;
