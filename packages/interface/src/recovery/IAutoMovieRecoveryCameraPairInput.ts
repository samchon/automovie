/**
 * Two fixed RGB observations with supplied pinhole intrinsics and unknown pose.
 * Integer (column,row) denotes a pixel centre in the supplied calibration chart.
 * This differs from the orthographic support observer's pixel-edge convention.
 * Intrinsics, correction history and rigidity are caller assertions; this record
 * neither calibrates a lens nor establishes a static scene from image bytes.
 *
 * @evidence contracts/common.md#principled-implementation Supplied upper-triangular pinhole calibration and unchanged pixel-centre charts permit a conditional calibrated two-view problem while leaving camera extrinsics and metric scale unobserved.
 * @evidence contracts/common.md#clear-and-simple-design Resident pixel acquisition, explicit operating thresholds and finite work limits share one input; observed features and estimated poses are returned separately from saved shape coefficients.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The input contains no truth pose, manual correspondence, mask, subject-specific control point, trained model or reference mesh. Static-scene and lens-correction assumptions remain assertions.
 * @evidence contracts/common.md#meaningful-documentation Gives borrowed RGB lifetime, calibration and pixel units, operating thresholds, budget populations and the difference from supplied orthographic cameras.
 */
export interface IAutoMovieRecoveryCameraPairInput {
  /** Version of the estimated-extrinsics resident image pair. */
  schema: "automovie-recovery-camera-pair-v1";

  /** Common fixed object/scene identity; consistency is asserted rather than proved. */
  objectId: string;

  /** The observed scene, including any retained background features, is asserted static. */
  rigidity: "asserted-fixed-scene";

  /** Keep real photographic measurements distinct from analytic and inconsistent controls. */
  cohort: "analytic" | "photograph" | "inconsistent-stress";

  /** Exactly two unique views, in the order defining the returned first-camera gauge. */
  views: {
    /** Unique image/camera identity. */
    id: string;

    /** Caller-asserted lowercase SHA-256 of fixed source bytes; decoding/capture derivations belong to pixelProvenance. File hosts verify acquired inputs. */
    sourceSha256: string;

    /** Explicit decoding, orientation, crop and correction history of this exact chart. */
    pixelProvenance: string;

    /** Positive integer width of the calibrated resident chart. */
    width: number;

    /** Positive integer height of the calibrated resident chart. */
    height: number;

    /** Exactly 3*width*height row-major unsigned sRGB bytes; caller keeps these unchanged, including from other workers, until the synchronous operation returns. */
    rgb8: Uint8Array;

    /** Caller-supplied lens calibration in this exact pixel-centre chart. */
    camera: {
      /** Perspective pinhole model; distortion parameters are not estimated. */
      type: "pinhole";

      /** Intrinsics are given independently of the estimated relative pose. */
      calibration: "supplied-intrinsics";

      /** Caller assertion that radial/tangential distortion has already been corrected. */
      distortion: "caller-corrected";

      /** Positive [fx,fy] in pixels, permitting unequal pixel-axis scales. */
      focalPx: [number, number];

      /** Finite K(0,1) skew in pixels; K(1,0)=K(2,0)=K(2,1)=0 and K(2,2)=1. */
      skewPx: number;

      /** Finite [cx,cy] in the same integer-pixel-centre chart. */
      principalPointPx: [number, number];

      /** Supplied calibration uncertainty in pixels, or null when unknown; not estimated covariance. */
      uncertaintyPx: number | null;
    };
  }[];

  /** Current classical method and explicit experimental operating point. */
  policy: {
    /** Multiscale Harris positions, oriented gradient descriptors and calibrated eight-point consensus. */
    family: "harris-gradient-calibrated-eight-point";

    /** Positive harmonic Harris response threshold in squared grayscale-byte units. */
    minimumCornerResponse: number;

    /** ANMS stronger-neighbour robustness strictly between zero and one. */
    suppressionRobustness: number;

    /** Strict Euclidean nearest/second-distinct-feature distance ratio in (0,1). */
    descriptorDistanceRatio: number;

    /** Positive pixel Sampson threshold used to score calibrated consensus. */
    maximumSampsonErrorPx: number;

    /** Conditional sampling confidence in (0,1), not probability that a returned pose is physically correct. */
    samplingConfidence: number;

    /** Unsigned 32-bit deterministic sampling identity, independent of fixture or invocation order. */
    samplingSeed: number;

    /** Positive minimum unique accepted correspondence count, at least eight. */
    minimumInliers: number;

    /** Minimum inliers divided by all tentative matches, in (0,1]. */
    minimumInlierFraction: number;

    /** Positive median symmetric point-to-epipolar-line error limit in pixels. */
    maximumMedianErrorPx: number;

    /** Positive 90th-percentile symmetric point-to-line error limit in pixels. */
    maximumP90ErrorPx: number;

    /** Minimum triangulated points in front of both cameras, in (0,1]. */
    minimumPositiveDepthFraction: number;

    /** Positive median calibrated ray parallax in radians; metric scale remains unknown. */
    minimumParallaxRadians: number;

    /** Homography overlap at or above this fraction of epipolar inliers rejects the nonplanar route, in (0,1]. */
    maximumHomographyOverlapFraction: number;

    /** Positive symmetric forward/backward RMS homography transfer threshold in pixels. */
    maximumHomographyTransferPx: number;

    /** Positive minimum eighth/largest singular-value ratio of the original eight-point design. */
    minimumDesignSingularRatio: number;

    /** Positive pixel scale of the soft-L1 local Sampson objective. */
    refinementLossScalePx: number;
  };

  /** Positive integer work limits checked before the corresponding allocation or traversal. */
  budget: {
    /** Aggregate resident pixels of both images. */
    maxPixels: number;

    /** Descriptor-valid Harris candidates per image before spatial suppression. */
    maxCandidates: number;

    /** Retained physical interest points per image, no more than maxCandidates. */
    maxFeatures: number;

    /** Maximum detection Gaussian-pyramid levels; pixels are downsampled without upscaling. */
    maxPyramidLevels: number;

    /** Exact descriptor pairs compared, not descriptor scalar operations. */
    maxDescriptorPairs: number;

    /** Maximum proposals for each independent fundamental or homography consensus. */
    maxRansacTrials: number;

    /** Minimum proposals before adaptive conditional-confidence stopping. */
    minimumRansacTrials: number;

    /** Maximum proposals with at least eight calibrated inliers refined in draw order before winner comparison. Exhaustion can miss a better basin. */
    maxLocalRefinements: number;

    /** Maximum local pose iterations per refit; at most three inlier refits are attempted. */
    maxRefinementIterations: number;

    /** Maximum complete Jacobi sweeps per original-design decomposition. */
    maxSingularSweeps: number;
  };
}
