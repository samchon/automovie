# src/geometry/IAutoMovieSpatialQueryEntry.ts#IAutoMovieSpatialQueryEntry

## @evidence contracts/development/design.md#principled-representation

Hierarchy nodes take the componentwise extrema of their entries' boxes, so a node encloses everything below it and a disjoint node can be skipped; the centre only orders entries for the median split and the ordinal only breaks candidate-order ties.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A base record of box, centre and ordinal that triangle and capsule indexes extend, so one hierarchy builder and one candidate walk serve both without knowing what the boxes enclose.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The box must be the actual enclosure, not an inflated or sampled one, so pruning by it can only skip geometry that truly cannot meet the subject.

## @evidence contracts/development/common.md#meaningful-documentation

States its builder and walker, the frame, the role of each field and that the centre never stands in for geometry, and which indexes extend it.
