# src/geometry/construction/AutoMovieSolidMeshConstraints.ts#AutoMovieSolidMeshConstraints

## @evidence contracts/development/common.md#meaningful-documentation

States existing-point authority, source-segment provenance, periodic turns and explicit unsupported/representability failures.

## @evidence contracts/development/design.md#principled-representation

Represents Partition existing indexed chart constraints without inventing or welding a point: companion namespace of 4 members (`contains`, `ISegment`, `IEdge`, `split`); units and frames named in its text: local, second, world. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieSolidMeshConstraints` in packages/engine/src/geometry/construction/AutoMovieSolidMeshConstraints.ts; its surface is the 4 members listed and the text shows 17 other files naming it, mostly packages/engine (11), test (6), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/construction/AutoMovieSolidMeshConstraints.ts#AutoMovieSolidMeshConstraints.contains

## @evidence contracts/development/implementation.md#principled-implementation

Tests exact collinearity and closed coordinate ranges in each admitted local cover image, sharing the same represented-point predicate as split.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One membership reading lets grid/domain preparation avoid creating a new index on an authoritative shared boundary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns no closest point or welded identity; a nearby distinct coordinate remains distinct and unavailable/overflowing inputs fail by name.

## @evidence contracts/development/common.md#meaningful-documentation

States closed-segment meaning, single-period primitive premise and absence of source-point construction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans S supplied segments and at most three point images each in O(S) work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure query retains no geometry or callback; caller-local source preparation owns repeated-query reuse.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Uses fixed per-segment scratch and returns a boolean/string without retaining inputs.

# src/geometry/construction/AutoMovieSolidMeshConstraints.ts#AutoMovieSolidMeshConstraints.split

## @evidence contracts/development/implementation.md#principled-implementation

Existing vertices on each lifted closed segment become sorted cuts. Indexed/turn identity deduplicates overlapping pieces, followed by exact-sign contact validation.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One result union exposes a complete partition or the first explicit failure, without mutating caller data.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Distinct coincident IDs and proper crossings without an original vertex are refused rather than silently merged or reconstructed. The one-period primitive premise limits cover-image work.

## @evidence contracts/development/common.md#meaningful-documentation

States lift range, source indices, immutability, failure and absence of world geometry construction.

## @evidence contracts/development/implementation.md#efficient-algorithms

One sort of V points, then each of E segments reads only the points inside its own range of the first coordinate, and of the S squared pairs of unique pieces only those whose ranges of it overlap are compared, with at most three periodic point/edge images per comparison.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses each source vertex value and one indexed piece record for all of its inducing segments; no callback effects are shared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local maps and cut arrays expire with the call; output source incidence storage can grow to O(EV), with no retained global state.
