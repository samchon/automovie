import { assertHumanViewerSource } from "./assertHumanViewerSource.js";
import { humanViewerCandidateSourceError } from "./humanViewerCandidateSourceError.js";

/**
 * Refuse a candidate page whose source generation the server reports as failed, so a broken build never answers as ready. A failed health request or incompatible authority envelope also refuses.
 *
 * @evidence contracts/common.md#principled-implementation Candidate publication fetches current health, requires HTTP success and delegates envelope validation/source-cause selection before the shared source assertion.
 * @evidence contracts/common.md#clear-and-simple-design Transport success, source-authority selection and compilation refusal have separate existing owners rather than nested fallback heuristics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Non-success HTTP status and malformed health cannot become null source-error authority, while retained-display failures remain separate from compilation.
 * @evidence contracts/common.md#meaningful-documentation Documentation names server-source refusal plus transport and incompatible-envelope failures before candidate readiness.
 * @evidence contracts/performance.md#efficient-algorithms One HTTP fetch and JSON parse cost O(B) in health response bytes, followed by fixed-size authority-field checks without polling.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Health reflects mutable current compilation state; this publication check owns no versioned cache suitable for reusing another candidate's answer.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The request consumes response JSON and retains no response stream, candidate hold or parsed health after completion or refusal.
 */
export async function checkHumanViewerCandidateSource(): Promise<void> {
  const response: Response = await fetch("/health");
  if (!response.ok)
    throw new Error(
      `Candidate source health request failed (${response.status})`,
    );
  const health: unknown = await response.json();
  assertHumanViewerSource(humanViewerCandidateSourceError(health));
}
