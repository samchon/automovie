# src/recovery/computation/IAutoMovieRecoveryCameraResidualsScoreOperation.ts#IAutoMovieRecoveryCameraResidualsScoreOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Collect finite absolute residuals within an inclusive pixel threshold. Returned indices preserve observation order; quantiles use linear interpolation

## @evidence contracts/development/design.md#principled-representation

Collect finite absolute residuals within an inclusive pixel threshold. Returned indices preserve observation order; quantiles use linear interpolation

## @evidence contracts/development/design.md#minimal-and-owned-surface

createRecoveryCameraEstimate, fitRecoveryEpipolarConsensus, fitRecoveryHomographyConsensus share IAutoMovieRecoveryCameraResidualsScoreOperation's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
