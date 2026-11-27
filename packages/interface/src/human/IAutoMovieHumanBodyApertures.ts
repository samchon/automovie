import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieHumanLoftAperture } from "./IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftApertureConstruction } from "./IAutoMovieHumanLoftApertureConstruction";
import type { IAutoMovieHumanEyelid } from "./IAutoMovieHumanEyelid";

/**
 * Prepared skin openings, their projected trim outlines, optional eye lids and
 * millimetre detail boxes.
 *
 * The interface package owns these declarations; AutoMovieHumanBodyApertures in
 * Human supplies their runtime values.
 */
export namespace IAutoMovieHumanBodyApertures {
  /** An aperture with its margin and projected cut outline evaluated once. */
  export interface IPrepared {
    /** Aperture data. */
    aperture: IAutoMovieHumanLoftAperture;

    /**
     * Projected outline of the cut: the margin itself, or for an eye the outer
     * edge of the lid band around it.
     */
    outline: IAutoMovieHumanLoftApertureConstruction.IOutline;

    /**
     * Lid of an eye opening: the calibrated eye nearest the margin's centre
     * lies behind it; null for any other opening.
     */
    lid: IAutoMovieHumanEyelid.ILid | null;

    /**
     * The points the skin is cut along, whose projection is {@link outline}: the
     * margin, or for an eye the lid band's outer edge, one point per lid
     * sample.
     */
    edge: AutoMovieVector3Tuple[];
  }

  /**
   * The boxes argument of AutoMovieHumanBodyApertures.detail. Stations refined
   * wherever a chain's rings pass through a detail box, at the same SPACING as
   * around openings: a colour boundary drawn per vertex, such as the lips', is
   * otherwise sampled on triangles several millimetres tall and shows as
   * steps.
   *
   * @param boxes World boxes `[min, max]` in mm.
   * @param target Chain being lofted.
   * @param heights Increasing stations.
   * @param phases Probe phases, the chain's own ring phases.
   */
  export type DetailBoxes = readonly [
    [number, number, number],
    [number, number, number],
  ][];
}
