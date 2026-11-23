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
 */
export interface IAutoMovieConnectorSectionAt {
  /** Usable width in metres. */
  width: number;

  /** Vertical clearance in metres. */
  clearHeight: number;
}
