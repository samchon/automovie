/**
 * Source incidence witnessed while one section contour is fitted. This
 * acquisition-only record stays outside the source-free coefficient bundle.
 * Face IDs address the original observation input's triangle array; they
 * include every face incident to a contour vertex or crossed edge, so they may
 * include adjacent faces and do not identify an anatomical region or an exact
 * generating patch.
 */
export interface IAutoMovieRecoverySourceLineage {
  /** Signed station coordinate in millimetres along the input's section axis. */
  readonly coordinateMm: number;

  /**
   * Zero-based raw contour ordinal at this station, before fitting or
   * rejection.
   */
  readonly contourIndex: number;

  /**
   * Copied original input.triangles ordinals in deterministic incidence
   * traversal order.
   */
  readonly sourceTriangleIds: readonly number[];

  /**
   * Present only when exact cutter provenance was requested: original faces
   * that emitted the visited cut segments or isolated contact. This differs
   * from the broader incident-face witness above.
   */
  readonly exactSourceTriangleIds?: readonly number[];

  /**
   * Closed and open indices address loft.sections[].loops and reports[].open at
   * this station; failed and degenerate contours publish no fitted curve.
   */
  readonly publication:
    | {
        /**
         * Closed representation discriminator selecting the corresponding
         * observation or result arm.
         */
        kind: "closed";
        /** Closed-loop ordinal within the saved section's admitted loop array. */
        loopIndex: number;
        /**
         * Stable saved coefficient identity, retained without inferring
         * anatomical or material correspondence.
         */
        curveName: string;
      }
    | {
        /**
         * Closed representation discriminator selecting the corresponding
         * observation or result arm.
         */
        kind: "open";
        /** Ordinal in the saved section's open-fit report array. */
        reportIndex: number;
        /**
         * Stable saved coefficient identity, retained without inferring
         * anatomical or material correspondence.
         */
        curveName: string;
      }
    | {
        /**
         * Closed representation discriminator selecting the corresponding
         * observation or result arm.
         */
        kind: "degenerate";
      }
    | {
        /**
         * Closed representation discriminator selecting the corresponding
         * observation or result arm.
         */
        kind: "failed";
        /**
         * Reason this particular result is unavailable or qualified only within
         * a stated numerical scope.
         */
        diagnostic: string;
      };
}
