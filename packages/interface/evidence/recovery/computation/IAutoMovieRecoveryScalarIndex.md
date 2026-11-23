# src/recovery/computation/IAutoMovieRecoveryScalarIndex.ts#IAutoMovieRecoveryScalarIndex.Create

## @evidence contracts/development/common.md#meaningful-documentation

Returns ascending original face indices whose closed height intervals include the finite query level. Returns ascending original face indices with positive overlap with the finite open interval (before,after).

## @evidence contracts/development/design.md#principled-representation

Returns ascending original face indices whose closed height intervals include the finite query level.

## @evidence contracts/development/design.md#minimal-and-owned-surface

extractRecoveryMeshSections, observeRecoveryOrderedCuts, RecoveryAtlasObservationSource share IAutoMovieRecoveryScalarIndex's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
