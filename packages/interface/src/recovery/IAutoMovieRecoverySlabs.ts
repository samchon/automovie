import type {
  IAutoMovieRecoverySections,
  IAutoMovieRecoverySlabObservation,
  IAutoMovieRecoverySourceLineage,
} from "..";

/**
 * Raw saved-cut binding evidence and source slab observations, with coefficient
 * handling excluded.
 */
export interface IAutoMovieRecoverySlabs {
  /** Caller label for this source-slab observation collection. */
  name: string;

  /** Caller-attested identity of the registered source. */
  sourceIdentity: string;

  /** Caller-attested identity of the original source selection or ordinal space. */
  sourceSelectionIdentity: string;

  /** Original section direction submitted by the caller. */
  axis: IAutoMovieRecoverySections["axis"];

  /**
   * Original direction whose projected component supplies the section frame V
   * axis.
   */
  reference: IAutoMovieRecoverySections["reference"];

  /** Common registered zero-origin physical frame of the admitted cuts. */
  frame: IAutoMovieRecoverySections["frame"];

  /** Literal scope of binding on raw cut addresses and observed closure kind. */
  bindingAuthority: "raw-cut-addresses-and-closure-only";

  /**
   * Literal acknowledgement that external identity and registration
   * verification belong to the caller.
   */
  callerBindingRequired: true;

  /**
   * Literal false because no curve coefficients are read during this
   * observation.
   */
  curveCoefficientsRead: false;

  /**
   * Bound saved sections in request order, each carrying independent source
   * lineage and raw contour facts.
   */
  sections: Array<{
    /** Physical millimetre station at which the saved section was recut. */
    coordinateMm: number;

    /** Caller-attested identity of the matched section observation artifact. */
    observationIdentity: string;

    /** Rebound raw-cut lineage and a copy of each saved publication state. */
    sourceLineage: IAutoMovieRecoverySourceLineage[];

    /** Freshly recut contour observations in original contour order. */
    rawContours: Array<{
      /** Original ordinal of the contour in the repeated exact cut. */
      contourIndex: number;

      /** Whether the repeated raw cut is closed. */
      closed: boolean;

      /** Number of raw cut points in this contour. */
      observationCount: number;

      /**
       * Whether saved publication supported a closure comparison. A saved fit
       * failure provides no closure evidence.
       */
      savedClosureCompared: boolean;
    }>;
  }>;

  /**
   * Source slab observations keyed by the requested increasing physical cut
   * pairs.
   */
  slabs: IAutoMovieRecoverySlabObservation[];
}
