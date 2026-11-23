# src/index.ts#applyReliefWeights

## @evidence contracts/development/implementation.md#principled-implementation

Registers the existing stable-key shader patch that interpolates per-vertex relief and scales native tangent normal slopes before downstream detail/overlay composition.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Patch registration uses the common material compile-hook owner while vertex and fragment source transformations stay separate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every drawn mesh must provide reliefWeight and a tangent-space normalMap; no fallback attribute or changed shader value hides a missing input, and registration alone is not appearance proof.

## @evidence contracts/development/common.md#meaningful-documentation

Documents attribute interpolation, base slope weighting order, tangent-normal premise and required per-mesh attribute.

## @evidence contracts/development/implementation.md#efficient-algorithms

Registration adds one fixed patch descriptor; actual compile transformations scan shader source and runtime weighting stays native per-fragment work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The stable patch key contributes to native program equivalence while per-mesh attributes remain live inputs; no compiled program is cached independently here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The material compile owner retains the registered descriptor with that material, whose caller owns disposal; no geometry, texture or WebGL program is acquired by registration.
