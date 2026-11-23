import type { IAutoMovieArtifactPlan } from "@automovie/interface";

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
 * @param verifyEvery Positive integer sampling period for verification; omitted
 *   verifies nothing.
 * @returns One action per key and the action counts.
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
