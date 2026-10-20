import { seededValue } from "@automovie/engine/math/seededValue";

/**
 * Draw a reproducible ordered subset without replacement for one proposal.
 * The declared seed, distinct model domain and trial number identify every
 * sample independently of previous invocations. Sampling models the entire
 * tentative-match population, with no location, object or expected-pose prior.
 *
 * @evidence contracts/common.md#principled-implementation A partial Fisher-Yates shuffle chooses each remaining index once using the engine's deterministic half-open pseudorandom sample. Finite32-bit output has discrete sampling bias and provides reproducibility rather than a cryptographic or exact continuous-random guarantee.
 * @evidence contracts/common.md#clear-and-simple-design Model-domain and trial arguments keep homography and epipolar proposal streams distinct without a mutable global generator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No ambient entropy, preferred feature, retry-until-unique loop or measured pose changes the sample; malformed populations refuse before allocation.
 * @evidence contracts/common.md#meaningful-documentation Gives subset uniqueness, deterministic identity, full-population premise and finite-generator limitation.
 * @evidence contracts/performance.md#efficient-algorithms For population N and sample s, filling one index array costs O(N), and s swaps cost O(s); finite admitted feature populations bound this small RANSAC workload without rejection-loop tails.
 * @evidence contracts/performance.md#reuse-equivalent-work Only the requested prefix is shuffled; each proposal's explicit identity recreates the same subset without retaining earlier streams.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call owns one N-index array and returns an s-index copy; no feature, image, stateful generator or external handle remains.
 */
export function sampleRecoveryCameraIndices(
  population: number,
  sampleSize: number,
  seed: number,
  domain: number,
  trial: number,
): number[] {
  if (![population, sampleSize, seed, domain, trial].every(Number.isSafeInteger) ||
    population < sampleSize || sampleSize < 1 || seed < 0 || seed > 0xffffffff || trial < 0)
    throw new Error("camera-sampling: admitted finite sample identity required");
  const indices: number[] = Array.from({ length: population }, (_: unknown, at: number): number => at);
  for (let at: number = 0; at < sampleSize; at++) {
    const selected: number = at + Math.floor(seededValue(seed, domain, trial, at) * (population - at));
    const previous: number = indices[at]!;
    indices[at] = indices[selected]!;
    indices[selected] = previous;
  }
  return indices.slice(0, sampleSize);
}
