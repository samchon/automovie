import { assertHumanViewerSource } from "./assertHumanViewerSource.js";
import { humanViewerCandidateSourceError } from "./humanViewerCandidateSourceError.js";

/**
 * Refuse a candidate page whose source generation the server reports as
 * failed, so a broken build never answers as ready.
 */
export async function checkHumanViewerCandidateSource(): Promise<void> {
  const health = (await (await fetch("/health")).json()) as Parameters<
    typeof humanViewerCandidateSourceError
  >[0];
  assertHumanViewerSource(humanViewerCandidateSourceError(health));
}
