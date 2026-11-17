import type { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";
import type { IAutoMovieVector3 } from "../IAutoMovieVector3";

/** Polar section-plane location of a model-space point near a direction-correspondence sweep. */
export namespace IAutoMovieLocateSweepPoint {
  /**
   * A model-space point and a compiled direction-correspondence sweep for section-plane inversion.
   *
   * The locator samples signed plane distance over 128 intervals and bisects sign changes 48 times. It selects the candidate with the smallest absolute radial offset. If no candidate is detected, it uses the end plane with smaller absolute signed distance. Tangential roots and multiple crossings between samples can be missed, so fallback does not prove the point lies beyond an end.
   *
   * @evidence contracts/development/design.md#principled-representation The point uses the compiled surface's model-metre frame; finite point coordinates are checked, but direction correspondence remains an unchecked semantic precondition.
   * @evidence contracts/development/design.md#minimal-and-owned-surface locateAutoMovieSweepPoint queries the canonical compiled surface's frame and radius, avoiding an independent geometry representation.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The surface type also permits parameter correspondence, which this polar locator cannot invert generally; that representational gap is explicit rather than claimed validated.
   * @evidence contracts/development/common.md#meaningful-documentation States the required correspondence, finite-input check, model frame and endpoint projection behavior.
   */
  export type IProps = {
    /** Compiled surface queried by section frame and polar radius. Meaningful radial inversion requires direction correspondence; the locator currently does not reject parameter correspondence, whose curve parameter generally differs from polar angle. */
    surface: IAutoMovieSweepSurface;

    /** Finite position in the surface's model frame, in metres. The locator rejects nonfinite coordinates; distance outside an end is projected into that end plane for the reported radial offset. */
    point: IAutoMovieVector3;
  };

  /**
   * Newly allocated section-plane address and signed radial residual from the locator's selected candidate. This record is mutable and retains neither the source point nor the compiled surface.
   *
   * @evidence contracts/development/design.md#principled-representation u and v are dimensionless spine share and polar turns; offset is a signed radial length, not nearest-surface distance.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The locator returns a new mutable record with only the chosen section, direction and signed radial residual.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Finite plane sampling and local bisection do not establish a global projection or a valid parameter-correspondence address.
   * @evidence contracts/development/common.md#meaningful-documentation Defines ranges, sign, units and sampled-root limitations of each result field.
   */
  export type IResult = {
    /** Chosen normalized spine coordinate in [0,1]; the sampled root search can miss tangential roots or multiple crossings between probes. */
    u: number;

    /** Polar direction in [0,1) turns, measured from frame.x toward frame.y. This is a surface query parameter only for direction correspondence. */
    v: number;

    /** Signed in-plane radial distance minus surface.radius(u,v), in metres. Positive means outside that radial value; this is not Euclidean closest-surface distance. */
    offset: number;
  };
}
