# src/geometry/construction/AutoMovieSolidBlendChain.ts#AutoMovieSolidBlendChain.of

## @evidence contracts/development/implementation.md#principled-implementation

Copies both analytic ribbon 2-jets into two station layers and obtains the chart sign from the first host rail's analytic outward normal. The join owns unfolding; one sign anchor does not certify regularity between columns.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One producer validates its count and column data before publishing the chain and shared trim records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses invalid arithmetic and zero/ambiguous orientation; neither the storage origin nor sampled mesh triangles decide the outward side.

## @evidence contracts/development/common.md#meaningful-documentation

States supported counts, nullable publication failures, parameter mapping and analytic outward ownership.

## @evidence contracts/development/implementation.md#efficient-algorithms

Evaluates count columns, interpolates a fixed number of O(count) fields, then reads one analytic orientation jet; column solve costs belong to the join.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One local column array supplies layers, trim charts and the sign anchor; the returned join's existing rail cache handles repeated rail requests.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local columns are released after publication; the caller owns the O(count) chain and trim arrays, with no additional retained cache here.

# src/geometry/construction/AutoMovieSolidBlendChain.ts#AutoMovieSolidBlendChain.strip

## @evidence contracts/development/implementation.md#principled-implementation

A chain interval whose two layers carry values, slopes and second derivatives is the quintic Hermite in station (`AutoMovieStationHermite`), so copying each ribbon's point, first over `L` and second over `L^2` reproduces the blend columns exactly at the column phases; between them every field is the periodic cubic B-spline interpolant.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One builder owns the ribbons-to-layers mapping and the outward sign, shared by both strip producers so their chains cannot drift apart.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a degenerate span or orientation instead of publishing; the column count and finiteness are the caller's admission.

## @evidence contracts/development/common.md#meaningful-documentation

States the layer fields, the station and phase meanings, the units and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass for the span and twelve O(n) periodic spline interpolations for n columns, then one chain jet for the sign.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller's already evaluated ribbons are read once per field; nothing is re-evaluated on a surface.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns O(n) layer arrays owned by the caller; the layers reference the shared LEVEL/STILL factory records as the join's blend always has, and no column array is retained.
