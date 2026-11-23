# src/recovery/computation/IAutoMovieRecoveryPoseModelCreationOperation.ts#IAutoMovieRecoveryPoseModelCreationOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Row-major 3 by 3 camera rotation in the operation's declared source-to-camera convention. Camera translation in the operation's admitted reconstruction scale; two-view direction alone has no metric length.

## @evidence contracts/development/design.md#principled-representation

Pixel epipolar model and its five local calibrated-pose derivatives. Rotation increments act on the left in radians; translation increments use

## @evidence contracts/development/design.md#minimal-and-owned-surface

createRecoveryPoseModel, refineRecoveryCameraPose share IAutoMovieRecoveryPoseModelCreationOperation's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
