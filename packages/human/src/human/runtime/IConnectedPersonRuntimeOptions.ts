/**
 * Optional report-only assembly census and actual construction progress for the connected person runtime. Census changes reporting work, not numerical admission rules. Observers are effectful caller callbacks whose exceptions propagate; their omission adds no progress reporting or current viewer-health evidence.
 *
 * @evidence contracts/common.md#principled-implementation Explicit census selection and completed-stage observer describe the existing person construction owner's report seam without another anatomy verdict.
 * @evidence contracts/common.md#clear-and-simple-design Two optional reporting controls remain separate from source generation and person document inputs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Progress names an actual completed owner boundary, not successful anatomy or GPU health; observer side effects/exceptions are not silently suppressed.
 * @evidence contracts/common.md#meaningful-documentation Prose distinguishes report work, unchanged admission rules, neutral omission and caller-owned observer effects.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This option type runs no census traversal or callback; construction/runtime implementations own their actual costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The reporting carrier implements no evaluator cache or progress-event coordinator.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Declaring callbacks acquires no worker or timer; actual runtime/caller owners control callback and resource lifetime.
 *
 * @author Samchon
 */
export interface IConnectedPersonRuntimeOptions {
  /**
   * True requests the person builder's report-only assembly census of unjudged relations and part populations. It adds actual work without changing judged conditions. Omission/false retain ordinary reporting; exact-text cached construction may reuse its existing report.
   */
  census?: boolean;

  /**
   * Receive actual construction completions during initial evaluator preparation; observer exceptions propagate. Later request progress is supplied by that request's own callback.
   *
   * @evidence contracts/common.md#principled-implementation Completed owner stages relay unchanged preparation boundaries without fabricating intermediate progress or admission outcomes.
   * @evidence contracts/common.md#clear-and-simple-design A string-stage callback exposes reporting while the runtime owns stage routing and numerical evaluation.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An observed stage is neither current GPU health nor clinical acceptance, and callback errors remain visible to construction.
   * @evidence contracts/common.md#meaningful-documentation Prose states preparation timing, request-specific later routing and effectful error propagation.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This callback signature executes no reporting/evaluation work; the actual observer/runtime own those operations.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The erased observer declaration implements no progress deduplication or request sharing.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources No task or stage buffer is acquired by this signature; the runtime and caller own actual callback retention.
   */
  progress?: (stage: string) => void;
}
