# src/film/autoMovieSectionPlanesKeepPoint.ts#autoMovieSectionPlanesKeepPoint

## @evidence contracts/development/implementation.md#principled-implementation

The kept region of several half-space cuts is the intersection of their closed kept sides, so the point is tested with `every` over `autoMovieSectionPlaneDistance(plane, point) <= 0`, reusing the single boundary rule rather than restating it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One predicate over the list, delegating all plane arithmetic and refusal to the distance function, so the point test, the box classifier and the viewer share one sign convention.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No plane order, axis or plane count is special-cased, and an empty list is the natural identity of `every` rather than a separate branch.

## @evidence contracts/development/common.md#meaningful-documentation

States the intersection semantics and why, the boundary rule, the agreement with the viewer's clipping setting, the empty-list meaning, and when a degenerate plane throws given the early exit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the number of planes with constant work each, stopping at the first plane that removes the point; nothing is allocated.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure predicate per point with no coordination across calls or consumers.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains neither the plane list nor the point after returning.
