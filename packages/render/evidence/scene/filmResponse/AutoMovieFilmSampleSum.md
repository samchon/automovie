# src/scene/filmResponse/AutoMovieFilmSampleSum.ts#AutoMovieFilmSampleSum

## @evidence contracts/development/design.md#principled-representation

One running sum of a second's sub-frame samples in two 32-bit float targets that ping-pong, so a sample is added by reading one and writing the other without blending, which float targets need an extension for.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The film response stage holds one and calls `add` and `dispose`; nothing else reads it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No film or host is named; the overlay rule is the stage's `toneMapped` convention.

## @evidence contracts/development/common.md#meaningful-documentation

The class comment states the per-sample render, the unit-weight sum and final scale, the depth kept, the restart at sample 0 and the target lifetime.

# src/scene/filmResponse/AutoMovieFilmSampleSum.ts#AutoMovieFilmSampleSum.prototype.add

## @evidence contracts/development/common.md#meaningful-documentation

States the caller's placement premise, the optional march hook run on each sample's linear light before it is added, the hidden overlays, the neutral curve and exposure, and what is restored.

## @evidence contracts/development/implementation.md#principled-implementation

An equal-weight box average of the samples, the estimator of the accumulation buffer (Haeberli and Akeley 1990), of associated colour and alpha alike, a linear filter that is correct on associated colour (Porter and Duff 1984), so a moving edge over a transparent clear averages to its partial coverage. Summing at unit weight and scaling once makes N equal samples average to exactly their value, so a static scene draws the same frame with and without a shutter; the average is written over the linear colour and alpha with the depth left as the last sample's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns only the sum; the stage keeps admission, targets and the response.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Renderer state and overlay masks are restored in a finally block; no sample is skipped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per sample one scene draw and one full-frame pass; one more on the last sample; one scene traversal to find overlays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Targets are reused while the raster is unchanged; sample 0 ignores the previous sum, so nothing of an earlier second is reused.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Two float targets per raster, replaced on a raster change and released by `dispose`.

# src/scene/filmResponse/AutoMovieFilmSampleSum.ts#AutoMovieFilmSampleSum.prototype.dispose

## @evidence contracts/development/common.md#meaningful-documentation

States what is released.

## @evidence contracts/development/implementation.md#principled-implementation

Disposes the sum targets, the program and the quad geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shares the release path with a raster change.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Releases every GPU object the sum created.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing is shared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

After dispose the sum holds no GPU resource; the stage calls it from its own `dispose`.
