import { requireProcessId } from "./requireProcessId.ts";

/**
 * Admit a creation-ordered process tree from immutable OS observations. Parent
 * IDs survive their old process allocation, so an edge is usable only when the
 * current parent was created strictly before its child. Decimal stamps use
 * BigInt to preserve adjacent microseconds beyond Number's exact integer range.
 * The result contains owned records in parent-first order. A missing or reused
 * root and ambiguous snapshot refuse before any native handle is terminated.
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
