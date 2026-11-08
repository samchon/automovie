import type { IAutoMovieArtifactPlan } from "./IAutoMovieArtifactPlan";

/**
 * Diff a run's keys against the stored keys: which artifacts must be computed
 * and which can be reused.
 *
 * A key is reused when the store already holds it or when an earlier position
 * of this same run computes it, because positions run in order and each
 * computed artifact is stored before the next position starts. Every
 * `verifyEvery`-th reuse, counted from the first, becomes `verify`: the caller
 * recomputes it and compares digests, the sampled bypass that catches a key
 * missing an input or a nondeterministic stage (Bazel's rebuild-and-compare
 * check). A second run over the keys the first run stored computes nothing.
 *
 * @param keys The run's composed keys, in execution order.
 * @param stored Keys whose entries already exist in the store.
 * @param verifyEvery Positive integer sampling period for verification; omitted verifies nothing.
 * @returns One action per key and the action counts.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Set membership over composed keys is exact; in-run repeats reuse the first computation because execution is ordered and the store write precedes the next position. Sampling by reuse ordinal is deterministic, so the same run verifies the same positions.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Pure planning is separate from storage and computation so the decision is testable without I/O; resolveAutoMovieArtifact performs each action.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No key is trusted beyond membership; content verification happens when the entry is read.
 * @evidence contracts/development/implementation.md#efficient-algorithms One pass over K keys with expected O(1) set lookups: O(K) time and O(K) space for the actions and the seen set.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The planner decides reuse for its caller and performs none itself.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing after return; the seen set dies with the call.
 * @evidence contracts/development/common.md#meaningful-documentation States reuse conditions, the sampling rule, the null-build property and argument meanings.
 */
export function planAutoMovieArtifacts(
  keys: readonly string[],
  stored: ReadonlySet<string>,
  verifyEvery?: number,
): IAutoMovieArtifactPlan {
  if (
    verifyEvery !== undefined &&
    !(Number.isSafeInteger(verifyEvery) && verifyEvery > 0)
  )
    throw new Error("verifyEvery must be a positive integer");
  const plan: IAutoMovieArtifactPlan = {
    actions: [],
    compute: 0,
    reuse: 0,
    verify: 0,
  };
  const seen: Set<string> = new Set();
  let reused: number = 0;
  for (const key of keys) {
    if (!stored.has(key) && !seen.has(key)) {
      seen.add(key);
      plan.actions.push("compute");
      ++plan.compute;
      continue;
    }

    // Sample the first reuse and every verifyEvery-th after it.
    const sampled: boolean =
      verifyEvery !== undefined && reused % verifyEvery === 0;
    ++reused;
    plan.actions.push(sampled ? "verify" : "reuse");
    if (sampled) ++plan.verify;
    else ++plan.reuse;
  }
  return plan;
}
