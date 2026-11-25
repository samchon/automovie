# src/recovery/computation/IAutoMovieRecoveryCameraPoseSelectionOperation.ts#IAutoMovieRecoveryCameraPoseSelectionOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Row-major 3 by 3 camera rotation in the operation's declared source-to-camera convention. Camera translation in the operation's admitted reconstruction scale; two-view direction alone has no metric length.

## @evidence contracts/development/design.md#principled-representation

Row-major 3 by 3 fundamental matrix in the declared pixel charts; homogeneous scale has no metric meaning.

## @evidence contracts/development/design.md#minimal-and-owned-surface

createRecoveryCameraEstimate, refineRecoveryEpipolarModel, selectRecoveryCameraPose share IAutoMovieRecoveryCameraPoseSelectionOperation's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Triangulated correspondence results in input order, retaining depth and pixel-error qualifications.
