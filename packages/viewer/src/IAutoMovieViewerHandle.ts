import type * as THREE from "three";

/**
 * Handle returned by {@link mountViewer}; call `stop()` to end the loop and
 * release the renderer, including any dissolve GPU state the frames created.
 *
 * @evidence contracts/common.md#principled-implementation Pairs the mount-owned renderer with original external-draw completion and complete loop/resource shutdown, allowing explicit host draws to publish actual frame time without inventing a second render owner.
 * @evidence contracts/common.md#clear-and-simple-design The handle exposes only renderer access, completion publication and lifecycle end; mountViewer retains loop timing, camera transfer and observer details.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Completion follows the original draw rather than an extra capture-only render, and guide redraws preserve the last completed clock when no new time is supplied.
 * @evidence contracts/common.md#meaningful-documentation Documents mount-owned renderer, external draw-completion ordering, optional playback seconds and failure-propagating cleanup categories.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This handle performs no animation-loop or compositor algorithm itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Loop and close deduplication are implemented by the mount owner rather than this erased interface.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The mount owns renderer and compositor lifetimes represented by this handle; stop is their explicit release boundary.
 *
 * @author Samchon
 */
export interface IAutoMovieViewerHandle {
  /**
   * Renderer allocated by this mount and shared with the host's explicit draws.
   */
  renderer: THREE.WebGLRenderer;

  /**
   * Publish immediately after this handle's original external draw completes.
   * Optional seconds are that draw's actual playback time; a guide redraw
   * preserves the completed clock when no new time is supplied.
   *
   * @evidence contracts/common.md#principled-implementation Notifies observers immediately after an original external draw, using supplied actual seconds or the preserved completed clock rather than advancing playback for a guide capture.
   * @evidence contracts/common.md#clear-and-simple-design External producers call the mount's existing completion path so handled and ordinary frames share timing and state transfer.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Publication does not replace WebGLRenderer.render or create a synthetic verification draw; the calling original producer owns completion truth.
   * @evidence contracts/common.md#meaningful-documentation States draw-before-publication ordering and optional time meaning for seek versus guide redraw.
   * @evidence contracts/performance.md#efficient-algorithms Completion records and synchronous subscriber delivery have cost proportional to observer work, without walking scene meshes or reading pixels in this callback.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Explicit original draws remain meaningful events even when state facts match, so completion effects are not shared blindly.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Completion publication borrows current scene and camera and starts no new renderer or animation task.
   */
  completeFrame: (elapsedSeconds?: number) => void;

  /**
   * Stop the mounted loop and attempt each owned shadow, compositor and renderer retirement; cleanup failures propagate.
   *
   * @evidence contracts/common.md#principled-implementation Ends the mount's loop and delegates independent scene-shadow, compositor and renderer retirement to releaseMountedViewer, preserving cleanup causes after all owners are attempted.
   * @evidence contracts/common.md#clear-and-simple-design One stop callback is the mount lifetime boundary; resource-specific disposal remains with the existing release helpers.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A throwing listener cannot certify successful shutdown or authorize disposing caller-owned scene model materials.
   * @evidence contracts/common.md#meaningful-documentation Names the loop, shadow, compositor and renderer retirement obligations and failure propagation.
   * @evidence contracts/performance.md#efficient-algorithms Retirement scans scene shadow lights and a fixed number of renderer/compositor owners, without rebuilding or resampling scene geometry.
   * @evidence contracts/performance.md#reuse-equivalent-work The mount's sticky synchronous restoration guard starts stop once and preserves its original failure for repeated callers; renderer-specific compositor guards own their separate retirement outcomes.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Stops scheduling mounted work and attempts owned native release while leaving model-resource lifetime with the host; a failed retirement remains a reported uncertainty.
   */
  stop: () => void;
}
