# src/actions/WalkPath.ts#WalkPath

## @evidence contracts/development/common.md#meaningful-documentation

Defines world-metre floor geometry, fixed point ordering, arc-length/clamped position, chord heading and first-tied nearest projection.

## @evidence contracts/development/design.md#principled-representation

Ordered authored points and cumulative lengths describe the exact unsimplified path; fixed segment deltas and denominator squares are numerical prerequisites, not sampled positions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Constructor, length, at, nearest and heading serve the existing stepping/station planners; prepared segment records remain private.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No corner is removed, length rounded, projection candidate skipped or path answer retained; callers keep the supplied fixed points unchanged for this path's lifetime.

# src/actions/WalkPath.ts#WalkPath.prototype.at

## @evidence contracts/development/common.md#meaningful-documentation

States clamped arc-length input and the floor-point result.

## @evidence contracts/development/implementation.md#principled-implementation

Selects the first cumulative segment endpoint at or beyond the clamped length, then retains the original linear point interpolation and zero-span rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lower-bound search precedes one segment interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Equal segment boundaries keep the first matching segment, including repeated points, with no path simplification.

## @evidence contracts/development/implementation.md#efficient-algorithms

Logarithmic segment selection and constant interpolation share constructor-prepared cumulative lengths, segment spans and exact coordinate deltas.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses this path's unchanged cumulative and segment geometry without retaining queried positions.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh point and retains no query state.

# src/actions/WalkPath.ts#WalkPath.prototype.nearest

## @evidence contracts/development/common.md#meaningful-documentation

Defines an actual world floor query, ignored Y, clamped segment projections and the first equal-distance winner's arc length.

## @evidence contracts/development/implementation.md#principled-implementation

Traverses every original segment in order, retaining the same dot-over-span-square projection, unit clamp, hypot distance and strict first-winner comparison.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered segment loop uses private fixed prerequisites and tracks only current least distance and its arc length.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Retains zero-span threshold, all candidates, exact multiply/add grouping and first tie; no spatial approximation or sampled nearest answer is used.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) actual projections remain while fixed endpoint deltas, cumulative differences and squared denominators no longer repeat per query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only this unchanged path's scalar segment geometry is shared; every projected query point and distance is actually computed.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Uses bounded loop locals and returns only one scalar arc length, retaining no query or external resource.
