import { requireProcessId } from "./requireProcessId.ts";

/**
 * Admit a creation-ordered process tree from immutable OS observations. Parent
 * IDs survive their old process allocation, so an edge is usable only when the
 * current parent was created strictly before its child. Decimal stamps use
 * BigInt to preserve adjacent microseconds beyond Number's exact integer range.
 * The result contains owned records in parent-first order. A missing or reused
 * root and ambiguous snapshot refuse before any native handle is terminated.
 *
 * @evidence contracts/common.md#principled-implementation Unique PID/birth records and exact integer creation order exclude stale parent links without floating-point time collapse.
 * @evidence contracts/common.md#clear-and-simple-design One immutable traversal owns ancestry admission independently of native handle acquisition or termination.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Refuses ambiguous records and reused roots instead of using unchecked recursive process termination.
 * @evidence contracts/common.md#meaningful-documentation States exact stamp arithmetic, immutable inputs, output order and refusal before effects.
 * @evidence requirements/rendering/headless-and-platform-determinism.md#rendering-process-isolation Admits only creation-ordered descendants of the recorded current root allocation.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-headless-platform Supplies a parent-first termination plan from exact process creation observations.
 */
export function selectProcessOwnershipTree(
  snapshot: ReadonlyArray<{ pid: number; parentPid: number; createdAt: string }>,
  root: { pid: number; createdAt: string },
): Array<{ pid: number; createdAt: string }> {
  requireProcessId(root.pid);
  const byPid = new Map<number, (typeof snapshot)[number]>();
  for (const item of snapshot) {
    requireProcessId(item.pid);
    if (!/^\d+$/.test(item.createdAt) || byPid.has(item.pid))
      throw new Error("The process snapshot has an ambiguous identity");
    byPid.set(item.pid, item);
  }
  const found = byPid.get(root.pid);
  if (!found || found.createdAt !== root.createdAt)
    throw new Error("The owned process has exited or its PID was reused");
  const admitted = [{ pid: root.pid, createdAt: root.createdAt }];
  for (let index = 0; index < admitted.length; index++) {
    const parent = admitted[index];
    for (const item of snapshot)
      if (
        item.parentPid === parent.pid &&
        BigInt(item.createdAt) > BigInt(parent.createdAt)
      )
        admitted.push({ pid: item.pid, createdAt: item.createdAt });
  }
  return admitted;
}
