# src/scene/subsurfaceShading/subsurfacePhysicalChunk.ts#subsurfacePhysicalChunk

## @evidence contracts/development/implementation.md#principled-implementation

Exact supported-chunk recognition precedes insertion of radius/table uniforms and texel-centered coordinates from the shared grid; shader radius*curvature/pi is clamped to the tabulated blur domain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure compatibility boundary keeps SDK source input separate from the material registration and shared numerical lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The declared native target line is a compatibility contract, not an expected image answer; duplicate targets and semantic changes elsewhere in a supplied chunk are not exhaustively validated.

## @evidence contracts/development/common.md#meaningful-documentation

Documents exact-target refusal, preserved surrounding source and single-occurrence compatibility limit.

## @evidence contracts/development/implementation.md#efficient-algorithms

One target scan and replacement plus fixed prefix are O(chunk length); no GPU allocation or shader compilation occurs here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Grid dimensions and target text are shared constants; each supplied chunk produces fresh output without caching mutable shader edits.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns returned source; this function retains no program, texture, renderer or background task.
