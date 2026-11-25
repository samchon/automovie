import type { IAutoMovieViewOutline } from "../../../construction/IAutoMovieViewOutline";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * Affine physical-Y neck axes and radius-dependent scalar declarations sharing
 * invariant prepared sources.
 *
 * The interface package owns these declarations; AutoMovieHumanHeadNeckScalars
 * in Human supplies their runtime values.
 */
export namespace IAutoMovieHumanHeadNeckScalars {
  /**
   * One call-owned generating family, with prepared immutable bases shared by
   * the constraint owner.
   */
  export interface IOutput {
    /** Actual numeric radius declaration at a selected lower radius. */
    radius(base: number): IAutoMovieViewPart.IOutline;

    /** Actual physical-station centre, independent of the lower-radius trial. */
    centre: IAutoMovieViewPart.IOutline;

    /** The identical invariant axis prepared once by this generating owner. */
    preparedCentre: IAutoMovieViewOutline.IOutline;

    /** Original course parameter length, not another tape. */
    clock: number;

    /** Radius-independent radius ordinate basis. */
    constant: IAutoMovieViewOutline.IOutline;

    /** Radius coefficient of the unknown lower radius. */
    basis: IAutoMovieViewOutline.IOutline;
  }

  /**
   * One affine lower-neck generating axis, before its scalar controls or either
   * anatomical consumer.
   */
  export interface IAxis {
    /** Original parameter is physical world-Y in calibration mm. */
    readonly parameter: "physical-Y-mm";

    /** Shared normal-plane origin, calibration mm. */
    readonly anchor: readonly [number, number, number];

    /** Derivative per physical station mm, including its unit Y component. */
    readonly first: readonly [number, number, number];

    /** The declared affine primitive has zero second derivative. */
    readonly second: readonly [number, number, number];

    /**
     * Actual point on the declared lower/normal affine primitive; no completed
     * curve is read.
     */
    point(station: number): [number, number, number];
  }
}
