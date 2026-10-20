/**
 * The usable section of a connector at one point of its route.
 *
 * Produced by `builtConnectorSectionAt`, which throws on a fraction outside
 * `[0, 1]` or a connector stating no section, and by the record-addressed
 * `builtConnectorSection`. A connector with a constant `width` and
 * `clearHeight` answers that pair everywhere; one with varying `sections` is
 * interpolated linearly between the two stations bracketing the fraction.
 * Validation requires those stations to begin at `0`, end at `1` and strictly
 * increase, so every fraction in `[0, 1]` is bracketed; the record-addressed
 * form does not range-check the fraction itself.
 *
 * @evidence contracts/common.md#principled-implementation A constant connector answers its stated pair; a varying one is the piecewise-linear function of its section stations, interpolated between the two stations bracketing the fraction, which validation guarantees exist.
 * @evidence contracts/common.md#clear-and-simple-design Two numbers, width and clearance, which is what a passage check reads at one point; it is shared by the id-addressed and record-addressed producers so both answer one shape.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record-addressed form does not range-check the fraction, a stated split of responsibility with the id-addressed form, and no corridor is special-cased by name.
 * @evidence contracts/common.md#meaningful-documentation States both producers and the id-addressed refusals, the constant and varying cases, the validation guarantee that brackets every fraction, the record-addressed form's missing range check and the metre units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms No code; one answer costs a linear scan over the section stations, answered on `builtConnectorSection`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Answered per fraction; nothing caches sections because each call is a different point on the route.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Two numbers owned by the caller; the producer keeps no reference.
 */
export interface IAutoMovieConnectorSectionAt {
  /** Usable width in metres. */
  width: number;

  /** Vertical clearance in metres. */
  clearHeight: number;
}
