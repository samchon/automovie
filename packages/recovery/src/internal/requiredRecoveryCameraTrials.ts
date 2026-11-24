/**
 * Trials for an all-inlier, unique-index sample under the ideal independent
 * uniform-trial RANSAC model. Within a trial, sampling is without replacement;
 * across trials, a subset may recur. Deterministic pseudorandom proposals do
 * not turn this conditional stopping calculation into a probability of pose
 * truth.
 */
export function requiredRecoveryCameraTrials(
  population: number,
  inliers: number,
  sampleSize: number,
  confidence: number,
): number {
  if (
    population < 0 ||
    inliers < 0 ||
    inliers > population ||
    sampleSize < 1 ||
    !(confidence > 0 && confidence < 1)
  )
    throw new Error("camera-sampling: finite counts and confidence required");
  if (population < sampleSize || inliers < sampleSize) return Infinity;
  let success: number = 1;
  for (let at: number = 0; at < sampleSize; at++)
    success *= (inliers - at) / (population - at);
  if (success === 1) return 1;
  if (!(success > 0)) return Infinity;
  const required: number = Math.ceil(
    Math.log1p(-confidence) / Math.log1p(-success),
  );
  return required > 0 && required <= Number.MAX_SAFE_INTEGER
    ? required
    : Infinity;
}
