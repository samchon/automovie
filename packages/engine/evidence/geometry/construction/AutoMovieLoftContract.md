# src/geometry/construction/AutoMovieLoftContract.ts#AutoMovieLoftContract.stations

## @evidence contracts/development/implementation.md#principled-implementation

Checks positive least rise, at least two stations, finite entries and every adjacent difference before returning the original array with its intended brand.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass owns the station admission messages so downstream spline failures can identify the producer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not sort, merge or clamp bad stations; minimum-step and difference arithmetic rely on caller-scale premises.

## @evidence contracts/development/common.md#meaningful-documentation

Gives minimum count, rise units, same-array return and thrown failure effects.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) time and O(1) successful working storage inspect every required adjacent pair.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Returns the exact checked array for subsequent reads, without copying or caching a second station population.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns no retained array; the caller keeps its input and a thrown error's lifetime belongs to its catcher.

# src/geometry/construction/AutoMovieLoftContract.ts#AutoMovieLoftContract.jet

## @evidence contracts/development/implementation.md#principled-implementation

Accepts each entry only when abs(value)<=bound; callers such as SeamStation pass finite FINITE, making accepted entries finite under that premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single scan and first-failure error implement one magnitude checking boundary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not clamp entries; bound is not independently validated, so an infinite bound would also admit infinite entries.

## @evidence contracts/development/common.md#meaningful-documentation

States borrowed return, caller-supplied bound and element failure; the finite-bound premise is explicit here.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) comparisons and O(1) successful temporary storage, stopping at the first failing entry.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Returns the same array after checking; no second numerical representation or cross-call cache is built.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no input after return; failures throw one error owned by the caller's error path.

# src/geometry/construction/AutoMovieLoftContract.ts#AutoMovieLoftContract.ring

## @evidence contracts/development/implementation.md#principled-implementation

Scans all three coordinates for finiteness and accumulates the ordered X/Z shoelace sum, rejecting when its absolute value is not positive.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Coordinate admission and projected-sum checking share one pass and one producer/layer error boundary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not reorder or repair points; nonzero signed sum is not a simplicity, planarity or finite-area certificate, and extreme product overflow is not separately checked.

## @evidence contracts/development/common.md#meaningful-documentation

Gives projection, units, borrowed return and reported coordinate/area failures.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) point visits and a scalar area accumulator avoid a copied or triangulated polygon.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each edge contributes once while its current point is admitted; successful output is the caller's original point array.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

No temporary point population or global state survives; errors and the original array remain caller-owned.

# src/geometry/construction/AutoMovieLoftContract.ts#AutoMovieLoftContract.splineGap

## @evidence contracts/development/implementation.md#principled-implementation

Multiplies the absolute endpoint span by the named relative spacing policy; callers must still admit finite increasing stations and representable subtraction/product.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared scalar formula keeps the station-gap policy at the contract boundary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no absolute floor or hidden cap; it does not itself validate count, ordering, zero span or extreme-scale arithmetic.

## @evidence contracts/development/common.md#meaningful-documentation

States input ordering/count, output units and the policy's numerical limitation beside SPLINE_GAP_SHARE.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads the two endpoints and performs constant arithmetic without scanning interior stations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The scalar policy computation coordinates no shared request or numerical solve.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number and retains no array or resource.
