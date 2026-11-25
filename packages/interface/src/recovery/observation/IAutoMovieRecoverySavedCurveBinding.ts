import type { AutoMovieVector3Tuple, IAutoMoviePolylineFit } from "../../index";

/**
 * Replay evidence binding one ordered contour to its saved cubic curve. Station
 * coordinates, fitted phases, widths and endpoint jets use the declared
 * millimetre/source-parameter clocks. Status distinguishes exact saved-cubic
 * binding from unavailable evidence; historical trace verification remains
 * explicitly false when present.
 */
export interface IAutoMovieRecoverySavedCurveBinding {
  /** Target's unchanged signed physical source plane, mm. */
  coordinateMm: number;

  /** Target's original raw contour address. */
  contourIndex: number;

  /** Verified saved coefficient-artifact dependency. */
  observationIdentity: string;

  /**
   * Bound means exact saved numeric cubic equality; unavailable carries no
   * correspondence map.
   */
  status: "bound-exact-saved-cubic" | "unavailable";

  /**
   * Qualification limit or failure cause, including original-policy/geometry
   * mismatch.
   */
  diagnostic: string;

  /**
   * Completed target milestones, retained on later rejection; none authorizes
   * publishing an unavailable map.
   */
  completedStages?: Array<
    | "replay-fit"
    | "saved-geometry-equality"
    | "accepted-sample-map"
    | "saved-endpoint-jets"
  >;

  /**
   * Existing fitter's new replay quality, retained once obtained even if later
   * geometry/map/endpoint validation fails; separate from original source-fit
   * quality.
   */
  replayFitQualification?: Omit<IAutoMoviePolylineFit, "curve">;

  /**
   * False records that historical accepted parameters were not retained or
   * independently proven.
   */
  historicalAcceptedTraceVerified?: false;

  /** Whether the existing section owner reversed raw point order before fitting. */
  reversed?: boolean;

  /**
   * Accepted replay samples; repeated knot observations retain each incident
   * span separately.
   */
  samples?: Array<{
    /**
     * Index in the original raw points array, after undoing any fitting
     * reversal.
     */
    rawPointIndex: number;

    /** Incident saved cubic span whose own accepted parameter is retained. */
    spanIndex: number;

    /** Dimensionless accepted parameter on that individual span. */
    localParameter: number;

    /**
     * Saved span-start phase plus localParameter times the actual saved h, in
     * mm.
     */
    fittedPhaseMm: number;
  }>;

  /**
   * Saved span endpoints and derivatives; these are curve tangents, not
   * transverse surface jets.
   */
  endpointJets?: Array<{
    /** Original saved span address. */
    spanIndex: number;

    /** Actual nonuniform physical h of this saved span, mm. */
    widthMm: number;

    /** Saved first endpoint in registered mm. */
    start: Readonly<AutoMovieVector3Tuple>;

    /** Saved last endpoint in registered mm. */
    end: Readonly<AutoMovieVector3Tuple>;

    /** Saved right-sided start derivative in mm per physical phase mm. */
    startDerivative: Readonly<AutoMovieVector3Tuple>;

    /** Saved left-sided end derivative in mm per physical phase mm. */
    endDerivative: Readonly<AutoMovieVector3Tuple>;
  }>;
}
