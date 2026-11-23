# src/geometry/curve/AutoMovieLocalHermiteField64.ts#AutoMovieLocalHermiteField64

## @evidence contracts/development/common.md#meaningful-documentation

Documents physical derivatives, partition invariance, mutable-input lifetime and unsupported geometric guarantees.

## @evidence contracts/development/design.md#principled-representation

Represents Local physical-station cubic Hermite fields from complete normalized open courses: companion namespace of 4 members (`Cell`, `Jet`, `Prepared`, `prepare`); units and frames named in its text: local, second, degree. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieLocalHermiteField64` in packages/engine/src/geometry/curve/AutoMovieLocalHermiteField64.ts; its surface is the 4 members listed and the text shows 6 other files naming it, mostly packages/engine (3), test (2), packages/recovery (1), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.

# src/geometry/curve/AutoMovieLocalHermiteField64.ts#AutoMovieLocalHermiteField64.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Quadratic mode uses fixed nonuniform physical secant stencils before Hermite construction. Ruled mode directly elevates the two-course convex blend to a bicubic tensor; exact restriction commutes with both definitions before binary64 rounding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single admitted partition and derivative stencil per station feed local cells and authoritative edge jets.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No anatomical branch, source point copying, tolerance repair or nonlinear limiter is used.

## @evidence contracts/development/common.md#meaningful-documentation

States immutable source lifetime, normalized correspondence, physical units, one-sided corner behavior and geometric limitations.

## @evidence contracts/development/implementation.md#efficient-algorithms

Admission is O(N+S); an interval sorts at most four course partitions in quadratic mode and two in ruled mode, then restricts each contributing curve per cell with logarithmic span lookup. Each input knot participates at most four times, without a global Cartesian partition.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Partitions and station-only derivative weights are prepared once; source station jets provide one shared authority to neighboring tessellation intervals.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Closures retain O(N+S) partitions, weights and caller-owned source references; interval cells are fresh caller-owned arrays and no process-wide cache exists.
