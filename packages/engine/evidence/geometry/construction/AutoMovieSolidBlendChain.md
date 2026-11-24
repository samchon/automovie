# src/geometry/construction/AutoMovieSolidBlendChain.ts#AutoMovieSolidBlendChain

## @evidence contracts/development/common.md#meaningful-documentation

States the layers, their fields and the refusal.

## @evidence contracts/development/design.md#principled-representation

Represents A join's blend published as a lofted chain, so the skin, its normals, its binding and its chart read the blend's vertices as they read any chain's, and a later merge can take the blend as a host face: companion namespace of 3 members (`IBlend`, `of`, `strip`); units and frames named in its text: frame, radians, world, local, second. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieSolidBlendChain` in packages/engine/src/geometry/construction/AutoMovieSolidBlendChain.ts; its surface is the 3 members listed and the text shows 15 other files naming it, mostly test (8), packages/engine (6), packages/human (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

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

One column array supplies layers, trim charts, rail records and the sign anchor. Both published width arrays use one law reading per column.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Ribbon column records are released after publication. The caller owns the O(count) chain, trim arrays and input rails used by clipping.

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
