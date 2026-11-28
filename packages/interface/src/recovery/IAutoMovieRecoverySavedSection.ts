import type {
  IAutoMovieRecoverySections,
  IAutoMovieRecoverySourceLineage,
} from "..";

/**
 * Caller-bound record of one saved physical section and every raw contour
 * publication at that station.
 */
export interface IAutoMovieRecoverySavedSection {
  /**
   * Original signed station coordinate along the cutting normal, in
   * millimetres.
   */
  coordinateMm: number;

  /** Caller-attested identity of the registered source. */
  sourceIdentity: string;

  /**
   * Caller-attested identity of the selected source incidence and ordinal
   * space.
   */
  sourceSelectionIdentity: string;

  /** Caller-attested identity of the saved section artifact. */
  observationIdentity: string;

  /** Original registered zero-origin cutting frame and its oriented unit axes. */
  frame: IAutoMovieRecoverySections["frame"];

  /** Whether the original observation used exact-coordinate alias incidence. */
  exactCoordinateAliases: boolean;

  /**
   * One saved publication per original raw contour, including failures and
   * degenerate contacts.
   */
  sourceLineage: readonly IAutoMovieRecoverySourceLineage[];
}
