# src/geometry/planarSegmentsMeet.ts#planarSegmentsMeet

## @evidence contracts/development/implementation.md#principled-implementation

The orientation test for a proper crossing plus the four endpoint-on-segment cases, which together cover every way two closed segments can meet; collinearity uses the absolute `PLANAR_EPSILON` the free-form region kernel defines for millimetre-scale arcs.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Shared by region validation and hole bridging, which previously each kept an identical private copy, so a ring pair refused by validation is exactly the pair a bridge must not cross.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No ring, label or caller changes the tolerance; the architecture graph's scale-relative `segmentsTouch` is a different contract and is not imitated here.

## @evidence contracts/development/common.md#meaningful-documentation

States why touching counts, the exact crossing and contact rules with their tolerance, and the zero-length segment behaviour.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time, at most eight orientation determinants; the contact candidates are a fixed four-entry table built per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A constant-time pure predicate; its callers iterate pairs and nothing is worth caching between them.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one four-entry table per call and returns a boolean, keeping no reference to it or the points.
