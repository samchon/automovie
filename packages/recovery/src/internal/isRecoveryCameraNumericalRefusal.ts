/**
 * Identify declared numerical refusals inside a speculative camera proposal.
 * Progress callbacks run outside these catches. Foreign errors and unexpected
 * runtime exceptions propagate so a program failure cannot become an outlier.
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
