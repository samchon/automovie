# src/recovery/computation/IAutoMovieRecoveryImagePointsNormalizationOperation.ts#IAutoMovieRecoveryImagePointsNormalizationOperation.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Centre matched image points and set their mean Euclidean distance to sqrt(2). Hartley's normalized eight-point construction acts on the original design:

## @evidence contracts/development/design.md#principled-representation

Centre matched image points and set their mean Euclidean distance to sqrt(2). Hartley's normalized eight-point construction acts on the original design:

## @evidence contracts/development/design.md#minimal-and-owned-surface

fitRecoveryEpipolarMatrix, fitRecoveryHomography, normalizeRecoveryImagePoints share IAutoMovieRecoveryImagePointsNormalizationOperation's canonical records; the referenced quantities retain one declaration owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
