import type { IAutoMovieCommitLockHolder } from "./IAutoMovieCommitLockHolder";

/**
 * Describe the exact holder state without claiming that an occupied PID is the recorded process generation. Age is display context in rounded seconds, never reclaim authority.
 *
 * @evidence contracts/common.md#principled-implementation The closed holder union selects an exhaustive state-specific sentence and only present validated owners contribute host/PID/age details.
 * @evidence contracts/common.md#clear-and-simple-design Owns readable holder facts while acquisition refusal owns advice, so the same survey can be described in a multi-coordinate refusal.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown owner/query reasons are shown explicitly and age never changes the ownership state or permits file removal.
 * @evidence contracts/common.md#meaningful-documentation States age units, non-authoritative display meaning and the distinction between recorded generation and current PID occupancy.
 * @evidence contracts/performance.md#efficient-algorithms Formats one holder in output-length work, driven by path and host string length, with one returned string and no population traversal.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the supplied survey record; Date.now refreshes display age but does not reread or cache process evidence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only the output sentence is returned and no descriptor, lease, state map entry or background task is retained.
 */
export const describeCommitLockHolder: (holder: IAutoMovieCommitLockHolder) => string = (
  holder: IAutoMovieCommitLockHolder,
): string => {
  if (holder.state === "unknown")
    return holder.owner === null
      ? `"${holder.path}" has no trustworthy owner observation (${holder.reason})`
      : `"${holder.path}" records process ${holder.owner.pid} on this host, but its owner state is unknown (${holder.reason})`;
  const owner: NonNullable<IAutoMovieCommitLockHolder["owner"]> = holder.owner;
  const taken: string = ` taken ${Math.max(0, Math.round((Date.now() - owner.at) / 1000))}s ago`;
  switch (holder.state) {
    case "same-owner":
      return `"${holder.path}" is held by this process generation${taken}`;
    case "occupied-or-reused":
      return `"${holder.path}" records process ${owner.pid} on this host${taken}; that id is occupied, but the process table cannot prove it is the recorded generation`;
    case "absent":
      return `"${holder.path}" is held by process ${owner.pid} on this host${taken}, and no process holds that id, so the session that took it is gone`;
    case "elsewhere":
      return `"${holder.path}" is held by process ${owner.pid} on host ${JSON.stringify(owner.host)}${taken}; this host's process table cannot say whether that session is still running`;
  }
};
