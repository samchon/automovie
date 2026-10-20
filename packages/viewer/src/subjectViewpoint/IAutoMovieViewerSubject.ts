import type { AutoMovieViewerSubjectKind } from "./AutoMovieViewerSubjectKind.js";

/**
 * Caller-supplied authored kind, id and optional revision for an inspection observation. A label does not establish scene membership or freshness.
 *
 * @evidence contracts/common.md#principled-implementation Pairs a closed category with the authored id and nullable revision, preserving model-versus-placement identity; callers supply actual uniqueness and source correspondence.
 * @evidence contracts/common.md#clear-and-simple-design One identity record is used by key encoding and capture metadata instead of inferring identity from pixels.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Neither the shape nor capture resolves an id against source; revision text remains caller evidence rather than a verified content digest.
 * @evidence contracts/common.md#meaningful-documentation Documents category/id/revision meanings and the limits of supplied provenance.
 * @evidence contracts/performance.md#efficient-algorithms The record chooses no lookup algorithm; key encoding copies id/revision text and scene resolution is outside this shape.
 * @evidence contracts/performance.md#reuse-equivalent-work Matching records may name the same intended subject only with the same actual source; mutable scene or revision changes invalidate that premise.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Records retain only scalar text; capture returns the same subject reference and no independent revision store or resource owner.
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
