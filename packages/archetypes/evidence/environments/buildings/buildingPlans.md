# src/environments/buildings/buildingPlans.ts#buildingPlans

## @evidence contracts/development/implementation.md#principled-implementation

Uses the shared triangulator for exact source regions and separating axes for positive planar overlap of convex triangle pairs, with 1e-9 m slack for projected edge contact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Room shapes take one normalization path; walls consume the canonical result later.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Input defects name the offending local plan. Floor bounds, id collisions and overlaps are resolved before any world translation or mesh assembly.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each region is triangulated once here. Rooms in each level are compared pairwise; a pair that is not separated by its plan bounds compares triangles until the first overlapping pair.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller can reuse a normalized plan for each placement without revalidating its room membership; polygon coordinates and opening inputs are owned copies.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns records bounded by the authored levels, rooms, polygon vertices and openings, with no cache or resource handles.

## @evidence contracts/development/common.md#meaningful-documentation

Documents the unit, output and allowed boundary contact.
