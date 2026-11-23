# src/recovery/computation/IAutoMovieRecoveryCameraPointTriangulationOperation.ts#IAutoMovieRecoveryCameraPointTriangulationOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Row-major 3 by 3 camera rotation in the operation's declared source-to-camera convention. Camera translation in the operation's admitted reconstruction scale; two-view direction alone has no metric length.

## @evidence contracts/development/design.md#principled-representation

Pixel discrepancy between the first observation and its point reprojection.

## @evidence contracts/development/design.md#minimal-and-owned-surface

createRecoveryCameraMap, selectRecoveryCameraPose, triangulateRecoveryCameraPoint share IAutoMovieRecoveryCameraPointTriangulationOperation's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
