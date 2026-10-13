/**
 * A request that arrived before the resident page reported its renderer.
 * The server answers 503; the caller decides when to ask again. This refusal
 * establishes neither process death nor permission to replace the browser.
 *
 * @evidence contracts/common.md#principled-implementation createHumanViewerCapture uses this subtype when its current page/renderer has not become available; classifyHumanViewerRefusal returns HTTP 503 rather than calling a missing page a bad document.
 * @evidence contracts/common.md#clear-and-simple-design Separates server/page startup state from queue capacity and numerical refusal, while the host owns actual renderer and generation publication.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Readiness absence grants no authority to kill a process or replace a browser, and retry advice cannot invent a completed startup transition.
 * @evidence contracts/common.md#meaningful-documentation Names renderer/page readiness refusal and caller-owned retry decision, distinguishing it from observed process death or permission to restart.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Inherited Error allocation contains no readiness polling or process discovery; capture and host ownership implement those operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Readiness must be observed anew for later captures; this failure object is not a cached renderer receipt.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The diagnostic message/stack remain while referenced, with no message-length limit here; startup holds, browser sessions and pending capture slots are not owned by this error.
 */
export class HumanViewerStartingError extends Error {}
