# src/index.ts#captureAutoMovieFramebufferRestore

## @evidence contracts/development/implementation.md#principled-implementation

Captures native target/cube-face/mip plus logical viewport/scissor/test and current framebuffer rectangles, then restores through public setters/bind with a temporary target rectangle handoff; renderer/context must still be alive and supported native state APIs must describe the same draw target, with default-framebuffer state relying on native null-bind behavior.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns one reversible framebuffer snapshot separate from pass materials; temporary target field mutation exists only because native setRenderTarget consumes that target's authored raster state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses queried actual framebuffer rectangles instead of fixture canvas dimensions or renderer-internal replacements; target's original fields are independently restored even when rebinding throws, preserving the original cause.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes logical versus effective physical rectangles, target handoff and independent restoration after native operations rather than claiming a target-only snapshot is complete.

## @evidence contracts/development/implementation.md#efficient-algorithms

Performs fixed-count native state reads/vector copies and fixed restore operations, constant coordinator storage; WebGL getParameter may synchronize with the driver and is a snapshot boundary cost rather than per-pixel work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned closer reuses one captured state for its owner scope; each actual snapshot requires fresh target/rectangle observations and repeated restore is not memoized by this primitive.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds borrowed renderer/target plus four-vector/scalar snapshot state through closer lifetime and acquires no render target itself; target/renderer owners must keep resources alive until restore and then release the closer.
