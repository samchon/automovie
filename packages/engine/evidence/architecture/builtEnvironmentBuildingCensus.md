# src/architecture/builtEnvironmentBuildingCensus.ts#builtEnvironmentBuildingCensus

## @evidence contracts/development/implementation.md#principled-implementation

Every population is a filter of record-derived sets by ownership: faces and corners by their building field, openings by membership of their boundary in the building's exposed boundaries, and spaces and connectors by membership in the root's subtree, so nothing in the census is declared by its reader.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Places the envelope once and derives corners from those same faces through `builtEnvelopeFaceCorners`, reads the subtree and stops through the shared walks, and owns only the grouping per building.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no building, space or production; a connector landing on a volume-less space still counts by the stated rule, an undeclared root space is refused through `requireBuiltSpace`, and the unowned-space refusal passes through from the face query.

## @evidence contracts/development/common.md#meaningful-documentation

States why the census exists, the source and ownership rule of each population, the volume rule that differs between spaces and connectors, the connector deduplication, the sort, and both throws.

## @evidence contracts/development/implementation.md#efficient-algorithms

One envelope placement and one corner pairing, then per building a linear subtree walk and linear scans of faces, corners, openings, spaces and connector stops, so the total is the envelope cost plus building count times record size; each building's lists are sorted.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The placed faces feed both the face lists and the corner pairing, so the envelope is placed once per call instead of once for faces and again for corners; nothing persists across calls because the record is the caller's.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Faces, corners and per-building sets live for one call; the caller owns the census, which references the placed faces and corners and is bounded by the record's faces, openings, spaces and connectors.
