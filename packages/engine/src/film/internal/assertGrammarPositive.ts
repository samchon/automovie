/*
 * Throws `<path> must be finite and positive.` unless `value` is a finite
 * number greater than zero.
 *
 * The film-grammar read refuses a malformed observation instead of reporting
 * it, so a threshold, a duration, a lens or a subject height that is zero,
 * negative, `NaN` or infinite stops the read before any projection divides by
 * it.
 * Parameter value: Number that must be finite and greater than zero.
 * Parameter path: Dotted name of the field, used as the message prefix.
 */
export function assertGrammarPositive(value: number, path: string): void {
  if (value <= 0) throw new Error(`${path} must be finite and positive.`);
}
