import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftApertureConstruction } from "../lofting/IAutoMovieHumanLoftApertureConstruction";
import type { IAutoMovieHumanEyelid } from "./IAutoMovieHumanEyelid";

/** Type contracts exchanged by AutoMovieHumanBodyApertures; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanBodyApertures {
  /** An aperture with its margin and projected cut outline evaluated once.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation An aperture with its margin and projected cut outline evaluated once.
   * @evidence contracts/development/design.md#principled-representation `aperture`: Aperture data. `outline`: Projected outline of the cut: the margin itself, or for an eye the outer edge of the lid band around it. `lid`: Lid of an eye opening: the calibrated eye nearest the margin's centre lies behind it; null for any other opening.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBodyApertures.prepare. Read by AutoMovieHumanApertureSpan.of, AutoMovieHumanBodyApertures.refine, AutoMovieHumanBodySurfaceOpening.open. Also types AutoMovieHumanBodySurface.spans.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `aperture`, `outline`, `lid`, `edge`; callers supply the complete record.
   */
  export interface IPrepared {
    /** Aperture data. */
    aperture: IAutoMovieHumanLoftAperture;

    /**
     * Projected outline of the cut: the margin itself, or for an eye the
     * outer edge of the lid band around it.
     */
    outline: IAutoMovieHumanLoftApertureConstruction.IOutline;

    /**
     * Lid of an eye opening: the calibrated eye nearest the margin's centre
     * lies behind it; null for any other opening.
     */
    lid: IAutoMovieHumanEyelid.ILid | null;

    /**
     * The points the skin is cut along, whose projection is {@link outline}:
     * the margin, or for an eye the lid band's outer edge, one point per lid
     * sample.
     */
    edge: AutoMovieVector3Tuple[];
  }

  /** The boxes argument of AutoMovieHumanBodyApertures.detail. Stations refined wherever a chain's rings pass through a detail box,
  at the same SPACING as around openings: a colour boundary drawn per
  vertex, such as the lips', is otherwise sampled on triangles several
  millimetres tall and shows as steps.
  @param boxes World boxes `[min, max]` in mm.
  @param target Chain being lofted.
  @param heights Increasing stations.
  @param phases Probe phases, the chain's own ring phases.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Stations refined wherever a chain's rings pass through a detail box, at the same SPACING as around openings: a colour boundary drawn per vertex, such as the lips', is otherwise sampled on triangles several millimetres tall and shows as steps.
 * @evidence contracts/development/design.md#principled-representation Stations refined wherever a chain's rings pass through a detail box, at the same SPACING as around openings: a colour boundary drawn per vertex, such as the lips', is otherwise sampled on triangles several millimetres tall and shows as steps. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanBodyApertures.DetailBoxes is the canonical exchange used by AutoMovieHumanBodyApertures.detail.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanBodyApertures.detail for stations refined wherever a chain's rings pass through a detail box, at the same SPACING as around openings: a colour boundary drawn per vertex, such as the lips', is otherwise sampled on triangles several millimetres tall and shows as steps.
 */
  export type DetailBoxes = readonly [
    [number, number, number],
    [number, number, number],
  ][];
}
