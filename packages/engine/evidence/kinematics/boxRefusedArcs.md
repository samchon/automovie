# src/kinematics/boxRefusedArcs.ts#boxRefusedArcs

## @evidence contracts/development/common.md#meaningful-documentation

States the premise on the rotation, each chart's limits and their arcs, the cone's piecewise reading and every case that refuses nothing.

## @evidence contracts/development/implementation.md#principled-implementation

Each box bound is an exact sinusoid of the swivel in either chart (Tolani, Goswami and Badler 2000, section 3.2.3), refused on its arc a margin past the bound. The swing cone couples flexion and abduction, so its boundary is no sinusoid's root: it is the one limit read per one-degree piece, where its closed-form interval bound certainly exceeds it. The pieces are found by interval bisection (branch and bound, Moore 1966, Interval Analysis): a bound over an interval holds over each of its pieces, so an interval certainly exceeded or certainly within settles all its pieces at once and the refused pieces are exactly the grid's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reading, then per chart its axes' arcs and the cone's pieces, merged.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every refusal is certain; a limit the analysis cannot bound refuses nothing.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three rotations fit the entries, at most twelve arcs a chart, and with a cone an interval bisection of the turn: two closed-form bounds settle each interval whole, so a cone nowhere near its limit costs two bounds a chart and only the pieces along its boundary are read one by one, at most 360 a chart.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Moved from `boxExcludedSwivels`, whose test and `hingedSwivelFeasible` read the same arcs; the readings and bounds are `swivelJointReadings`'s.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh lists and retains nothing.