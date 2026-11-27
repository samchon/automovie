import type {
  IAutoMovieRecoverySections,
  IAutoMovieRecoverySlabObservation,
  IAutoMovieRecoverySourceLineage,
} from "..";

/**
 * Acquisition-only source topology with newly verified cut addresses and
 * caller-attested saved curve references. No coefficients, source positions,
 * source triangles or normal fields are returned. PL event qualification has
 * the existing source-topology meaning and does not qualify the saved curves.
 */
export interface IAutoMovieRecoverySlabs {
  /** New acquisition identity, independent of saved curve names. */
  name: string;

  /** Caller source identity; this operation does not compute its byte hash. */
  sourceIdentity: string;

  /**
   * Caller registration/selection/original-ordinal identity, compared before
   * cutting.
   */
  sourceSelectionIdentity: string;

  /** Original caller projection direction, before normalization. */
  axis: IAutoMovieRecoverySections["axis"];

  /** Original caller frame reference, before orthogonal projection. */
  reference: IAutoMovieRecoverySections["reference"];

  /**
   * Actual zero-origin physical projection frame used by cuts and critical
   * events.
   */
  frame: IAutoMovieRecoverySections["frame"];

  /** Scope of independently checked source-to-publication correspondence. */
  bindingAuthority: "raw-cut-addresses-and-closure-only";

  /**
   * Byte hashing and saved coefficient/selection correctness remain caller
   * obligations.
   */
  callerBindingRequired: true;

  /**
   * No curve coefficient, degree, rational weight or physical phase was
   * accessed.
   */
  curveCoefficientsRead: false;

  /** Same-order saved planes with newly recut exact source lineage. */
  sections: Array<{
    /** Original signed plane coordinate, millimetres. */
    coordinateMm: number;

    /** Caller-verified saved artifact identity, retained without hashing. */
    observationIdentity: string;

    /**
     * Fresh broad/exact source addresses with unchanged symbolic publication
     * fields.
     */
    sourceLineage: IAutoMovieRecoverySourceLineage[];

    /**
     * Raw closure and sample count; failed saved fits have no closure claim to
     * compare.
     */
    rawContours: Array<{
      /**
       * Raw contour ordinal within its physical plane, before fitting or
       * rejection.
       */
      contourIndex: number;

      /**
       * Whether the observed path's actual incidence returns to its first
       * endpoint; no artificial closing segment is inferred.
       */
      closed: boolean;

      /**
       * Raw observed point population retained for this contour, including
       * unsupported contacts.
       */
      observationCount: number;

      /**
       * Whether the reobserved closure was explicitly compared with the saved
       * publication.
       */
      savedClosureCompared: boolean;
    }>;
  }>;

  /**
   * All source components, exact ports, measured PL events and unresolved
   * issues for every requested pair.
   */
  slabs: IAutoMovieRecoverySlabObservation[];
}
