# src/scene/semanticMask/IAutoMovieSemanticMaskHandle.ts#IAutoMovieSemanticMaskHandle

## @evidence contracts/development/design.md#principled-representation

Reports mapper mesh classification counts and unresolved drawable root ids while retaining one owned reversible pass restoration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Coverage metadata and its restore owner travel together without claiming a renderer submission or pixel readback.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Hidden/frustum-culled meshes are still counted in the scene graph and an empty unresolved list proves root membership only; failed restore stays observable and not retried as a successful no-op.

## @evidence contracts/development/common.md#meaningful-documentation

Documents mesh-count units, unclaimed background, unresolved root order and synchronous one-attempt restoration plus native attribute-lifetime limits.

# src/scene/semanticMask/IAutoMovieSemanticMaskHandle.ts#IAutoMovieSemanticMaskHandle.restore

## @evidence contracts/development/implementation.md#principled-implementation

Independently attempts original material/color/scene restoration and distinct created-material retirement under one sticky synchronous guard.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The handle exposes one teardown responsibility while mapper collections own the complete restoration population.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A failed listener cannot skip neighboring owners and repeated failure preserves its original cause; public disposal is not physical GPU release proof.

## @evidence contracts/development/common.md#meaningful-documentation

Documents complete supported state withdrawal, one attempt and uncertainty of temporary external-host instance-color native storage.

## @evidence contracts/development/implementation.md#efficient-algorithms

Restoration cost scales with swapped meshes, copied color components, created materials and hidden renderables; the guard incurs that work once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeated/reentrant calls represent the same installation and share its attempt; another installed pass is not reused by equal coverage counts.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Borrowed materials/scene return to their original state where supported and created materials are attempted independently; failed state/resource ownership remains explicit through the retained handle cause.
