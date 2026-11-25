# src/kinematics/swivelArcs.ts#swivelArcs.fitted

## @evidence contracts/development/common.md#meaningful-documentation

States the three samples and the result.

## @evidence contracts/development/implementation.md#principled-implementation `a + b` at 0, `a + c` at 90 and `a - b` at 180 solve exactly for the three coefficients.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three expressions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact for any reading of a rotation turned about a fixed axis.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The one fit of a joint box's entries and of a point's bounds.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swivelArcs.ts#swivelArcs.scaled

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

Sinusoids of one swivel are a vector space.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by every bound.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swivelArcs.ts#swivelArcs.combined

## @evidence contracts/development/common.md#meaningful-documentation

States the result.

## @evidence contracts/development/implementation.md#principled-implementation

Sinusoids of one swivel are a vector space.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by every bound.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swivelArcs.ts#swivelArcs.above

## @evidence contracts/development/common.md#meaningful-documentation

States the three cases.

## @evidence contracts/development/implementation.md#principled-implementation `a + R cos(ψ - ψ₀)` with `R = hypot(b, c)` and `ψ₀ = atan2(c, b)` exceeds the margin within `acos((margin - a) / R)` of `ψ₀`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two tests and one arc.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The roots are exact.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shared by every bound.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swivelArcs.ts#swivelArcs.least

## @evidence contracts/development/common.md#meaningful-documentation

States the result's unit and range and the constant case.

## @evidence contracts/development/implementation.md#principled-implementation `a + R cos(ψ - φ)` is least where the cosine is -1, at `φ + 180`, which `atan2(-c, -b)` gives in one call.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One test and one `atan2`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact; a constant returns none rather than an arbitrary swivel.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its argument.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swivelArcs.ts#swivelArcs.lowest

## @evidence contracts/development/common.md#meaningful-documentation

States the result and when the trough is taken.

## @evidence contracts/development/implementation.md#principled-implementation

A sinusoid has one trough a turn, so over an interval it is least at that trough when the interval holds it, and otherwise at an end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One test and two evaluations.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact; never sampled between the ends.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swivelArcs.ts#swivelArcs.roots

## @evidence contracts/development/common.md#meaningful-documentation

States the result's unit, range and count.

## @evidence contracts/development/implementation.md#principled-implementation `a + R cos(ψ - φ)` vanishes at `φ ± acos(-a / R)` when `|a| <= R`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One amplitude, one phase and one arccos.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact roots; a constant returns none rather than every swivel.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its argument.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swivelArcs.ts#swivelArcs.union

## @evidence contracts/development/common.md#meaningful-documentation

States the cover and the "every swivel" case.

## @evidence contracts/development/implementation.md#principled-implementation

Each arc taken into its turn and copied a turn either way, then sorted and merged, so an arc across 0 or 360 is whole.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Copy, sort, merge.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three pieces an arc, one sort.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Built once per fit and read by every test of it.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list.

# src/kinematics/swivelArcs.ts#swivelArcs.covers

## @evidence contracts/development/common.md#meaningful-documentation

States the test.

## @evidence contracts/development/implementation.md#principled-implementation

The interval taken into the turn `union` covers twice.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the few merged intervals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by every test of one union.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swivelArcs.ts#swivelArcs.nearest

## @evidence contracts/development/common.md#meaningful-documentation

States the three results.

## @evidence contracts/development/implementation.md#principled-implementation

Merged intervals are disjoint, so a swivel inside one leaves the union first at one of its two ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lookup and one comparison.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The end is the exact root.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the few merged intervals.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads `union`'s cover.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/kinematics/swivelArcs.ts#swivelArcs.complement

## @evidence contracts/development/common.md#meaningful-documentation

States the result's form, the gap across 360 and the empty and full cases.

## @evidence contracts/development/implementation.md#principled-implementation

Merged arcs are disjoint and ordered over the turn, so the swivels outside them are the gaps between neighbours and the one across 360.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Clip to the turn, take the gaps, keep each in the turn from 0.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ends are the union's own, never resampled.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the few merged arcs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its argument.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh list and retains nothing.

# src/kinematics/swivelArcs.ts#swivelArcs.holding

## @evidence contracts/development/common.md#meaningful-documentation

States the result's turn and the case with none.

## @evidence contracts/development/implementation.md#principled-implementation

An arc no wider than a turn holds a swivel exactly where the swivel, taken into the arc's turn, lies between its ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shift and one comparison an arc.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the few arcs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh arc and retains nothing.