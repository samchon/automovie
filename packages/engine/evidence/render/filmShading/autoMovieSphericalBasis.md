# src/render/filmShading/autoMovieSphericalBasis.ts#autoMovieSphericalBasis

## @evidence contracts/development/common.md#meaningful-documentation

States the nine functions, their order and the origin of the constants.

## @evidence contracts/development/implementation.md#principled-implementation

The real spherical harmonics of bands 0 to 2 with their standard normalizations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the basis for the projection and the evaluation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The constants are the tabulated normalizations, not fitted values.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Pure and uncached.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
