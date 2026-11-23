# src/scene/detailNormalShading/applyDetailNormal.ts#applyDetailNormal

## @evidence contracts/development/implementation.md#principled-implementation

Registers whiteout tangent-normal composition over an existing tangent-space normal map using the first UV set and the detail binding's captured transform/scale; usable UVs, finite admitted scale and nondegenerate decoded normals are premises, and this is an artistic relief blend rather than a geometric surface reconstruction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps detail-feature metadata beside one canonical shader patch and delegates ordered native hook/key installation to addMaterialShaderPatch; texture acquisition/lifetime stays with its resolver owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses actual texture/scale and the native compile extension point with no fixture normal values or replaced foreign shader method; base-normal absence is handled by buildMaterial before calling this two-map feature.

## @evidence contracts/development/common.md#meaningful-documentation

States tangent-space base-map requirement, transformed first UV, slope scale and exact whiteout formula; captured patch documents transform immutability after registration.

## @evidence contracts/development/implementation.md#efficient-algorithms

Registration copies one texture matrix and appends one patch to the material's small list; compiled shader adds one detail texture sample plus constant vector arithmetic per fragment, with source-edit work linear in shader length.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses caller-owned detail texture and the material's existing base map, with one captured matrix/uniform set per registration; changing texture transform later requires a new patch rather than silently mutating the captured uniform.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Material metadata/patch closure retain the borrowed texture and captured scale/matrix through material lifetime; this feature acquires no independent GPU texture or task, and resolver/material owners must retire their respective resources.
