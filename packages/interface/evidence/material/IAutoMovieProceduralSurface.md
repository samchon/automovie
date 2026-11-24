# src/material/IAutoMovieProceduralSurface.ts#IAutoMovieProceduralSurface

## @evidence contracts/development/design.md#principled-representation

A seeded solid texture stated by its generator kind, an unsigned 32-bit seed, a feature size in metres, linear colour and roughness pairs at pattern values zero and one, and a bump height in metres. The kind is a closed union; the axis is a direction in the sampling space. The seed range, the positive scale, the roughness interval, the nonnegative relief and the rule that only directional kinds carry an axis remain for `validateMaterialProcedural`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

`interface` owns it as the `procedural` field of `IAutoMovieMaterial`. The engine admits it and samples it on the CPU (`sampleAutoMovieProceduralSurface`), and render's `applyProceduralSurface` evaluates it per fragment. `piece` exists because a #1857 pattern piece samples a sheet, not object space, and the sheet kind decides whether pieces continue or differ.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No field names a scene or a production. The axis is optional in the type because three kinds have none; the admission refuses it on those kinds and requires it on the others, which a union per kind would also express at the cost of six near-identical records.

## @evidence contracts/development/common.md#meaningful-documentation

States each kind's generator with its citation, the meaning of scale per kind, the interpolation by the pattern value, the height in metres, both sampling spaces, the fabric weft rule, the hash that keeps CPU and GPU equal and the admission owner.

# src/material/IAutoMovieProceduralSurface.ts#IAutoMovieProceduralSurface.IPiece

## @evidence contracts/development/design.md#principled-representation

The piece's sheet kind, the metres per sheet turn and the occurrence transform `autoMoviePatternTextureTransforms` returns, so the sample point is in sheet metres with the normal offset as third coordinate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

It reuses `IAutoMoviePatternTextureTransform` and the sheet kind names of `IAutoMoviePatternTextureSheet` from their owner; the renderer and the CPU reference read every member.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No per-piece random offset is stored: a `module` piece derives it from the seed and the occurrence id, and a `face` piece has none, so renaming a face occurrence cannot change it.

## @evidence contracts/development/common.md#meaningful-documentation

States the sheet-space mapping, the normal offset, the UV0 requirement and how each sheet kind treats the occurrence id.
