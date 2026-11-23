# src/recovery/computation/IAutoMovieRecoveryRelativePoseStepOperation.ts#IAutoMovieRecoveryRelativePoseStepOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Row-major 3 by 3 camera rotation in the operation's declared source-to-camera convention. Camera translation in the operation's admitted reconstruction scale; two-view direction alone has no metric length.

## @evidence contracts/development/design.md#principled-representation

Apply a five-coordinate local step while retaining a rotation and unit t. The first three coordinates are a left rotation vector in radians; the final

## @evidence contracts/development/design.md#minimal-and-owned-surface

stepRecoveryRelativePose share IAutoMovieRecoveryRelativePoseStepOperation's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
