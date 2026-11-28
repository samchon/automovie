/**
 * Source face provenance and publication state for one original raw contour at
 * a physical station.
 */
export interface IAutoMovieRecoverySourceLineage {
  /** Signed registered plane coordinate of the observation, in millimetres. */
  readonly coordinateMm: number;

  /**
   * Original ordinal in the raw cut population, before fitting succeeds or
   * fails.
   */
  readonly contourIndex: number;

  /**
   * Broad original source face IDs supporting the cut points by edge or vertex
   * incidence.
   */
  readonly sourceTriangleIds: readonly number[];

  /** Optional original triangles that actually emitted contour segments. */
  readonly exactSourceTriangleIds?: readonly number[];

  /**
   * Outcome selecting a saved closed loop, saved open fit, degenerate
   * observation or failed fit.
   */
  readonly publication:
    | {
        /** Fitter published a closed loop in the associated section. */
        kind: "closed";
        /** Index of the published closed loop in the section's loop array. */
        loopIndex: number;
        /** Stored name of the published closed cubic curve. */
        curveName: string;
      }
    | {
        /** Fitter published an open fit in the station report. */
        kind: "open";
        /** Index of this fit in the report's open array. */
        reportIndex: number;
        /** Stored name of the published open cubic curve. */
        curveName: string;
      }
    | {
        /**
         * The raw observation had insufficient points for its corresponding
         * curve.
         */
        kind: "degenerate";
      }
    | {
        /** The raw contour's fit was attempted and failed. */
        kind: "failed";
        /** Observed cause of the contour fit failure. */
        diagnostic: string;
      };
}
