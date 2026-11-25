/**
 * Render a refused value for diagnostic text without letting its string
 * conversion replace the finding with an exception.
 *
 * Successful conversion has exactly `String(value)` semantics. If conversion
 * throws, the text is `an uninspectable value`; callers still retain the
 * original value in their violation, so the fallback neither admits it nor
 * substitutes another authored value. This protects conversion only, not
 * property reads performed by a caller before reaching this function.
 *
 * @param value Refused input whose printable representation is requested.
 * @returns Its ordinary string conversion or the stated conversion-failure
 *   text.
 */
export function describeInvalidValue(value: unknown): string {
  try {
    return String(value);
  } catch {
    return "an uninspectable value";
  }
}
