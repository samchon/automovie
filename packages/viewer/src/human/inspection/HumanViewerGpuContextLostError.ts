/**
 * A display could not finish because its own WebGL context was lost. Native
 * context restoration can redraw the last completed model and clear this
 * display failure; a numerical or source refusal has no such recovery.
 *
 * @evidence contracts/common.md#principled-implementation A dedicated Error subclass lets page.mts distinguish an observed gl.isContextLost refusal from source or numerical failures using instanceof.
 * @evidence contracts/common.md#clear-and-simple-design Carries the graphics refusal identity only; createHumanViewerGpuDisplay and the page's redraw callback own native restoration and last-completed frame redraw.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Elapsed time or a generic build error cannot manufacture this graphics classification, and this empty subclass inherits Error's name rather than inventing a transport-name protocol.
 * @evidence contracts/common.md#meaningful-documentation States the actual WebGL context-loss cause and separate native restoration path; constructing the error neither restores a context nor proves a redraw succeeded.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Inherits Error construction and runtime stack capture; it chooses no geometry, rendering or recovery algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each observed context-loss failure remains its own error; the page decides whether restoration can reuse the last completed resident.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The message and runtime stack live while this error is referenced, without a message-length cap here; no renderer, resident or restoration task is retained by the subclass.
 */
export class HumanViewerGpuContextLostError extends Error {}
