/**
 * One beat's caption and the slug of its enclosing scene, as the caption join
 * reads them from the screenplay tree.
 *
 * `beatCaptions` builds one record per beat node, keyed by beat id, and
 * `planCaptionSidecar` copies both fields onto every sidecar span whose live
 * shot belongs to that beat.
 *
 * @evidence contracts/common.md#principled-implementation The record carries the beat node's caption verbatim and the slug `screenplaySceneSlug` formats, so a span's scene label and the screenplay heading come from one formatter, and null mirrors the absence the tree payload itself encodes.
 * @evidence contracts/common.md#clear-and-simple-design Two nullable fields are all the sidecar join reads from a beat node; the beat identity stays the map key in `beatCaptions` instead of a third field the join would never read.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No consumer or fixture is special-cased: both nulls stand for states the screenplay tree can hold, an uncaptioned beat and a beat outside every scene.
 * @evidence contracts/common.md#meaningful-documentation The prose names the producer and the reader of the record, and each member says what its null means.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface only shapes a map value and runs no algorithm; the tree walk that fills it is answered on `beatCaptions`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A two-field record type coordinates no requests or phases, so there is no completed work for it to share.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources It holds no handle or task; each record lives exactly as long as the map that `beatCaptions` hands to its caller.
 */
export interface IAutoMovieBeatCaption {
  /** The beat's authored shot caption, or null when the beat authored none. */
  caption: string | null;

  /**
   * Slug of the nearest enclosing scene node, or null when no scene encloses
   * the beat.
   */
  slug: string | null;
}
