# src/scene/createFormationCycleShadowMaterials.ts#createFormationCycleShadowMaterials

## @evidence contracts/development/implementation.md#principled-implementation

Creates native depth/distance materials with the same baked cycle injection and palette-identity program keys, marking update after Three copies per-draw alpha/side/clipping/displacement features; caller palette identity must be a member of the captured table and the pinned native custom-shadow upload behavior is the compatibility premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One tier owns the two shadow projections and a local original-palette ordinal table; beforeDraw chooses key identity while mesh binding and native dispatch supply actual palette/material inputs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses actual material object identity and supported compile/update hooks rather than a fixture ordinal or replaced shadow renderer; structural overrides borrow the original palette identity rather than creating new program ids.

## @evidence contracts/development/common.md#meaningful-documentation

Explains native custom-shadow cache behavior, per-palette key/update boundary, shared cycle cells and repeated/structural palette identity behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Deduplicates M palette references into one ordinal map, creates two materials and performs constant lookup/key selection per shadow draw; shader vertex costs remain the cycle sampler's actual texture/matrix work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeated palette references share one ordinal and all chunk borrowers share the pair/cycle uniforms; local ordinals allow compatible program structure reuse across tiers while native material uniforms remain independently owned.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Construction registers depth/distance immediately and rolls both back on setup refusal; returned tier handle owns their independent disposal and borrows cycle textures/palette references. Its dispose is not memoized itself, so the formation lifetime owner must issue it once and retain any failed completion.
