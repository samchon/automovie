import { isAutoMovieLocalProcessOwner } from "./isAutoMovieLocalProcessOwner";
import type { IAutoMovieCommitLockOwner } from "./IAutoMovieCommitLockOwner";
import { projectCommitLockOwnerPrefix } from "./projectCommitLockOwnerPrefix";

/**
 * Parse a prefixed JSON lock token only when shared host/PID/generation validation and nonnegative safe epoch-millisecond validation succeed. Foreign or malformed tokens return null.
 *
 * @evidence contracts/common.md#principled-implementation An anchored protocol prefix separates the JSON payload, and the shared local-process owner predicate validates identity fields before a safe nonnegative timestamp is admitted.
 * @evidence contracts/common.md#clear-and-simple-design Owns token decoding while process observation remains separate; nonce is intentionally irrelevant to liveness and remains part of exact token equality elsewhere.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed JSON, invalid owner fields and unsupported prefixes refuse without inferring a dead process from an unreadable token.
 * @evidence contracts/common.md#meaningful-documentation Documents protocol spelling, timestamp admission and null refusal, including that parsing does not establish current liveness.
 * @evidence contracts/performance.md#efficient-algorithms JSON parsing and prefix slicing follow T token characters and temporary parsed-payload size; no token-length cap is imposed here.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the shared process-owner shape predicate; parsing is repeated per current token survey because token equality is an ownership boundary.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only validated scalar owner fields escape, discarding extra payload fields; this parser owns no descriptor, lock or running task.
 */
export const projectCommitLockReadCommitLockOwner: (token: string) => IAutoMovieCommitLockOwner | null = (
  token: string,
): IAutoMovieCommitLockOwner | null => {
  if (token.startsWith(projectCommitLockOwnerPrefix) === false) return null;
  try {
    const value: unknown = JSON.parse(token.slice(projectCommitLockOwnerPrefix.length));
    if (typeof value !== "object" || value === null) return null;
    const { host, pid, generation, at }: Record<string, unknown> = value as Record<string, unknown>;
    if (typeof at !== "number" || Number.isSafeInteger(at) === false || at < 0)
      return null;
    const owner: { host: unknown; pid: unknown; generation: unknown; } = { host, pid, generation };
    if (isAutoMovieLocalProcessOwner(owner) === false) return null;
    return { ...owner, at };
  } catch {
    return null;
  }
};
