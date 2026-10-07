import { assertHumanViewerSource } from "./assertHumanViewerSource";
import { humanViewerCandidateSourceError } from "./humanViewerCandidateSourceError";

/**
 * Refuse a candidate page whose source generation the server reports as
 * failed, so a broken build never answers as ready.
 *
 * @evidence contracts/common.md#principled-implementation Readiness follows the server's own source status.
 * @evidence contracts/common.md#meaningful-documentation States the refusal.
 */
export async function checkHumanViewerCandidateSource(): Promise<void> {
  const health = (await (await fetch("/health")).json()) as Parameters<
    typeof humanViewerCandidateSourceError
  >[0];
  assertHumanViewerSource(humanViewerCandidateSourceError(health));
}
