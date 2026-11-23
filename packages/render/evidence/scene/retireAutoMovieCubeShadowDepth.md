# src/scene/retireAutoMovieCubeShadowDepth.ts#retireAutoMovieCubeShadowDepth

## @evidence contracts/development/implementation.md#principled-implementation

Captures current public framebuffer/raster state, deletes the still-live owned native cube depth handle only if isTexture confirms it and independently resets SDK binding state then restores the caller snapshot.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Supplemental native cube depth cleanup stays separate from target/Texture public disposal and uses the shared framebuffer restoration policy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only an owned exact-context handle from a retained draw is admissible; a native handle already deleted needs no second delete and public API completion is not independent GPU/kernel release proof.

## @evidence contracts/development/common.md#meaningful-documentation

Documents installed-r186 cube cache distinction, still-live check, resetState reconciliation and caller target/face/mip restoration.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed native lifetime/delete/reset/state-restoration calls use constant coordinator storage without scene or depth-pixel scanning.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

isTexture avoids repeating a completed native delete in this call; each actual handle/state snapshot is observed anew and not reused across contexts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no target or texture, independently attempts delete/reset/restore and leaves renderer/caller destination borrowed; the owning shadow/context boundary retains any failed release uncertainty.
