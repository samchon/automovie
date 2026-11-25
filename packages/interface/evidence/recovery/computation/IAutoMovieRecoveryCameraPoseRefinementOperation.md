# src/recovery/computation/IAutoMovieRecoveryCameraPoseRefinementOperation.ts#IAutoMovieRecoveryCameraPoseRefinementOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Row-major 3 by 3 camera rotation in the operation's declared source-to-camera convention. Camera translation in the operation's admitted reconstruction scale; two-view direction alone has no metric length.

## @evidence contracts/development/design.md#principled-representation

Positive pixel scale of the declared robust residual loss.

## @evidence contracts/development/design.md#minimal-and-owned-surface

refineRecoveryCameraPose, refineRecoveryEpipolarModel share IAutoMovieRecoveryCameraPoseRefinementOperation's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Smallest accepted normalized design singular ratio; dimensionless and independent of residual magnitude.
