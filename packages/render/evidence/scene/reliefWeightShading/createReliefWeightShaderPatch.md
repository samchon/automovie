# src/scene/reliefWeightShading/createReliefWeightShaderPatch.ts#createReliefWeightShaderPatch

## @evidence contracts/development/implementation.md#principled-implementation

Creates the unchanged relief-weight compile operation and stable key, applying only the existing vertex/fragment source transformations to the supplied shader.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One descriptor fits the common material patch protocol, keeping uniform and native program configuration with the material/compiler owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No renderer callback or foreign method is replaced; required shader markers and relief attribute remain premises and the descriptor does not certify compiled pixels.

## @evidence contracts/development/common.md#meaningful-documentation

Documents stable cache contribution and source-only mutation without taking uniform/native configuration ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Descriptor creation is fixed allocation and apply delegates a fixed set of linear shader-string transformations; no mesh/pixel traversal is introduced.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Equal operation structure uses one stable program-key contribution while the material patch chain retains ordering; a descriptor does not memoize arbitrary shader text.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned callback retains only module function references and acquires no shader/program/texture; material compile-hook ownership bounds its retention.
