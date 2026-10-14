import { HumanViewerQueueFullError } from "./HumanViewerQueueFullError.js";
import { HumanViewerStalledError } from "./HumanViewerStalledError.js";
import { HumanViewerStartingError } from "./HumanViewerStartingError.js";

/**
 * Map recognized queue/startup/stalled-stage refusal classes to 503 and the existing retry interval; all other causes receive 422 without retry advice. This policy mapping does not prove that every 503 cause will recover or every 422 cause is permanent.
 *
 * @evidence contracts/common.md#principled-implementation Typed queue-full, starting and stalled-stage causes map to transient HTTP 503 advice; other request refusals map to 422 without retry guidance.
 * @evidence contracts/common.md#clear-and-simple-design One typed-cause mapping owns status and Retry-After policy, avoiding string matching in HTTP response adapters.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Error-message text or selected document ids cannot manufacture a transient classification; only the supported refusal classes receive retry advice.
 * @evidence contracts/common.md#meaningful-documentation The comment explains transient versus request-specific causes and seconds as the retry interval unit.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Three class checks and a fixed result record choose no collection-processing algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Classification is stateless and preserves no cached policy across distinct error instances or changing request state.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The result contains only status/interval scalars and retains no original error, request response or queue slot.
 */
export function classifyHumanViewerRefusal(error: unknown): {
  status: 422 | 503;
  retryAfter: number | null;
} {
  if (error instanceof HumanViewerQueueFullError)
    return { status: 503, retryAfter: 10 };
  if (error instanceof HumanViewerStartingError)
    return { status: 503, retryAfter: 3 };
  // A stalled stage ended its request; the same request on a fresh slot can succeed.
  if (error instanceof HumanViewerStalledError)
    return { status: 503, retryAfter: 3 };
  return { status: 422, retryAfter: null };
}
