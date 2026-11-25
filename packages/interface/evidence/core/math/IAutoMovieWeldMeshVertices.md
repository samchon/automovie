# src/core/math/IAutoMovieWeldMeshVertices.ts#IAutoMovieWeldMeshVertices.IResult

## @evidence contracts/development/design.md#principled-representation

A first-occurrence identity table and one table ordinal per input XYZ tuple describe nanometre-grid topology welding without moving the source coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

weldMeshVertices exposes exactly the labels and original-order vertex mapping required by topology readers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Labels are identity tokens rather than coordinates; large-coordinate axes preserve exact binary64 identity and malformed XYZ input is refused by the producer.

## @evidence contracts/development/common.md#meaningful-documentation

Documents first-occurrence ordering, per-input alignment and the safe-grid/exact-coordinate distinction.
