/**
 * Render a refused value for diagnostic text without letting its string conversion replace the finding with an exception.
 *
 * Successful conversion has exactly `String(value)` semantics. If conversion throws, the text is `an uninspectable value`; callers still retain the original value in their violation, so the fallback neither admits it nor substitutes another authored value. This protects conversion only, not property reads performed by a caller before reaching this function.
 *
 * @param value Refused input whose printable representation is requested.
 * @returns Its ordinary string conversion or the stated conversion-failure text.
 *
 * @evidence contracts/common.md#principled-implementation ECMAScript string conversion is attempted once inside a catch boundary because ordinary records can shadow toString and valueOf with non-callable fields, making conversion throw even though the validator can still report their refusal.
 * @evidence contracts/common.md#clear-and-simple-design One diagnostic-only conversion owner serves the collector and film ingress without duplicating exception handling or changing any caller's admission rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every value uses the same conversion; the fallback reports failed representation without inspecting a fixture identity, repairing the input or suppressing its violation.
 * @evidence contracts/common.md#meaningful-documentation Gives successful conversion semantics, the exact failure text, preservation of the original offending value and the boundary's exclusion of caller property reads.
 * @evidence contracts/performance.md#efficient-algorithms Performs one conversion and returns its string without a second serialization or traversal; user-defined conversion can take arbitrary work or fail to terminate, so this is not a time bound on hostile in-process code.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Converts the current value once per diagnostic without caching mutable objects or effectful conversion hooks across findings.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains no input or thrown value after return; the caller owns the resulting text and any separate offending-value reference in its finding.
 */
export function describeInvalidValue(value: unknown): string {
  try {
    return String(value);
  } catch {
    return "an uninspectable value";
  }
}
