# src/IAutoMovieViewerHandle.ts#IAutoMovieViewerHandle

## @evidence contracts/development/design.md#principled-representation

Pairs the mount-owned renderer with original external-draw completion and complete loop/resource shutdown, allowing explicit host draws to publish actual frame time without inventing a second render owner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The handle exposes only renderer access, completion publication and lifecycle end; mountViewer retains loop timing, camera transfer and observer details.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Completion follows the original draw rather than an extra capture-only render, and guide redraws preserve the last completed clock when no new time is supplied.

## @evidence contracts/development/common.md#meaningful-documentation

Documents mount-owned renderer, external draw-completion ordering, optional playback seconds and failure-propagating cleanup categories.

# src/IAutoMovieViewerHandle.ts#IAutoMovieViewerHandle.completeFrame

## @evidence contracts/development/implementation.md#principled-implementation

Notifies observers immediately after an original external draw, using supplied actual seconds or the preserved completed clock rather than advancing playback for a guide capture.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

External producers call the mount's existing completion path so handled and ordinary frames share timing and state transfer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Publication does not replace WebGLRenderer.render or create a synthetic verification draw; the calling original producer owns completion truth.

## @evidence contracts/development/common.md#meaningful-documentation

States draw-before-publication ordering and optional time meaning for seek versus guide redraw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Completion records and synchronous subscriber delivery have cost proportional to observer work, without walking scene meshes or reading pixels in this callback.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Explicit original draws remain meaningful events even when state facts match, so completion effects are not shared blindly.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Completion publication borrows current scene and camera and starts no new renderer or animation task.

# src/IAutoMovieViewerHandle.ts#IAutoMovieViewerHandle.stop

## @evidence contracts/development/implementation.md#principled-implementation

Ends the mount's loop and delegates independent scene-shadow, compositor and renderer retirement to releaseMountedViewer, preserving cleanup causes after all owners are attempted.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One stop callback is the mount lifetime boundary; resource-specific disposal remains with the existing release helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A throwing listener cannot certify successful shutdown or authorize disposing caller-owned scene model materials.

## @evidence contracts/development/common.md#meaningful-documentation

Names the loop, shadow, compositor and renderer retirement obligations and failure propagation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Retirement scans scene shadow lights and a fixed number of renderer/compositor owners, without rebuilding or resampling scene geometry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The mount's sticky synchronous restoration guard starts stop once and preserves its original failure for repeated callers; renderer-specific compositor guards own their separate retirement outcomes.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Stops scheduling mounted work and attempts owned native release while leaving model-resource lifetime with the host; a failed retirement remains a reported uncertainty.
