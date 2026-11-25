# src/recovery/computation/IAutoMovieRecoveryEpipolarConsensusFittingOperation.ts#IAutoMovieRecoveryEpipolarConsensusFittingOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Row-major 3 by 3 epipolar model in the declared image charts; homogeneous scale is arbitrary. Residual-gated original correspondence indices and their pixel quantiles for the current model.

## @evidence contracts/development/design.md#principled-representation

Residual-gated original correspondence indices and their pixel quantiles for the current model.

## @evidence contracts/development/design.md#minimal-and-owned-surface

createRecoveryCameraEstimate, fitRecoveryEpipolarConsensus share IAutoMovieRecoveryEpipolarConsensusFittingOperation's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Actual random-sample hypotheses attempted under the caller's explicit work ceiling.
