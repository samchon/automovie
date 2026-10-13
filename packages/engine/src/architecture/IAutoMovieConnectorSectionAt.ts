/**
 * The usable section of a connector at one point of its route.
 *
 * Produced by `builtConnectorSectionAt`, which throws on a fraction outside
 * `[0, 1]` or a connector stating no section, and by the record-addressed
 * `builtConnectorSection`. A connector with a constant `width` and
 * `clearHeight` answers that pair everywhere; one with varying `sections` is
 * interpolated linearly between the two stations bracketing the fraction.
 *
 * @evidence contracts/common.md#principled-implementation Piecewise-linear interpolation of width and clear height between bracketing section stations; validation pins the first station at `0` and the last at `1`, so a fraction in `[0, 1]` never extrapolates.
 * @evidence contracts/common.md#clear-and-simple-design Two numbers only, because the same pair answers both the constant and the varying section spelling of a connector.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No connector kind is treated differently, and the id-addressed query throws on a missing section rather than reporting a zero width.
 * @evidence contracts/common.md#meaningful-documentation States both producers and their refusals, the constant and interpolated cases, the premise that rules out extrapolation, and the units.
 * @evidenceExclude contracts/performance.md#cost-and-resources Two numbers from a linear scan for the bracketing section station, interpolated again on every query with no cache and no reference to the section list.
 * @author Samchon
 */
export interface IAutoMovieConnectorSectionAt {
  /** Usable width in metres. */
  width: number;

  /** Vertical clearance in metres. */
  clearHeight: number;
}
