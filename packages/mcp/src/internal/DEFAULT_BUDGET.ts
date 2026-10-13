

/** Default UTF-8 byte allowance for one serialized success envelope.
 *
 * Request parsing applies 64 KiB in O(1) only when the complete success-envelope UTF-8 byte allowance is absent, without overriding an explicit budget or truncating content. Both transports share this process-owned scalar; JSON byte counting belongs to the response owner, and the scalar retains no response bytes or task.
 */
export const DEFAULT_BUDGET: number = 65_536;
