/** The socket error codes a loaded server produces when it resets a kept-alive connection. */
const RESET_CODES = ["ECONNRESET", "UND_ERR_SOCKET", "EPIPE"];

/**
 * Run one HTTP request again when the connection was reset under it. A server
 * stalled by a long rebuild or a saturated machine closes its kept-alive
 * sockets, and the next request on such a socket fails with a reset although
 * the server is alive and the request never ran, so asking again is safe for
 * every route the viewer serves (all are idempotent reads or captures). Only a
 * reset is retried, at most `attempts` times with a growing pause; a refused
 * connection (no server) and every other failure return at once, unchanged.
 *
 * @evidence contracts/common.md#principled-implementation A reset before any response means the request did not complete, so replaying an idempotent request is sound; the attempts are bounded.
 * @evidence contracts/common.md#clear-and-simple-design One helper owns the retry for every client.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Retries one named class of socket failure, never an HTTP refusal or a missing server.
 * @evidence contracts/common.md#meaningful-documentation States why a reset is transient and the idempotence precondition.
 */
export async function retryHumanViewerFetch<T>(
  request: () => Promise<T>,
  props: { attempts: number; pause: (ms: number) => Promise<void> },
): Promise<T> {
  for (let attempt = 1; ; ++attempt) {
    try {
      return await request();
    } catch (error) {
      const code = (error as { cause?: { code?: string } }).cause?.code ?? "";
      if (attempt >= props.attempts || !RESET_CODES.includes(code)) throw error;
      await props.pause(500 * attempt);
    }
  }
}
