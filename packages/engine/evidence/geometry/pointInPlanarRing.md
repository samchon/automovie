# src/geometry/pointInPlanarRing.ts#pointInPlanarRing

## @evidence contracts/development/implementation.md#principled-implementation

The even-odd crossing count with a half-open `y` test, so a vertex on the ray is counted once; exact for a simple ring and a point off it, which region validation and hole bridging guarantee before calling.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared by region validation and hole bridging, which previously each kept an identical private copy, so a hole judged inside the outer ring is judged the same way when its bridge midpoint is tested.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance or boundary rule is added for a particular caller; the off-ring premise is stated instead of being patched with a boundary test.

## @evidence contracts/development/common.md#meaningful-documentation

States the rule and ray direction, the off-ring premise and who guarantees it, the winding freedom, and how it differs from `pointInPolygon` on the boundary.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over the n ring edges, O(n) time and O(1) space, the lower bound for an unindexed ring.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Callers probe one point per ring pair or bridge candidate, too few against any one ring to repay an index.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Keeps a loop index and one parity flag for the call and allocates nothing.
