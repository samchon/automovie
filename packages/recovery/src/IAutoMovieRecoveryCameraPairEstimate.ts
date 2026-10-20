import type { IAutoMovieRecoveryCameraPairInput } from "@automovie/interface/recovery";

/**
 * Automatic image correspondences and conditional calibrated relative pose.
 * A successful computation may still refuse a camera. Accepted pose is in the
 * first-camera unit-baseline gauge, with unknown physical scale and no recovered
 * surface, unseen-region completion, covariance or correspondence-truth claim.
 *
 * @evidence contracts/common.md#principled-implementation Fixed source identities, actual interest-point matches, calibrated pixel residuals, four-branch depth/parallax and competing planar support distinguish measured evidence from a conditional pose. The pose is absent after any qualification refusal, and sampling targets describe only their ideal all-inlier model.
 * @evidence contracts/common.md#clear-and-simple-design One JSON-compatible observation record separates completion of computation, explicit camera refusal, retained image evidence and the accepted relative transform; RGB buffers and descriptors remain transient computation data.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No truth pose, reference mesh, metric depth, unobserved geometry or refused candidate transform is labelled as an accepted camera. Undefined scalar diagnostics remain null rather than invented zero error.
 * @evidence contracts/common.md#meaningful-documentation Gives source/assertion ownership, original pixel charts, unit gauge, null meanings, conditional sampling and the distinction between camera evidence and an editable surface asset.
 * @evidence contracts/performance.md#efficient-algorithms The structural result adds no fitting work; producing functions document image, descriptor, proposal and optimizer costs.
 * @evidence contracts/performance.md#reuse-equivalent-work Source calibration, complete policy and budgets accompany the same measured evidence so consumers do not infer a different fitting identity; the type defines no cross-request cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns O(matches) plain records and fixed-size matrices/counters. No RGB, descriptor pyramid, process, callback, source file handle or external reference is retained.
 * @author Samchon
 */
export interface IAutoMovieRecoveryCameraPairEstimate {
  /** Versioned automatic relative-camera observation artifact. */
  schema: "automovie-recovery-camera-pair-estimate-v1";

  /** Fixed scene identity asserted by the acquisition caller. */
  objectId: string;

  /** Keeps analytic measurements, real photographs and inconsistent controls separate. */
  cohort: IAutoMovieRecoveryCameraPairInput["cohort"];

  /** Conditional camera qualification; refused evidence still records completed observations. */
  status: "accepted-relative-pose" | "refused";

  /** Every observed failed qualification, empty only for conditional camera acceptance. */
  refusalReasons: string[];

  /** Complete operating point used for this artifact, copied without mutable pixel buffers. */
  policy: IAutoMovieRecoveryCameraPairInput["policy"];

  /** Complete declared work limits; actual counters below distinguish work from a limit. */
  budget: IAutoMovieRecoveryCameraPairInput["budget"];

  /** Source identities and caller assertions; resident operation does not verify original-file SHA or lens history. */
  sources: {
    /** Unique acquisition identity in first/second order. */
    id: string;

    /** Caller-asserted fixed source-byte hash; Node hosts verify their acquired source inputs. */
    sourceSha256: string;

    /** Declared decoding, crop, orientation and correction history for the current chart. */
    pixelProvenance: string;

    /** Resident integer-centre dimensions in pixels. */
    width: number;

    /** Resident integer-centre height in pixels. */
    height: number;

    /** Supplied corrected pinhole intrinsics, including nullable asserted uncertainty. */
    camera: IAutoMovieRecoveryCameraPairInput["views"][number]["camera"];
  }[];

  /** Actual populations for each automatic image observation, in source order. */
  features: {
    /** Source identity for the detector counters. */
    viewId: string;

    /** Interior response maxima before quadratic/orientation/window admission. */
    rawCorners: number;

    /** Descriptor-window-valid candidates entering ANMS. */
    validCandidates: number;

    /** ANMS-selected points before actual descriptor observation. */
    selectedBeforeDescriptor: number;

    /** Retained finite nonzero normalized descriptors. */
    observedDescriptors: number;

    /** Selected points omitted for an unresolved descriptor norm. */
    zeroDescriptors: number;

    /** Selected points omitted when floating sample coordinates cross their image support. */
    invalidSupportDescriptors: number;
  }[];

  /** Tentative unique mutual appearance matches; epipolar support does not prove material identity. */
  matches: {
    /** Selected first-view feature index. */
    firstFeatureIndex: number;

    /** Selected second-view feature index. */
    secondFeatureIndex: number;

    /** First original pixel-centre coordinate [column,row]. */
    firstPx: [number, number];

    /** Second original pixel-centre coordinate [column,row]. */
    secondPx: [number, number];

    /** Euclidean descriptor distance divided by its distinct second-neighbour distance. */
    descriptorDistanceRatio: number;

    /** Squared Euclidean distance between normalized appearance descriptors. */
    squaredDescriptorDistance: number;

    /** Whether the fitted final consensus meets the Sampson threshold, before the separate essential-projection consistency check. */
    epipolarInlier: boolean;

    /** Whether the best competing map supports this final epipolar inlier. */
    homographyInlier: boolean;
  }[];

