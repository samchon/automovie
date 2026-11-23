# src/geometry/sweep/mapAutoMovieSurfaceTier.ts#mapAutoMovieSurfaceTier

## @evidence contracts/development/implementation.md#principled-implementation

Tiers share the patch chart, so mapping is chart composition: the source face's bilinear corner blend gives the chart point, exactly on a grid, and the target's grid or face inversion places it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Composes the corner coordinates the sampler publishes with the locator; it holds no state of its own.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Tiers whose patch lists differ are refused instead of matched by position.

## @evidence contracts/development/common.md#meaningful-documentation

States the mapping, why it is exact, the requirement that both tiers share a network, and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(P) to compare the patch name lists, then constant chart composition plus target location: O(1) for a grid or up to 30 Newton steps per target-band face. Temporary name strings and weights are released on return.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure lookup.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
