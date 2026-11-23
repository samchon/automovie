# src/geometry/construction/AutoMovieSolidCycle.ts#AutoMovieSolidCycle.piece

## @evidence contracts/development/implementation.md#principled-implementation

Exactness belongs to a segment between two consecutive vertices of one owner's curve; an edited cycle records it per segment, and a cycle as built is such a segment throughout.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reader serves the kept test, the crossing map and the clip's rebuilds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A cycle with a foreign vertex count and no per-segment record reads no curve; nothing is inferred from positions.

## @evidence contracts/development/common.md#meaningful-documentation

States both sources of the record and the reversed walk.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time on an edited cycle; O(S) for the orientation of a cycle as built.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reader coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the cycle's record or a fresh one sharing the owner's readers; retains nothing.

# src/geometry/construction/AutoMovieSolidCycle.ts#AutoMovieSolidCycle.divide

## @evidence contracts/development/implementation.md#principled-implementation

A crossing is placed by a bisection of the clip's own rail, so the two pieces beside it run to a point the owner's curve does not own; the segments beyond them still join the owner's consecutive vertices.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one place a cycle as built turns into an edited one.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Moves no vertex and drops no reader of an untouched segment.

## @evidence contracts/development/common.md#meaningful-documentation

States the call order and what changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S) once per cycle for its orientation, then one splice.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Every segment of one owner shares one record.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The cycle holds one array of S references.

# src/geometry/construction/AutoMovieSolidCycle.ts#AutoMovieSolidCycle.held

## @evidence contracts/development/implementation.md#principled-implementation

The atlas's region is the owner's curve between an owner's consecutive vertices, the same curve the neighbouring face ends on, and a clip's chords elsewhere; the parity of crossings is additive over the chord-to-arc replacements.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The cycle as built keeps its one reader; an edited one adds one foot and one side test to the chords' reading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no tolerance; a point whose foot is a chord reads exactly as `kept`. The lens is attributed by the nearest segment, so a point nearer another segment than the exact one whose lens it lies in reads its chords.

## @evidence contracts/development/common.md#meaningful-documentation

States both readings and the lens rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

The owner's reader alone on a cycle as built; on an edited one `kept` and `foot`, O(S) each, and the owner's reader.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reader coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a boolean; retains nothing.

# src/geometry/construction/AutoMovieSolidCycle.ts#AutoMovieSolidCycle.copy

## @evidence contracts/development/implementation.md#principled-implementation

Copies every array a clip edits in place and shares the immutable readers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The one copy every snapshot of a body uses, so none drops a reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Changes no value.

## @evidence contracts/development/common.md#meaningful-documentation

States what is copied and what is shared.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S) for S vertices.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure copy coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record; retains nothing.

# src/geometry/construction/AutoMovieSolidCycle.ts#AutoMovieSolidCycle.kept

## @evidence contracts/development/implementation.md#principled-implementation

Uses crossing parity in the existing chart branches for all four cycle kinds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to the same predicate as the prepared reader, without retained state.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps every original inequality and half-period tie; a winding segment on its cycle's exact curve (`IAutoMovieSolidCycle.ICycle.along`) reads that curve's station instead of the chord's, and no other boundary is moved.

## @evidence contracts/development/common.md#meaningful-documentation

The inclusive 'on cycle' wording has an existing strict-parity boundary gap, recorded separately; preparation does not claim to fix it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans S edges, plus the hole/island centre scan, in O(S) time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

This live reading caches nothing; prepare is the face-local repeated-query path.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a boolean and retains no input or scratch after the call.

# src/geometry/construction/AutoMovieSolidCycle.ts#AutoMovieSolidCycle.prepare

## @evidence contracts/development/implementation.md#principled-implementation

Reuses only cycle-invariant centre/endpoints; the shared reader retains the existing parity comparisons.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One preparation and one shared predicate serve repeated chart queries without a spatial index.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the period fallback, Math.round ties and strict crossing tests; the existing exact-boundary contract gap is not repaired here.

