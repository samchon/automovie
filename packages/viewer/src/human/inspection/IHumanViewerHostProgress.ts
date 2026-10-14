/**
 * The host page's build progress line.
 *
 * One begin owns the current label, interval and health request. A later begin replaces that generation; settle withdraws late responses, stops polling and clears the line. Elapsed seconds describe waiting and never decide numerical failure.
 *
 * @evidence contracts/common.md#principled-implementation Build-scoped progress identity separates live label/queue telemetry from numerical readiness and discards replies from replaced labels.
 * @evidence contracts/common.md#clear-and-simple-design Begin and settle expose the complete status-line lifetime without moving capture or numerical scheduling into the host UI.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Waiting duration is not a numerical timeout or proof of admission, and unavailable health transport remains telemetry failure.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies owned polling state, replacement, final clearing and elapsed-time limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This progress handle type selects no polling or queue-counter algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The type states generation replacement without implementing shared numerical work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The returned implementation owns interval/request resources; this declaration only exposes their lifetime boundary.
 *
 * @author Samchon
 */
export interface IHumanViewerHostProgress {
  /**
   * Start reporting what is being built, its elapsed seconds and the server queue. A new call replaces and aborts the earlier label's polling request.
   *
   * @evidence contracts/common.md#principled-implementation One current build label scopes telemetry and withdraws older response effects before starting replacement polling.
   * @evidence contracts/common.md#clear-and-simple-design Callers name the work without owning timer or health request details.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Starting a progress line does not establish worker readiness or manufacture queue data.
   * @evidence contracts/common.md#meaningful-documentation The member specifies reported fields and replacement of prior polling.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This begin signature chooses no timer cadence or queue traversal.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work New labels are presentation effects without shared numerical cache identity.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Timer and request acquisition belong to the progress implementation behind begin.
   */
  begin: (what: string) => void;

  /**
   * Stop polling, abort the current health read, withdraw late telemetry and clear the line.
   *
   * @evidence contracts/common.md#principled-implementation Settlement ends the label's publication authority before asynchronous health completion can change its cleared status.
   * @evidence contracts/common.md#clear-and-simple-design One final boundary retires progress resources without cancelling the actual numerical build.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Clearing telemetry does not claim completed numerical evaluation or hidden build success.
   * @evidence contracts/common.md#meaningful-documentation The member identifies polling stop, request abortion and late-response withdrawal.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This signature chooses no timer or request retirement algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Ending presentation is an effect rather than cached numerical computation.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The progress owner implements actual interval and request release through this callback.
   */
  settle: () => void;
}
