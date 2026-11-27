import type { AutoMovieViewerSubjectKind } from "./AutoMovieViewerSubjectKind.js";

/**
 * Caller-supplied authored kind, id and optional revision for an inspection
 * observation. A label does not establish scene membership or freshness.
 */
export interface IAutoMovieViewerSubject {
  /** Which authored kind the id names. */
  kind: AutoMovieViewerSubjectKind;

  /** Authored id, unique within its kind. */
  id: string;

  /**
   * Revision the observation was taken against, or `null` when the caller has
   * none to state.
   *
   * Source correspondence and reopening remain the caller's responsibility;
   * this record does not verify the supplied revision against source bytes.
   */
  revision: string | null;
}
