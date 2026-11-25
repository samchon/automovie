# src/recovery/computation/IAutoMovieRecoveryEpipolarMatrixFittingOperation.ts#IAutoMovieRecoveryEpipolarMatrixFittingOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Fit x2 transpose F x1 = 0 with normalized original-design eight-point SVD. Rank two is imposed in the normalized image chart before denormalization,

## @evidence contracts/development/design.md#principled-representation

Fit x2 transpose F x1 = 0 with normalized original-design eight-point SVD. Rank two is imposed in the normalized image chart before denormalization,

## @evidence contracts/development/design.md#minimal-and-owned-surface

fitRecoveryEpipolarConsensus, fitRecoveryEpipolarMatrix share IAutoMovieRecoveryEpipolarMatrixFittingOperation's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
