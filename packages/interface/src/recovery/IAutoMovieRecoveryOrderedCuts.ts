import type {
  IAutoMovieRecoveryOrderedContour,
  IAutoMovieRecoverySlabsInput,
} from "..";

/**
 * Physical recuts of saved sections with raw point order, exact segment
 * ownership and provenance.
 */
export interface IAutoMovieRecoveryOrderedCuts {
  /** Caller label for the ordered-cut collection. */
  name: string;

  /** Caller-attested registered source identity for all ordered cuts. */
  sourceIdentity: string;

  /** Caller-attested original native face selection identity. */
  sourceSelectionIdentity: string;

  /**
   * Registered origin and normalized cutting axes common to the selected saved
   * planes.
   */
  frame: IAutoMovieRecoverySlabsInput["savedSections"][number]["frame"];

  /** Reobserved sections in the given saved request order. */
  sections: Array<{
    /**
     * Signed physical coordinate where the saved section was recut, in
     * millimetres.
     */
    coordinateMm: number;

    /** Caller-attested identity of this saved section observation artifact. */
    observationIdentity: string;

    /** Fresh raw contours in cutter traversal and original population order. */
    contours: IAutoMovieRecoveryOrderedContour[];
  }>;
}
