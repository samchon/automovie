# src/geometry/boundAutoMovieMeshQueryPoint.ts#boundAutoMovieMeshQueryPoint

## @evidence contracts/development/implementation.md#principled-implementation

A box's squared Euclidean distance is the sum of squared component distances to its closed coordinate intervals. Nonnegative additions are monotone in binary64, so a strict partial-sum excess also implies excess of the original full sum without changing its arithmetic order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One internal lower-bound owner serves both exact node ordering and cutoff leaf pruning. The signed query supplies already admitted bounds, point and running distance; the primitive owns no topology, surface or contact policy.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No box inflation, geometry reduction, tolerance or caller identity participates. Only strict excess stops work; equality and every potentially nearer candidate remain eligible for the unchanged narrow phase.

## @evidence contracts/development/common.md#meaningful-documentation

States metre and squared-metre units, delegated admission, infinity/default behavior, partial versus complete returns, arithmetic order, tie preservation and the actual internal traversal consumer.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most three interval distances and squared additions take constant time; strict excess after X or X+Y avoids the remaining axis arithmetic. No tree traversal or coordinate population is hidden in this primitive.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each lower bound depends on the current query point and running cutoff; immutable geometry is prepared by its caller, with no point-dependent cache here.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Uses scalar scratch and borrows the point and box for one synchronous call, with no allocations, retained buffers or cross-query state.
