import { inspectCommitLock } from "./inspectCommitLock";
import { describeCommitLockHolder } from "./describeCommitLockHolder";
import { projectCommitLockCommitLockAdvice } from "./projectCommitLockCommitLockAdvice";

/**
 * Create a refusal naming the currently observed holder and state-specific operator advice, or explicitly state that an unreadable contested path has no known holder.
 *
 * @evidence contracts/common.md#principled-implementation A fresh public inspection supplies the holder union, and the advice record covers every closed owner state without replacing its evidence with age.
 * @evidence contracts/common.md#clear-and-simple-design Owns the contention refusal after acquisition's deadline; holder description and current survey remain separate reusable owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An unreadable holder is described as unknown rather than invented alive/dead, and the error does not itself reclaim or delete a lock.
 * @evidence contracts/common.md#meaningful-documentation Explains the current holder, the fallback for missing evidence and the state-dependent correction the reader can act on.
 * @evidence contracts/performance.md#efficient-algorithms One survey plus output-sized message construction drives cost; process-query latency and token-byte parsing remain with their providers.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses shared description and fixed advice mapping, but current holder evidence is refreshed because the deadline can outlive a previous survey.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one Error retaining its message; no lock or descriptor is acquired, and native inspection handles remain scoped to the reader.
 */
export const projectCommitLockContendedCommitLockError: (lockPath: string) => Error = (lockPath: string): Error => {
  const holder: ReturnType<typeof inspectCommitLock> = inspectCommitLock(lockPath);
  if (holder === null)
    return new Error(
      `the project commit lock at "${lockPath}" could not be taken and could not be read, so who holds it is unknown; retry shortly`,
    );
  return new Error(
    `the project commit lock is held by another session: ${describeCommitLockHolder(holder)}; ${projectCommitLockCommitLockAdvice[holder.state]}`,
  );
};
