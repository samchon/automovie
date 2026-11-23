# src/scene/renderCrossDissolveFrames.ts#renderCrossDissolveFrames

## @evidence contracts/development/implementation.md#principled-implementation

Rejects nonfinite/out-of-range alpha before effects, acquires or resizes the actual renderer-keyed compositor and combines two original display-frame callbacks with complementary byte weights.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Small renderer-lifetime dispatch stays separate from source tone/exposure callbacks and compositor destination/state ownership.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Documented opaque highp Float32 byte tolerance is not unobserved device-precision proof; low-alpha premultiplied canvas output is presentation, and failed terminal owner cannot be silently reused or replaced.

## @evidence contracts/development/common.md#meaningful-documentation

Documents destination/clear survival, source-local tone, rounding/endpoint identity and straight transparent delivery through an unassociated target.

## @evidence contracts/development/implementation.md#efficient-algorithms

Dispatch/size lookup is fixed while composition performs actual source draws/copies and per-pixel mix; unchanged extents reuse existing storage and resized extents delegate retirement to the owner.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One WeakMap owner per renderer reuses equivalent live display-copy extent, but every requested source frame executes its original callback and terminal failed owners retain their outcome.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

At most one active dissolve owner per renderer retains three copy extents plus native compositor resources; disposal owner removes only successful lifetimes and failed retained extents remain reported until the renderer key becomes unreachable.
