import type { AutoMovieViewerSubjectKind } from "./AutoMovieViewerSubjectKind.js";

/**
 * Caller-supplied authored kind, id and optional revision for an inspection observation. A label does not establish scene membership or freshness.
 *
 * @evidence contracts/development/design.md#principled-representation Pairs a closed category with the authored id and nullable revision, preserving model-versus-placement identity; callers supply actual uniqueness and source correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One identity record is used by key encoding and capture metadata instead of inferring identity from pixels.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither the shape nor capture resolves an id against source; revision text remains caller evidence rather than a verified content digest.
 * @evidence contracts/development/common.md#meaningful-documentation Documents category/id/revision meanings and the limits of supplied provenance.
 */
export interface IAutoMovieViewerSubject {
  /**
   * Which authored kind the id names.
   */
  kind: AutoMovieViewerSubjectKind;

  /**
   * Authored id, unique within its kind.
   */
  id: string;

  /**
   * Revision the observation was taken against, or `null` when the caller has none to state.
   *
   * Source correspondence and reopening remain the caller's responsibility; this record does not verify the supplied revision against source bytes.
   */
  revision: string | null;
}
