import { HumanViewerQueueFullError } from "./HumanViewerQueueFullError";
import { HumanViewerStalledError } from "./HumanViewerStalledError";
import { HumanViewerStartingError } from "./HumanViewerStartingError";

/**
 * The HTTP status a refused request gets, and the seconds the caller should
 * wait before asking again. A full queue and a server still starting are
 * conditions that pass, and so is a request whose stage stalled and was
 * ended, so they answer 503 with a retry interval; every other
 * refusal (an invalid address, an unknown document, a refused build, a
 * software renderer on a ready server) is the request's own and answers 422
 * with no retry advice, because asking again cannot change it.
 *
 * @evidence contracts/common.md#principled-implementation Status follows from whether the condition is transient (503) or belongs to the request (422).
 * @evidence contracts/common.md#clear-and-simple-design One pure classification serves every refusal response.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No message text is parsed; the error class decides.
 * @evidence contracts/common.md#meaningful-documentation States why transient and permanent refusals differ.
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
