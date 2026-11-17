/** Surface pole closing a chain end.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Surface pole closing a chain end.
 * @evidence contracts/development/design.md#principled-representation `chain` and `end` locate the closure; `point` is a registered-frame position in millimetres. `critical` records the producer's critical-pole designation, including constructed digit tips, rather than certifying measured provenance.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanBodySurfacePoles.calibrated, AutoMovieHumanNeckSurface.crown.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `chain`, `end`, `point`, `critical`; callers supply the complete record.
 */
export interface IAutoMovieHumanSurfacePole {
  /** Chain whose end the pole closes. */
  chain: string;

  /** Which end of the chain. */
  end: "top" | "bottom";

  /**
   * Pole point `[x, y, z]` in registered-frame millimetres. A critical pole
   * may be recovered or constructed; provisional closures use the chain's
   * axis point at the corresponding end.
   */
  point: [number, number, number];

  /** Whether the producer designates a critical pole rather than a provisional closure. */
  critical: boolean;
}
