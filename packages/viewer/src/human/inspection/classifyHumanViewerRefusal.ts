import { HumanViewerQueueFullError } from "./HumanViewerQueueFullError.js";
import { HumanViewerStalledError } from "./HumanViewerStalledError.js";
import { HumanViewerStartingError } from "./HumanViewerStartingError.js";

/**
 * The HTTP status a refused request gets, and the seconds the caller should
 * wait before asking again. A full queue and a server still starting are
 * conditions that pass, and so is a request whose stage stalled and was
 * ended, so they answer 503 with a retry interval; every other
 * refusal (an invalid address, an unknown document, a refused build, a
 * software renderer on a ready server) is the request's own and answers 422
 * with no retry advice, because asking again cannot change it.
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
