# src/scene/applySceneFog.ts#applySceneFog

## @evidence contracts/development/implementation.md#principled-implementation

Realizes the declared exp(-(density*viewDepth)^2) transmittance with Three FogExp2 and linear RGB, relying on finite admitted density/color and the material's native fog chunks; null/omission clears atmosphere rather than creating a default fog.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scene-field adapter is shared by buildScene and hosts that assemble their own graph; portable fog law/admission stay in the engine/interface and guide suspension stays at applyRenderMode.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the authored linear color/density without fixture distances, image-space compensation or replacement material/global methods.

## @evidence contracts/development/common.md#meaningful-documentation

States the exponential law, linear color convention, shared producer entry and null/omission meaning without claiming unrelated frame equality.

## @evidence contracts/development/implementation.md#efficient-algorithms

Allocates one fixed-size FogExp2 value and writes three color channels, constant installation cost; native fragment fog work belongs to rendering rather than a CPU scene scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses Three's native fog implementation and the shared adapter; changed fog can replace the scalar object cheaply, with no geometry/cache rebuild or cross-scene state sharing.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Transfers one scalar/color fog object to the scene and releases its previous reference on assignment/clear; no GPU handle, observer or task is owned here.
