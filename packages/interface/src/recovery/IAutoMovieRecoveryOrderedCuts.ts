import type {
  IAutoMovieRecoveryOrderedContour,
  IAutoMovieRecoverySlabsInput,
} from "..";

/**
 * Ordered source-section observations bound to one source and selection
 * identity. The physical frame and coordinateMm stations retain the registered
 * millimetre chart; section order and observation identities bind each raw
 * contour to its saved observation.
 */
export interface IAutoMovieRecoveryOrderedCuts {
  /**
   * Identity of the new metadata observation, without replacing the old curve
   * collection.
   */
  name: string;

  /**
   * Caller-verified original native-byte identity; no hashing occurs in this
   * record.
   */
  sourceIdentity: string;

  /** Caller-verified registration, selection and original-ordinal identity. */
  sourceSelectionIdentity: string;

  /**
   * Actual zero-origin projection frame in registered mm, with directed unit
   * axes.
   */
  frame: IAutoMovieRecoverySlabsInput["savedSections"][number]["frame"];

  /** Same requested saved-plane order, including empty contour populations. */
  sections: Array<{
    /** Signed physical mm along frame.n. */
    coordinateMm: number;

    /** Caller-verified artifact containing this plane's original publications. */
    observationIdentity: string;

    /** Every raw contour, including failed or degenerate publications. */
    contours: IAutoMovieRecoveryOrderedContour[];
  }>;
}
