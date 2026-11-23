# src/architecture/canonicalAutoMoviePatternPolygon.ts#canonicalAutoMoviePatternPolygon

## @evidence contracts/development/implementation.md#principled-implementation

Delegates point-set hull construction to `convexHull2D`, requires at least three retained points and unchanged count, and returns its counter-clockwise order. This checks retained convex-position points under the hull's numerical predicate, not the simplicity or convexity of the original authored ring order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One canonicalizer for every zone region and exclusion of the pattern run, reusing `convexHull2D` on the ground plane rather than a second hull implementation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not silently drop authored points; count loss refuses. Reordering is intentional and explicit because the contract is a convex point set rather than preservation of an authored ring.

## @evidence contracts/development/common.md#meaningful-documentation

States what is refused and why, the returned winding, the units, and every thrown case with its label.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N log N) hull work plus O(N) finiteness checks and coordinate copies, with no assumption that authored outlines have a fixed small size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one outline; the pattern run calls it once per region and exclusion and reuses the result.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates the lifted and hulled copies for one call and retains nothing; the caller owns the returned outline.
