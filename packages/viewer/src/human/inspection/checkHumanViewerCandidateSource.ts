import { assertHumanViewerSource } from "./assertHumanViewerSource.js";
import { humanViewerCandidateSourceError } from "./humanViewerCandidateSourceError.js";

/**
 * Refuse a candidate page whose source generation the server reports as
 * failed, so a broken build never answers as ready.
 *
 * @evidence contracts/common.md#principled-implementation Readiness follows the server's own source status.
 * @evidence contracts/common.md#meaningful-documentation States the refusal.
 * @evidence contracts/common.md#clear-and-simple-design One health read delegates compilation-status selection and typed refusal to their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The server's explicit compilation report determines admission; retained old display diagnostics and timing cannot manufacture readiness.
 */
export async function checkHumanViewerCandidateSource(): Promise<void> {
  const health = (await (await fetch("/health")).json()) as Parameters<
    typeof humanViewerCandidateSourceError
  >[0];
  assertHumanViewerSource(humanViewerCandidateSourceError(health));
}