  /** Null when fewer than eight tentative correspondences permit any epipolar proposal. */
  consensus: {
    /** Actual eight-point proposal count, including numerical refusals. */
    trials: number;

    /** Required ideal all-inlier trials at the final support; null denotes an unattainable finite target. */
    requiredTrialsAtFinalSupport: number | null;

    /** Operational trial target only; deterministic finite-generator proposals do not certify physical correctness. */
    conditionalTrialTargetMet: boolean;

    /** Proposal models refused by their declared numerical owners. */
    numericalRefusals: number;

    /** Eligible proposals refined in draw order before winner comparison, bounded by the declared local budget. */
    localRefinements: number;

    /** Nonconverged local proposals or final re-estimation failures, including provisional changing subsets. Unexpected runtime errors fail the operation instead. */
    localRefinementRefusals: number;

    /** Final re-estimations, including repeats after a changed sampling target. */
    finalReestimations: number;

    /** True only when every final fixed-subset optimizer terminates and its final inlier set stabilizes. */
    finalRefinementConverged: boolean;

    /** Final fixed-subset optimizer diagnostics, empty when no final optimizer completed. */
    optimizerFits: {
      /** Actual attempted local steps. */
      iterations: number;

      /** Steps admitted by a decreasing actual robust objective. */
      acceptedSteps: number;

      /** Local stopping reason; iteration-budget remains unfinished. */
      termination: "gradient" | "step" | "cost" | "iteration-budget";

      /** Whether the fixed-subset local numerical stopping rule completed. */
      converged: boolean;

      /** Initial soft-L1 objective in squared pixels under the declared scale. */
      initialCost: number;

      /** Final soft-L1 objective for the same fixed subset. */
      finalCost: number;

      /** Smallest scaled original-Jacobian singular ratio visited by that fit. */
      minimumLocalDesignRatio: number;
    }[];

    /** Eighth/largest original-design singular ratio on the entire final inlier population, null without a resolved fit. */
    finalDesignSingularRatio: number | null;

    /** Final calibrated epipolar inlier count. */
    inliers: number;

    /** Inlier count divided by all tentative matches. */
    inlierFraction: number;

    /** Final inlier median mean-two-sided point-to-line distance in pixels, or null without finite support. */
    medianSymmetricPointLinePx: number | null;

    /** Final inlier linear-interpolated 90th percentile point-to-line distance in pixels. */
    p90SymmetricPointLinePx: number | null;

    /** Fractions of original pixel-chart area enclosed by observed inlier convex hulls, first/second; no surface coverage claim. */
    inlierImageHullFractions: [number, number] | null;

    /** Positive-in-both-cameras count divided by all final inliers, or null without a resolved candidate. */
    positiveDepthFraction: number | null;

    /** Median ray angle for finite positive-depth points in radians, or null when absent. */
    medianParallaxRadians: number | null;

    /** Four positive-depth counts; a tied maximum cannot qualify a unique camera. */
    allPositiveDepthCounts: number[];

    /** Null without four final epipolar inliers to test the planar competitor. */
    homography: {
      /** Fixed final epipolar-inlier population; returned matches identify its members. */
      population: number;

      /** Best finite symmetric-transfer support count within that population. */
      support: number;

      /** Integer count at or above which the declared overlap refuses this nonplanar route. */
      forbiddenSupport: number;

      /** Actual four-point proposal count. */
      trials: number;

      /** Conditional ideal target for the forbidden support, null when unattainable. */
      requiredTrialsAtForbiddenSupport: number | null;

      /** Completed target for the conditional absence search; never a geometric proof of absence. */
      conditionalTrialTargetMet: boolean;

      /** Direct observed ambiguity evidence, independent of an unfinished absence target. */
      forbiddenOverlapFound: boolean;

      /** Numerical proposal failures. */
      numericalRefusals: number;

      /** Numerical failures while refitting an improving homography support set. */
      refitRefusals: number;
    } | null;
  } | null;

  /** Present only after every qualification passes; this transform is camera evidence, not saved surface geometry. */
  pose: {
    /** First source is identity, looking along+Z with image+X right and+Y down. */
    gauge: "first-camera-unit-baseline";

    /** Physical length scale is unobserved. */
    metricScale: "unknown";

    /** Row-major proper rotation mapping first-camera coordinates into the second camera. */
    rotation: number[];

    /** Unit translation in second-camera coordinates in X2=R*X1+t. */
    translation: [number, number, number];

    /** Relative Frobenius discrepancy when the final calibrated model is equalized in essential space; numerical consistency, not covariance or truth error. */
    essentialProjectionDiscrepancy: number;
  } | null;
}
