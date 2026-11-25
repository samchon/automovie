# src/geometry/construction/AutoMovieConstructionSplitEdge.ts#AutoMovieConstructionSplitEdge.carried

## @evidence contracts/development/implementation.md#principled-implementation

The strip plus a displacement onto the owner's curve weighted by the quintic smoothstep, flat to second order at both edges, so both edges' cross 2-jets are the strip's and the end edge is the child on its rail.

The quintic Hermite start-derivative weight `s(1 - s)^3(1 + 3s)` comes from the six endpoint value, slope and second derivative conditions. It applies the supplied transverse germ while preserving the original rail jet. [Gabrielides et al.](https://users.math.uoc.gr/~mkaravel/files/papers/bransurf.pdf)

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The correspondence field, the rail's point with two clock derivatives, then one jet reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a correspondence whose derivative reaches zero from the field's own bounds; no derivative is differenced.

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n) to prepare; a reading takes two strip jets, one child jet and one rail reading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The correspondence field is prepared once for every reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The surface retains the strip, the child, the rail reader and one field.

# src/geometry/construction/AutoMovieConstructionSplitEdge.ts#AutoMovieConstructionSplitEdge.IFork

## @evidence contracts/development/common.md#meaningful-documentation

Names the shared fork and the parent reader available to both incident charts.

## @evidence contracts/development/design.md#principled-representation

Extends the existing clock and angular support range with the parent's actual surface 2-jet callback.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One required reader travels with the inherited fork clock and radius for the carried strip.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The parent continuation is a required typed reader from the existing material owner. Both sides refer to that same record.

# src/geometry/construction/AutoMovieConstructionSplitEdge.ts#AutoMovieConstructionSplitEdge.IFork.retained

## @evidence contracts/development/common.md#meaningful-documentation

Names the normalized cross request and the shared parent material 2-jet read by both sides of the fork.

## @evidence contracts/development/implementation.md#principled-implementation

The function supplied by the parent evaluates its retained material in the shared local continuation chart. The carried strip reads that actual jet when the fork owns the location.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The fork record pairs the reader with its clock and radius. The caller supplies the actual cross request.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both incident charts use the parent's supplied reader and material frame. Domain and source admission belong to that parent.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each reached fork read delegates once to its prepared callback, with the cost of the original source jet.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same parent reader can serve the two incident charts without preparing separate source geometry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The owning fork keeps the reader for one prepared connection. Reading a changing address returns the source jet to its caller.