## @evidence contracts/development/common.md#meaningful-documentation

States the unchanged-input lifetime and the existing boundary-tie limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S) preparation and O(S) per query for S edges; cached endpoints avoid per-query tuple allocation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The caller keeps cycle kind/chart and period unchanged while using the reader; a new face creates a new reader after edits or rollback.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned closure owns O(S) endpoint scratch, with no global cache; dropping the reader releases those references.

# src/geometry/construction/AutoMovieSolidCycle.ts#AutoMovieSolidCycle.station

## @evidence contracts/development/implementation.md#principled-implementation

Reduces the query into the winding direction inferred from the endpoint phase span, then linearly interpolates the first segment bracketing that phase.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A single scan implements this first-crossing utility separately from kept's multi-crossing parity; no production caller currently requires it as an inverse.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Leaves first-match and first-vertex fallback observable; a turnback cycle does not acquire a unique inverse and malformed empty input is not admitted here.

## @evidence contracts/development/common.md#meaningful-documentation

Gives period/nonempty premises, first-crossing behavior and the no-match fallback in chart-station units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans at most S segments with constant working storage, stopping at its first nonhorizontal crossing.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure one-query scan coordinates no work; no station lookup table is retained between calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a scalar and retains no cycle, query history or temporary closing-endpoint tuple.

# src/geometry/construction/AutoMovieSolidCycle.ts#AutoMovieSolidCycle.foot

## @evidence contracts/development/implementation.md#principled-implementation

Projects onto each polygon segment by a clamped dot-product share in chart space, respecting the implemented closing-edge/query phase branches, and keeps the strict smallest distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One candidate record contains segment/share/distance, directly supporting Clip's split and Body.atlas's neighbour interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses chart distance without claiming a surface-metric or analytic-curve minimum; zero-length segments and the empty-chart sentinel preserve their explicit existing behavior.

## @evidence contracts/development/common.md#meaningful-documentation

States finite-arithmetic premises, periodic branch handling, tie order and degenerate/empty output.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compares all S segment projections to find the polygon's chart minimum without a spatial index; live candidate storage is constant, with a new small record on each improved minimum.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One independent nearest-foot scan coordinates no shared work; repeated callers rescan the polygon.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns only the final three-scalar foot; earlier candidates and per-edge tuples are call-local and no cycle reference is retained afterward.

# src/geometry/construction/AutoMovieSolidCycle.ts#AutoMovieSolidCycle.centre

## @evidence contracts/development/implementation.md#principled-implementation

A coordinatewise mean supplies the periodic reference branch for hole/island parity, using the chart's already unwrapped vertex phases.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scan and two accumulators produce the only centre needed by the cycle reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not infer an interior point, polygon-area centroid or alternate phase branch; empty/overflowing arithmetic remains observable.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes stored-coordinate mean, geometric centroid and empty-chart NaNs.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(S) additions and one two-entry result; no polygon triangulation or pairwise work is performed.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Live kept calls recompute this mean, while prepare retains the same value only for unchanged cycle kind/chart/period dependencies.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh two-number tuple and retains neither the chart nor any prior centre globally.

# src/geometry/construction/AutoMovieSolidCycle.ts#AutoMovieSolidCycle.shift

## @evidence contracts/development/implementation.md#principled-implementation

Adds period times the rounded displacement to select a phase representative nearest reference under finite representable arithmetic and a positive period.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar formula shares the same branch convention across parity, chart feet and mesh metric distances.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An absent period is identity; defined invalid periods/nonfinite arithmetic are not repaired, and Math.round ties are not replaced by modulo normalization.

## @evidence contracts/development/common.md#meaningful-documentation

States nearest-reference semantics, positive finite-period premise, identity omission and the preserved tie rule.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant scalar arithmetic without a loop over possible turns.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scalar branch calculation coordinates no requests or effects.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one number and owns no retained state, handle or task.
