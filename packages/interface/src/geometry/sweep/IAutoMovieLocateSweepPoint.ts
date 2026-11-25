import type { IAutoMovieVector3 } from "../IAutoMovieVector3";
import type { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";

/**
 * Polar section-plane location of a model-space point near a
 * direction-correspondence sweep.
 */
export namespace IAutoMovieLocateSweepPoint {
  /**
   * A model-space point and a compiled direction-correspondence sweep for
   * section-plane inversion.
   *
   * The locator samples signed plane distance over 128 intervals and bisects
   * sign changes 48 times. It selects the candidate with the smallest absolute
   * radial offset. If no candidate is detected, it uses the end plane with
   * smaller absolute signed distance. Tangential roots and multiple crossings
   * between samples can be missed, so fallback does not prove the point lies
   * beyond an end.
   */
  export type IProps = {
    /**
     * Compiled surface queried by section frame and polar radius. Parameter
     * correspondence throws; explicit direction and omitted/default
     * correspondence are accepted.
     */
    surface: IAutoMovieSweepSurface;

    /**
     * Finite position in the surface's model frame, in metres. The locator
     * rejects nonfinite coordinates; distance outside an end is projected into
     * that end plane for the reported radial offset.
     */
    point: IAutoMovieVector3;
  };

  /**
   * Newly allocated section-plane address and signed radial residual from the
   * locator's selected candidate. This record is mutable and retains neither
   * the source point nor the compiled surface.
   */
  export type IResult = {
    /**
     * Chosen normalized spine coordinate in [0,1]; the sampled root search can
     * miss tangential roots or multiple crossings between probes.
     */
    u: number;

    /**
     * Polar direction in [0,1) turns, measured from frame.x toward frame.y.
     * This is a surface query parameter only for direction correspondence.
     */
    v: number;

    /**
     * Signed in-plane radial distance minus surface.radius(u,v), in metres.
     * Positive means outside that radial value; this is not Euclidean
     * closest-surface distance.
     */
    offset: number;
  };
}
