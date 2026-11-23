# src/scene/readAutoMovieCubeShadowDepth.ts#readAutoMovieCubeShadowDepth

## @evidence contracts/development/implementation.md#principled-implementation

Requires an actual retained native render-target marker and rejects zero depth version before binding face0/mip0 to query a texture depth attachment through public WebGL APIs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Native attachment observation uses the existing framebuffer snapshot/independent restoration owner rather than SDK private texture properties.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Positive version alone is not upload proof and CPU needsUpdate can increment it; caller must supply the retained draw product in its exact live context, and absent/nontexture depth returns null.

## @evidence contracts/development/common.md#meaningful-documentation

Documents generic SDK target typing, initialization refusal, retained-context premise and target/face/mip plus raster restoration on failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed number of native binds/attachment queries and state restores avoids scene/pixel traversal, though native getParameter/query boundaries may synchronize with the driver.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each query observes the current attachment and restores one captured state; no earlier WebGLTexture handle is cached as authority for another target/context.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

No target or texture is allocated by the intended retained-product path; renderer/target remain borrowed and independently restored, while any violated initialization premise can still trigger SDK allocation on bind.
