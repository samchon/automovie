/** A construction path sampled by the same evaluation that emitted skin vertices.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A construction path sampled by the same evaluation that emitted skin vertices.
 * @evidence contracts/development/design.md#principled-representation `id`: Owning skin chain, slash, then a stable named guide address. `points`: Points in the calibration's registered millimetre frame. `closed`: Whether the final point connects back to the first.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanApertureConstruction.generate, AutoMovieHumanAperturePocket.loop, AutoMovieHumanBodySurfaceOpening.open. Also types AutoMovieHumanApertureConstruction.out, AutoMovieHumanApertureConstruction.run.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `id`, `points`, `closed`; callers supply the complete record.
 */
export interface IAutoMovieHumanConstructionPath {
  /** Owning skin chain, slash, then a stable named guide address. */
  id: string;

  /** Points in the calibration's registered millimetre frame. */
  points: [number, number, number][];

  /** Whether the final point connects back to the first. */
  closed: boolean;
}
