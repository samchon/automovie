/**
 * The accepted person the status line names: the committed document's display name and its model's material region count.
 *
 * This status projection contains no candidate draft or admission verdict. Its material-region count describes the displayed model's regions rather than anatomical parts or clinical validity.
 *
 * @evidence contracts/common.md#principled-implementation Committed display name and model region count keep status provenance tied to the accepted document/model pair rather than a pending candidate.
 * @evidence contracts/common.md#clear-and-simple-design Two presentation fields suffice for accepted status while construction checks and draft state have separate owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Material region count is not treated as complete anatomical coverage or a numerical acceptance oracle.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes committed status, candidate absence and material-region interpretation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This status projection selects no model traversal or admission algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Display identity and count supply no numerical cache authority or reusable construction result.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Ordinary name/count data retains no mesh or worker handle; the status owner keeps it for current display.
 *
 * @author Samchon
 */
export interface IConnectedPersonAccepted {
  /** Display name of the committed document. */
  name: string;

  /** Material regions of the committed model. */
  parts: number;
}
