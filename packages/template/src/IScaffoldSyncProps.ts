/**
 * Inputs for explicit generated-instruction synchronization.
 *
 * @evidence contracts/development/design.md#principled-representation The target and optional previous instruction root define a three-way update against the name-independent instruction bundle; no source file presence chooses a narrative route.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record is shared by planning and applying the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Baseline is an explicit prior adopted input; check never authorizes writes.
 * @evidence contracts/development/common.md#meaningful-documentation Members state path resolution, legacy baseline and dry-run behavior.
 */
export interface IScaffoldSyncProps {
  /** Directory holding the generated `AGENTS.md`: a single production or a workspace root, resolved against the caller's working directory. */
  location: string;
  /** Previous adopted instruction root the caller asserts the files came from; a file it supplies is compared with it instead of the stored digest, a file it lacks falls back to stored state. Never overwritten. */
  baseline?: string;
  /** Inspect the complete plan without changing files or sync state. */
  check?: boolean;
}
