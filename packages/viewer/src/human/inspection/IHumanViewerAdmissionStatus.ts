/**
 * Admission work the server is doing or waiting on, as `/health` reports it.  Counts and waiting causes come from the admission owner. A pending transport is distinct from a numerical verdict and does not establish whole-job progress or recovery policy.
 *
 * @evidence contracts/common.md#principled-implementation Reports actual in-flight task count, waiting-document count and distinct stored pending reasons from createHumanViewerAdmission.
 * @evidence contracts/common.md#clear-and-simple-design Exposes local observation without combining pending transport with numerical verdict or whole-job progress.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Counts do not establish a planned total, ETA or automatic retry policy; waiting records can include previously encountered document ids.
 * @evidence contracts/common.md#meaningful-documentation asking counts unsettled requests and waiting counts stored pending reasons; reasons are distinct strings rather than complete diagnostic events.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The shape performs no scan; status traverses waiting records to deduplicate causes while map sizes supply counts.
 * @evidence contracts/performance.md#reuse-equivalent-work The status is freshly projected from owner maps; numerical judgments are reused by key, not by equal aggregate counts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owner request maps retire on settlement, while verdict/waiting ids lack independent caps and removed-id pruning; this snapshot owns no request.
 *
 * @author Samchon
 */
export interface IHumanViewerAdmissionStatus {
  /** Admissions asked of the page and not yet answered. */
  asking: number;

  /**
   * Documents whose admission could not run, held pending until a frame announces itself.
   */
  waiting: number;

  /** The distinct reasons those documents wait for. */
  reasons: string[];
}
