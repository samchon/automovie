/**
 * Identify declared numerical refusals inside a speculative camera proposal.
 * Progress callbacks run outside these catches. Foreign errors and unexpected
 * runtime exceptions propagate so a program failure cannot become an outlier.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Only Error instances carrying the numerical owners' declared prefixes identify an inadmissible or unresolved speculative model; a TypeError, foreign exception or callback failure is not silently classified as correspondence noise.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One internal classifier keeps identical refusal handling across epipolar and homography proposal loops without changing any foreign error or function.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The helper neither catches, retries, changes severity nor fabricates a replacement matrix; unrecognized failures remain the operation owner's responsibility.
 * @evidence contracts/development/common.md#meaningful-documentation Defines the speculative-proposal boundary, declared-prefix scope and exclusion of callback/program errors.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed-prefix expression inspects a bounded prefix of one error message with constant auxiliary storage and no correspondence traversal.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Classification coordinates no shared effect or cache.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Only a boolean returns; the borrowed error is never mutated or retained.
 */
export function isRecoveryCameraNumericalRefusal(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === "Error" &&
    /^(camera-(design|essential|refinement|pose|homography):|singular-matrix:|matrix3:)/.test(
      error.message,
    )
  );
}
