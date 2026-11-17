import type { IAutoMovieHumanBreastFootprint } from "./IAutoMovieHumanBreastFootprint";
import type { IAutoMovieHumanTrunkFeatureFrame } from "./IAutoMovieHumanTrunkFeatureFrame";

/** Type contracts exchanged by AutoMovieHumanBreastDome; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanBreastDome {
  /** What the dome reads.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation What the dome reads.
   * @evidence contracts/development/design.md#principled-representation `frame`: The breast's frame. `footprint`: The footprint. `projection`: The bust point's projection, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanBreastDome.create.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frame`, `footprint`, `projection`; callers supply the complete record.
   */
  export interface IInput {
    /** The breast's frame. */
    frame: IAutoMovieHumanTrunkFeatureFrame.IFrame;

    /** The footprint. */
    footprint: IAutoMovieHumanBreastFootprint.IFootprint;

    /** The bust point's projection, mm. */
    projection: number;
  }

  /** Result of AutoMovieHumanBreastDome.surface. The dome's surface as a grid of body points, rows along the up axis and
  columns along the lateral axis, for drawing the piece alone.
  @param feature The dome.
  @param rows Samples along up, at least 2.
  @param columns Samples along lateral, at least 2.
  @returns Body points, mm.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The dome's surface as a grid of body points, rows along the up axis and columns along the lateral axis, for drawing the piece alone.
 * @evidence contracts/development/design.md#principled-representation The dome's surface as a grid of body points, rows along the up axis and columns along the lateral axis, for drawing the piece alone.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBreastDome.SurfaceResult is the canonical exchange used by AutoMovieHumanBreastDome.surface.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBreastDome.surface for the dome's surface as a grid of body points, rows along the up axis and columns along the lateral axis, for drawing the piece alone.
 */
  export type SurfaceResult = [number, number, number][][];
}
