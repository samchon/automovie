/**
 * Trials for an all-inlier, unique-index sample under the ideal independent
 * uniform-trial RANSAC model. Within a trial, sampling is without replacement;
 * across trials, a subset may recur. Deterministic pseudorandom proposals do not
 * turn this conditional stopping calculation into a probability of pose truth.
 *
 * @evidence contracts/common.md#principled-implementation The exact finite-population success product over (inliers-j)/(population-j) accounts for distinct draws, and log1p computes ceil(log(1-confidence)/log(1-success)) without subtractive cancellation. An impossible or unrepresentably rare sample requires infinitely many trials.
 * @evidence contracts/common.md#clear-and-simple-design One scalar stopping calculation serves epipolar support and a separately specified forbidden homography overlap, keeping their populations explicit.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The optimistic fraction-to-sample-power approximation is not used for small populations; impossible sampling is not capped to the caller's budget or labelled confident.
 * @evidence contracts/common.md#meaningful-documentation States unique within-trial samples, repeated across-trial subsets, ideal-model assumptions, Infinity meaning and separation from physical correctness.
 * @evidence contracts/performance.md#efficient-algorithms A sample of s indices requires O(s) scalar work and constant storage; no combinations or factorials are enumerated.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The pure arithmetic owns no proposal stream or cross-call cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Only a scalar escapes and no borrowed collection, task or handle is retained.
 */
export function requiredRecoveryCameraTrials(
  population: number,
  inliers: number,
  sampleSize: number,
  confidence: number,
): number {
  if (![population, inliers, sampleSize].every(Number.isSafeInteger) ||
    population < 0 || inliers < 0 || inliers > population || sampleSize < 1 ||
    !Number.isFinite(confidence) || !(confidence > 0 && confidence < 1))
    throw new Error("camera-sampling: finite counts and confidence required");
  if (population < sampleSize || inliers < sampleSize) return Infinity;
  let success: number = 1;
  for (let at: number = 0; at < sampleSize; at++) success *= (inliers - at) / (population - at);
  if (success === 1) return 1;
  if (!(success > 0)) return Infinity;
  const required: number = Math.ceil(Math.log1p(-confidence) / Math.log1p(-success));
  return Number.isSafeInteger(required) && required > 0 ? required : Infinity;
}
