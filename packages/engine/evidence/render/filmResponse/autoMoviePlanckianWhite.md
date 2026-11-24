# src/render/filmResponse/autoMoviePlanckianWhite.ts#autoMoviePlanckianWhite

## @evidence contracts/development/common.md#meaningful-documentation

The doc comment states the input units and frames, the cited method, the output and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the piecewise cubic approximation of the Planckian locus by Kim et al. (2002) over its published range and maps the chromaticity at unit luminance to linear Rec. 709 by the IEC 61966-2-1 matrix. Out-of-gamut negatives at low temperatures are returned as computed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the black-body white; the response matrix and productions that colour a lamp by temperature share it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The coefficients are the published ones; temperatures outside their range throw rather than extrapolate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Nothing is cached; the call is cheap and pure.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
