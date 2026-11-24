# src/geometry/measureAutoMovieModelCrossings.ts#measureAutoMovieModelCrossings

## @evidence contracts/development/implementation.md#principled-implementation

Crossing is a property of placed geometry, so every mesh is moved into the model frame by the shared part matrices before the strict pairwise census runs, and disjoint model-frame boxes, which cannot contain crossing triangles, skip a pair before any triangle is compared.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Placement comes from `autoMovieModelPartMatrices` applied by `placeAutoMovieModelPartMesh`, which model contacts and the form expectation check share, and the triangle census from `measureAutoMovieMeshCrossings`; this function only selects mesh parts, prunes pairs by box and aggregates counts into `IAutoMovieModelCrossing` records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Unplaced parts keep exact coordinates rather than passing through an identity multiply, no part or pair is exempted by name, and the documentation says the count is evidence for comparison against a rest pose rather than a verdict.

## @evidence contracts/development/common.md#meaningful-documentation

States the placement rule, skipped parts, the pair and count semantics, the strict touching rule, how to read the result and what it cannot tell, the `withinParts` entry and its use, and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Canonical recipe realization owns its adaptive work. Placement and boxes are linear in realized vertices; a pair whose boxes are disjoint costs one box test, and an overlapping pair runs the census in both directions, so cost follows how much the model overlaps itself, with `withinParts` adding one self census per part.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call measures one model in its current pose; a caller comparing poses keeps the rest report itself.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds one placed copy of each transformed mesh part's positions and one box per part for the call, and returns one small record per crossing pair; the per-direction crossing lists are released after counting.
