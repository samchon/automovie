import type { AutoMovieVector3Tuple, IAutoMoviePolylineFit } from "..";

/**
 * Replay qualification and optional precise sample correspondence for one saved
 * cubic publication.
 */
export interface IAutoMovieRecoverySavedCurveBinding {
  /** Target's original signed section coordinate in millimetres. */
  coordinateMm: number;

  /** Original raw contour ordinal of the target. */
  contourIndex: number;

  /** Saved observation artifact identity of the target. */
  observationIdentity: string;

  /** Exact saved numeric cubic binding or unavailable correspondence. */
  status: "bound-exact-saved-cubic" | "unavailable";

  /** Reason of local refusal or scope of the successful replay evidence. */
  diagnostic: string;

  /** Ordered milestones achieved before success or local refusal. */
  completedStages?: Array<
    | "replay-fit"
    | "saved-geometry-equality"
    | "accepted-sample-map"
    | "saved-endpoint-jets"
  >;

  /** Quality reported by the newly run fitter when available. */
  replayFitQualification?: Omit<IAutoMoviePolylineFit, "curve">;

  /** Explicit false when the outcome addresses historical replay provenance. */
  historicalAcceptedTraceVerified?: false;

  /** Whether fitting used the raw contour's points in reverse order. */
  reversed?: boolean;

  /**
   * New accepted point-to-span parameters in original raw observation
   * addresses.
   */
  samples?: Array<{
    /** Index of this sampled observation in the original raw cut point order. */
    rawPointIndex: number;

    /** Index of the saved span to which this replay sample belongs. */
    spanIndex: number;

    /** Dimensionless accepted replay parameter within that particular span. */
    localParameter: number;

    /**
     * Physical phase in millimetres from saved cumulative span width and local
     * parameter.
     */
    fittedPhaseMm: number;
  }>;

  /**
   * Saved cubic span endpoints and one-sided derivatives per physical curve
   * phase.
   */
  endpointJets?: Array<{
    /** Original saved cubic span ordinal. */
    spanIndex: number;

    /** Actual physical width of this saved span in millimetres. */
    widthMm: number;

    /** Saved span first registered endpoint in millimetres. */
    start: Readonly<AutoMovieVector3Tuple>;

    /** Saved span last registered endpoint in millimetres. */
    end: Readonly<AutoMovieVector3Tuple>;

    /**
     * Saved right-sided start derivative in millimetres per physical phase
     * millimetre.
     */
    startDerivative: Readonly<AutoMovieVector3Tuple>;

    /**
     * Saved left-sided end derivative in millimetres per physical phase
     * millimetre.
     */
    endDerivative: Readonly<AutoMovieVector3Tuple>;
  }>;
}
