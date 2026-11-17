import type {
  IAutoMovieRecoveryCameraChartCreationOperation,
  IAutoMovieRecoveryCameraPointTriangulationOperation,
} from "../../index";

/**
 * Measure all four calibrated pose branches on one fixed correspondence set. The largest positive-depth count supplies a candidate; equal winning counts remain explicitly ambiguous even though deterministic order names a candidate. Parallax is summarized only for finite points positive in both cameras.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Row-major 3 by 3 camera rotation in the operation's declared source-to-camera convention. Camera translation in the operation's admitted reconstruction scale; two-view direction alone has no metric length.
 * @evidence contracts/development/design.md#principled-representation Row-major 3 by 3 fundamental matrix in the declared pixel charts; homogeneous scale has no metric meaning.
 * @evidence contracts/development/design.md#minimal-and-owned-surface createRecoveryCameraEstimate, refineRecoveryEpipolarModel, selectRecoveryCameraPose share IAutoMovieRecoveryCameraPoseSelectionOperation's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Triangulated correspondence results in input order, retaining depth and pixel-error qualifications.
 */

export namespace IAutoMovieRecoveryCameraPoseSelectionOperation {
  /**
   * Measure all four calibrated pose branches on one fixed correspondence set. The largest positive-depth count supplies a candidate; equal winning counts remain explicitly ambiguous even though deterministic order names a candidate. Parallax is summarized only for finite points positive in both cameras.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Row-major 3 by 3 camera rotation in the operation's declared source-to-camera convention. Camera translation in the operation's admitted reconstruction scale; two-view direction alone has no metric length.
   * @evidence contracts/development/design.md#principled-representation Row-major 3 by 3 fundamental matrix in the declared pixel charts; homogeneous scale has no metric meaning.
   * @evidence contracts/development/design.md#minimal-and-owned-surface createRecoveryCameraEstimate, refineRecoveryEpipolarModel, selectRecoveryCameraPose share IAutoMovieRecoveryCameraPoseSelectionOperation's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Triangulated correspondence results in input order, retaining depth and pixel-error qualifications.
   */

  export type Operation = (
    fundamental: readonly number[],
    firstPoints: readonly (readonly [number, number])[],
    secondPoints: readonly (readonly [number, number])[],
    first: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    second: ReturnType<IAutoMovieRecoveryCameraChartCreationOperation.Operation>,
    minimumDesignRatio: number,
    maxSweeps: number,
  ) => {
    /** Row-major 3 by 3 camera rotation in the operation's declared source-to-camera convention. */
    rotation: number[];

    /** Camera translation in the operation's admitted reconstruction scale; two-view direction alone has no metric length. */
    translation: [number, number, number];

    /** Row-major 3 by 3 fundamental matrix in the declared pixel charts; homogeneous scale has no metric meaning. */
    fundamental: number[];

    /** Triangulated correspondence results in input order, retaining depth and pixel-error qualifications. */
    points: ReturnType<IAutoMovieRecoveryCameraPointTriangulationOperation.Operation>[];

    /** Positive-depth support count for each candidate pose in candidate order. */
    allPositiveDepthCounts: number[];

    /** Fraction of evaluated correspondences having positive depth in both cameras. */
    positiveDepthFraction: number;

    /** Median accepted ray angle in radians, or null when no usable population exists. */
    medianParallaxRadians: number | null;

    /** Whether one pose has uniquely greatest admitted positive-depth support. */
    uniqueWinner: boolean;

    /** Relative discrepancy between the projected essential model and the estimated epipolar model; dimensionless. */
    relativeProjectionDiscrepancy: number;
  };
}
