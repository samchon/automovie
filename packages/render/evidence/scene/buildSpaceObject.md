# src/scene/buildSpaceObject.ts#buildSpaceObject

## @evidence contracts/development/implementation.md#principled-implementation

Uses the engine's actual footprint decomposition, height-rule tessellation, +Y winding and shared smooth normals, then realizes Float32 indexed geometry; admitted metre/Y-up surfaces satisfy engine premises, and bilinear cell interiors remain planar approximations rather than exact grounding geometry.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the Three mesh and opaque or guide-only material. The engine owns tessellation, and the guide passes own material replacement.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The appearance option changes only the one mesh's material. No fixture paths, duplicate visual geometry or replacement height rules participate.

## @evidence contracts/development/common.md#meaningful-documentation

Gives structural coverage, color opt-in, footprint regions, metre/Y-up winding, degenerate omission and the heightfield interior approximation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds one mesh per nondegenerate surface and copies each emitted position/normal/index once; engine cost depends on convex pieces and touched heightfield cells, and output memory grows with tessellated vertices/triangles rather than scene raster size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine tessellation implementation but creates fresh scene-owned Three resources per build; mutable support surfaces have no immutable revision key here, so no cross-scene geometry cache is assumed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Transfers new geometries/materials to the returned group and retains no separate registry; population is bounded by this space's nondegenerate surfaces and tessellation output. No disposer or partial-build rollback is exposed here, so scene-host retirement and construction-failure cleanup remain a gap rather than guaranteed release.
