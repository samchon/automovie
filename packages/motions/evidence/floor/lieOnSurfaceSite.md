# src/floor/lieOnSurfaceSite.ts#lieOnSurfaceSite

## @evidence contracts/development/common.md#meaningful-documentation

States what it finds and when it refuses.

## @evidence contracts/development/implementation.md#principled-implementation

A linear lookup of the prop's declared affordances by id and kind, the prop's own declaration being the only source of its sites.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One responsibility: resolving a named lying surface or seat edge, apart from the law that lies on it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing site is refused with the affordance named; no nearest or default site stands in.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(a) over the prop's a affordances, once per site at plan time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Reads the prop's declaration directly; there is no equivalent work to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; returns the prop's own affordance record.
