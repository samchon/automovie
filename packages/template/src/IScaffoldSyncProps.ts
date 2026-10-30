/**
 * Inputs for explicit generated-instruction synchronization.
 *
 * @evidence contracts/common.md#principled-implementation The target, rendering identity and optional previous instruction root define a three-way update; no source file presence chooses a narrative route.
 * @evidence contracts/common.md#clear-and-simple-design One record is shared by planning and applying the plan.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Baseline is an explicit prior adopted input; check never authorizes writes.
 * @evidence contracts/common.md#meaningful-documentation Members state path resolution, legacy baseline and dry-run behavior.
 * @evidence contracts/performance.md#efficient-algorithms The erased record chooses no runtime algorithm; its consumers own scans.
 * @evidence contracts/performance.md#reuse-equivalent-work Each sync creates a fresh plan rather than reuse stale filesystem observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The input owns only strings and a boolean, with no descriptor or task.
 */
export interface IScaffoldSyncProps {
  /** Target production directory, resolved against the caller's working directory. */
  location: string;
  /** Project name admitted by renderScaffold; only instruction outputs are applied. */
  name: string;
  /** Previous adopted instruction root for files lacking a stored baseline; never overwritten. */
  baseline?: string;
  /** Inspect the complete plan without changing files or sync state. */
  check?: boolean;
}
