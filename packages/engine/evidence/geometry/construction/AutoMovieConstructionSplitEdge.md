# src/geometry/construction/AutoMovieConstructionSplitEdge.ts#AutoMovieConstructionSplitEdge

## @evidence contracts/development/common.md#meaningful-documentation

States the carried band, the weight's flatness and what each edge keeps.

## @evidence contracts/development/design.md#principled-representation

One generating owner for the child's seam: the band's end edge evaluates the child on its rail curve, the curve the child's rail cycle keeps, so the two faces share one edge between columns (construction.md, Connections: Ownership), as a port's exact band does on its rail.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The carried band with its two correspondence readers, and one builder.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Refuses a correspondence that does not advance; nothing is refitted and the cross ribbons are the strip's own.

# src/geometry/construction/AutoMovieConstructionSplitEdge.ts#AutoMovieConstructionSplitEdge.carried

## @evidence contracts/development/implementation.md#principled-implementation

The strip plus a displacement onto the owner's curve weighted by the quintic smoothstep, flat to second order at both edges, so both edges' cross 2-jets are the strip's and the end edge is the child on its rail.

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
