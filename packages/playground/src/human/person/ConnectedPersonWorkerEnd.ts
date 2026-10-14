/**
 * The part of a browser worker a numerical transport uses. The shared person worker hands each transport an object of this shape, so the existing transports stay unaware that they share one worker.
 *
 * These native-shaped ends share one physical connection. Terminating either end retires the worker for both and reports retirement to its peer through an error callback; the next transport acquisition opens a new shared worker.
 *
 * @evidence contracts/common.md#principled-implementation Native message/error/send/terminate members preserve the existing transport seam while the worker-share owner routes two protocols over one physical worker and propagates either end's retirement to its peer.
 * @evidence contracts/common.md#clear-and-simple-design The type exposes the browser surface already required by numerical transports without embedding sharing or dispatch policy in each consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A logical worker end is not independent physical ownership; shared retirement is explicit peer failure rather than silently leaving the other transport waiting.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies native shape, shared physical lifetime, either-end retirement, peer error notification and fresh worker acquisition.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This native-surface projection implements no reply routing or request correlation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Worker sharing is implemented by the worker-share owner rather than this structural type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The type acquires no browser worker itself; shared connection registration and final physical termination remain implementation-owned.
 *
 * @author Samchon
 */
export type ConnectedPersonWorkerEnd = Pick<
  Worker,
  "onmessage" | "onerror" | "onmessageerror" | "postMessage" | "terminate"
>;
