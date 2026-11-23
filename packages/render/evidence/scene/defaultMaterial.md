# src/scene/defaultMaterial.ts#defaultMaterial

## @evidence contracts/development/implementation.md#principled-implementation

Uses native MeshStandardMaterial with linear RGB0.8, zero metallic and roughness0.9 as the explicit ordinary default when a model supplies no resolved material; values describe a viewer fallback, not a measured physical finish.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One small material producer keeps the ordinary default consistent across generated parts without introducing a global mutable material shared across unrelated owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Default coefficients are a documented supported omission policy, not fixture colors or an exception to material-library identity admission; no global or native material method is replaced.

## @evidence contracts/development/common.md#meaningful-documentation

Gives linear gray/dielectric roughness intent, caller material ownership and the absence of decoded/shader-table resources.

## @evidence contracts/development/implementation.md#efficient-algorithms

Allocates one native material and one color with fixed-count scalar fields, constant CPU/storage independent of source geometry or raster size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the default definition while returning independent material instances because per-part flags and disposal ownership may differ; model-level caching remains with the model builder.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Transfers the new material to its caller for owned disposal and retains no registry, texture, renderer or task after return.
