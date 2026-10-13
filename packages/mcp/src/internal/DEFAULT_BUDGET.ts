

/** Default UTF-8 byte allowance for one serialized success envelope.
 *
 * The 64 KiB default supplies an absent complete serialized-success envelope allowance.
 * A default byte policy is distinct from the largest caller-selected allowance.
 * The default does not truncate source text or override an explicit valid budget.
 * The comment identifies UTF-8 serialized success-envelope bytes.
 * Applying the scalar default is O(1); JSON byte counting remains response-owner work.
 * Request parsing shares this one documented default across both transports.
 * The fixed scalar retains no response bytes or task.
 */
export const DEFAULT_BUDGET: number = 65_536;
