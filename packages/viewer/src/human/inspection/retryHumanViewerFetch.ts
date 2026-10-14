/** The socket error codes a loaded server produces when it resets a kept-alive connection. */
const RESET_CODES: readonly string[] = ["ECONNRESET", "UND_ERR_SOCKET", "EPIPE"];

/**
 * Repeat the capture caller's HTTP request for supported connection-reset failures, up to its explicit attempt limit with a growing pause. The caller supplies a finite positive integer limit; the current capture command supplies three. This helper does not admit the limit at runtime. A reset does not prove the server never ran the request, so the caller must allow repeated read/capture effects. Refused connections and unrelated errors propagate unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Repeats fetch only for the existing connection-reset code set read through the bounded safe cause-chain decoder, with the existing attempt limit and delay.
 * @evidence contracts/common.md#clear-and-simple-design Transport retry classification is shared with error-code ownership while request execution and response interpretation stay with the caller.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null or unprintable thrown values do not mask their original failure through unsafe cause property access, and nonreset refusals are not retried.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies reset-only retry, bounded attempts and original unrelated failure propagation.
 * @evidence contracts/performance.md#efficient-algorithms Each attempt performs one request and bounded eight-node cause inspection; a finite positive integer attempt limit bounds sequential operations and delay tasks. NaN or Infinity would not provide that bound, and an individual request has no timeout supplied by this helper.
 * @evidence contracts/performance.md#reuse-equivalent-work A reset initiates a new transport attempt; responses are not memoized because equal URLs do not establish equivalent server source state.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The call awaits its retry delay and fetch attempts; response-body/transport lifetime remains with fetch and the consuming caller.
 */
export async function retryHumanViewerFetch<T>(
  request: () => Promise<T>,
  props: { attempts: number; pause: (ms: number) => Promise<void> },
): Promise<T> {
  for (let attempt: number = 1; ; ++attempt) {
    try {
      return await request();
    } catch (error) {
      const code: string = humanViewerErrorCode(error) ?? "";
      if (attempt >= props.attempts || !RESET_CODES.includes(code)) throw error;
      await props.pause(500 * attempt);
    }
  }
}
import { humanViewerErrorCode } from "./humanViewerErrorCode.js";
