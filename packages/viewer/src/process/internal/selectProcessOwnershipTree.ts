import { requireProcessId } from "./requireProcessId.ts";

/**
 * Admit a creation-ordered process tree from immutable OS observations. Parent IDs survive their old process allocation, so an edge is usable only when the current parent was created strictly before its child. Decimal stamps use BigInt to preserve adjacent microseconds beyond Number's exact integer range. The result contains owned records in parent-first order. A missing or reused root and ambiguous snapshot refuse before any native handle is terminated.
 *
 * @evidence contracts/common.md#principled-implementation Validates unique positive pid records and unsigned decimal births, indexes children in snapshot order and admits only strictly newer descendants of an exact current root, preserving parent-first breadth traversal.
 * @evidence contracts/common.md#clear-and-simple-design Pure snapshot admission stays outside discovery and termination; by-pid and parent-child indexes preserve identity checks and output ordering without changing the host API.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing/reused roots and ambiguous records refuse before a plan escapes; strict birth increases prevent ancestry cycles, and stale parent pid links or later unseen children do not create authority.
 * @evidence contracts/common.md#meaningful-documentation Documents immutable native-observation premise, exact BigInt text semantics, root refusal and parent-first ordering without claiming a namespace lock.
 * @evidence contracts/performance.md#efficient-algorithms P records are indexed and decimal births interpreted once, then admitted-parent buckets are visited, O(P+T) record work plus decimal parse/comparison cost; this removes the prior whole-snapshot scan for every parent.
 * @evidence contracts/performance.md#reuse-equivalent-work One immutable call-local snapshot supplies all ancestry comparisons; no tree or creation result is cached across native observations.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Indexes and the admitted queue retain O(P+T) borrowed record references only during the call; returned pid/birth records are copies with no handle or termination effect.
 */
export function selectProcessOwnershipTree(
  snapshot: ReadonlyArray<{ pid: number; parentPid: number; createdAt: string }>,
  root: { pid: number; createdAt: string },
): Array<{ pid: number; createdAt: string }> {
  requireProcessId(root.pid);
  const byPid: Map<number, { record: (typeof snapshot)[number]; createdAt: bigint }> = new Map();
  const children: Map<number, { record: (typeof snapshot)[number]; createdAt: bigint }[]> = new Map();
  for (const item of snapshot) {
    requireProcessId(item.pid);
    if (!/^\d+$/.test(item.createdAt) || byPid.has(item.pid))
      throw new Error("The process snapshot has an ambiguous identity");
    const observed: { record: (typeof snapshot)[number]; createdAt: bigint } = {
      record: item, createdAt: BigInt(item.createdAt),
    };
    byPid.set(item.pid, observed);
    const siblings: { record: (typeof snapshot)[number]; createdAt: bigint }[] = children.get(item.parentPid) ?? [];
    siblings.push(observed);
    children.set(item.parentPid, siblings);
  }
  const found: { record: (typeof snapshot)[number]; createdAt: bigint } | undefined = byPid.get(root.pid);
  if (!found || found.record.createdAt !== root.createdAt)
    throw new Error("The owned process has exited or its PID was reused");
  const admitted: { record: (typeof snapshot)[number]; createdAt: bigint }[] = [found];
  for (let index: number = 0; index < admitted.length; index++) {
    const parent: { record: (typeof snapshot)[number]; createdAt: bigint } = admitted[index]!;
    for (const item of children.get(parent.record.pid) ?? [])
      if (item.createdAt > parent.createdAt) admitted.push(item);
  }
  return admitted.map((item: { record: (typeof snapshot)[number]; createdAt: bigint }): { pid: number; createdAt: string } => ({
    pid: item.record.pid, createdAt: item.record.createdAt,
  }));
}
