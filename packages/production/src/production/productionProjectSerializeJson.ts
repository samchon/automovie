

/**
 * Serialize admitted project records with two-space indentation and a trailing newline.
 *
 * @evidence contracts/common.md#principled-implementation Uses native JSON.stringify for JSON-compatible records and appends one newline, preserving its property ordering and refusal for cyclic/BigInt values rather than claiming canonical sorted-key serialization.
 * @evidence contracts/common.md#clear-and-simple-design One formatter defines the exact tracked bytes used by project publication and subsequent receipt equality; content canonicalization remains a separate owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This formatter does not validate unknown data: unsupported undefined/function roots stringify to undefined text, so actual record callers must supply JSON-compatible admitted records; no fixture-specific value repair is performed.
 * @evidence contracts/common.md#meaningful-documentation States indentation/newline byte policy and native JSON limitations, distinguishing formatted storage bytes from semantic canonical fingerprints.
 * @evidence contracts/performance.md#efficient-algorithms Traverses the JSON-compatible object graph and allocates its full serialized string plus trailing-newline result, with node count and output text length driving cost.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Formatting one value has no acquired or effectful result to coordinate; publication owners retain this exact string when their later digest/equality checks require it.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned string and input ownership is unchanged; no record cache, file descriptor or task is acquired.
 */
export function productionProjectSerializeJson(value: unknown): string {
    return `${JSON.stringify(value, null, 2)}\n`;
}
