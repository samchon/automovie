# src/recovery/computation/IAutoMovieRecoveryPoseResidualsLinearizeOperation.ts#IAutoMovieRecoveryPoseResidualsLinearizeOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Signed pixel Sampson residuals and analytic five-coordinate local Jacobian. With e=x2-transpose F x1 and d the joint epipolar-normal norm, each derivative

## @evidence contracts/development/design.md#principled-representation

Signed pixel Sampson residuals and analytic five-coordinate local Jacobian. With e=x2-transpose F x1 and d the joint epipolar-normal norm, each derivative

## @evidence contracts/development/design.md#minimal-and-owned-surface

linearizeRecoveryPoseResiduals, refineRecoveryCameraPose share IAutoMovieRecoveryPoseResidualsLinearizeOperation's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
