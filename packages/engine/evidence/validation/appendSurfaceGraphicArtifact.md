# src/validation/appendSurfaceGraphicArtifact.ts#appendSurfaceGraphicArtifact

## @evidence contracts/development/common.md#meaningful-documentation

States each emission, background and layer check, the box bounds, and that image resolution belongs to texture closure.

## @evidence contracts/development/implementation.md#principled-implementation

Checks the closed emission and layer unions, reuses validateColor for every colour, and bounds each box so every layer stays on its face; `x + width` is compared after IEEE addition, which cannot exceed 1 when the exact sum does not, because 1 is representable and rounding is monotone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One graphic's fields only; track and model context stay with the caller.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamping of an out-of-range box or luminance; each fault is reported at its own path.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the layer count.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call checks one graphic once.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Appends findings only.
