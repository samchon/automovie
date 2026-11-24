# src/validation/appendSurfaceGraphicsArtifact.ts#appendSurfaceGraphicsArtifact

## @evidence contracts/development/common.md#meaningful-documentation

States the structural checks, the model-backed checks when a registry is supplied and why an articulated surface is refused.

## @evidence contracts/development/implementation.md#principled-implementation

Resolves each node to its staged model and each surface to that model's affordance, then checks kind, positive extents and `rides`, the fields render needs to place a face; key clocks follow the practical surface rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Track identity, model resolution and the key clock live here; one graphic's fields are checked by appendSurfaceGraphicArtifact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing extent or an articulated surface is refused rather than defaulted, and a structural-only call invents no registry.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in tracks, keys and layers, with one node map and one model map per call and a linear affordance lookup per track.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Validation of one authored list; nothing is cached across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends findings to the caller's collector and retains nothing.
