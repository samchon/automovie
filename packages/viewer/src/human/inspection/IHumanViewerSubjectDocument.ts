/**
 * What the catalogue reads of a published face subject: its id and display name. The rest is face document JSON admitted by the face owner when built.
 *
 * @evidence contracts/common.md#principled-implementation Catalogue code reads published subject identity and optional display name while leaving remaining numerical face JSON to owner admission.
 * @evidence contracts/common.md#clear-and-simple-design The minimal subject projection prevents catalogue discovery from duplicating the face document's validation schema.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A subject id is descriptive only and never bypasses face-owner admission or embeds a named preset's geometry.
 * @evidence contracts/common.md#meaningful-documentation The comment defines the catalogue projection, optional name and deferred face-owner admission of the remaining JSON.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This subject projection chooses no document parsing or face construction algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Identity labels alone are not cache authority; catalogue keys additionally include full document, basis and source digests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The projection contains strings without handles; the face-document catalogue retains and replaces subject arrays.
 *
 * @author Samchon
 */
export interface IHumanViewerSubjectDocument {
  /** Subject id. */
  id: string;

  /** Display name, when the subject has one. */
  name?: string;
}
