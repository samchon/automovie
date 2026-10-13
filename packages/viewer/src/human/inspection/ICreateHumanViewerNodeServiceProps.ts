/**
 * Host source and loopback bindings for its isolated numerical sessions.
 *
 * @evidence contracts/common.md#principled-implementation Each numerical session forks the maintained entry and pins this live revision and checked byte/membership witness before accepting product commands.
 * @evidence contracts/common.md#clear-and-simple-design Keeps loopback data origin, maintained worker directory and source authority separate from session/process bookkeeping.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Host NODE_OPTIONS/runtime manifests cannot select a previous checked realm; current revision and witnesses must still match startup and post boundaries.
 * @evidence contracts/common.md#meaningful-documentation Names the checked Node entry location and live source readings; numerical process readiness is distinct from GPU renderer or display admission.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The record performs no IO; session creation forks a checked realm, and each source check serializes its input witness.
 * @evidence contracts/performance.md#reuse-equivalent-work Bindings are reused by the session owner but every source check refreshes revision/inputs; old readiness cannot authorize changed bytes or membership.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The host owns service lifetime; sessions and collected stderr have no separate cap, and service retirement retains completion until actual child close.
 *
 * @author Samchon
 */
export interface ICreateHumanViewerNodeServiceProps {
  /** Origin of this resident viewer's unchanged digest-checked data routes. */
  origin: string;

  /** Directory containing the maintained Node numerical entry. */
  directory: string;

  /**
   * Current source identity, reread rather than stored across an edit.
   *
   * @evidence contracts/common.md#principled-implementation Reads current browser/admission source authority to pin startup and refuse a numerical session after source replacement.
   * @evidence contracts/common.md#clear-and-simple-design Lets the source owner compute the digest while session code only compares it at authority boundaries.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A saved startup revision cannot authorize later commands; mismatch retires the session with its measured source-change cause.
   * @evidence contracts/common.md#meaningful-documentation The callback is live, including failure classification and ready/post checks; equal text still requires matching checked-input witnesses.
   * @evidence contracts/performance.md#efficient-algorithms A fixed number of revision comparisons surrounds each command/startup; digest maintenance is performed by the source owner.
   * @evidence contracts/performance.md#reuse-equivalent-work A session retains its initial revision, but current callbacks are reread instead of reusing that initial observation as present authority.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns a string without owning a watcher or child; pinned revision lives only with the session until retirement.
   */
  revision: () => string;

  /**
   * Actual code/config membership and byte witnesses.
   *
   * @evidence contracts/common.md#principled-implementation Supplies current checked code/config byte and file-membership witnesses used alongside revision to authorize the numerical realm.
   * @evidence contracts/common.md#clear-and-simple-design Keeps actual compiler input population with the checked-input reader rather than inferring it from runtime imports alone.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A missing or changed witness cannot be replaced by readiness intent; source-check failures remain reported causes.
   * @evidence contracts/common.md#meaningful-documentation The record describes input paths and witnesses, not geometry results or proof of a successful build; ordering must match its deterministic owner.
   * @evidence contracts/performance.md#efficient-algorithms Reading and JSON comparison scale with checked file count and witness text; the service repeats this authority work at required boundaries.
   * @evidence contracts/performance.md#reuse-equivalent-work Initial session witnesses are retained, and current ones are reread because unchanged revision alone cannot prove their continued equivalence.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Each session retains its startup witness until close; witness size and session count have no cap enforced by this binding.
   */
  inputs: () => Record<string, string>;
}
