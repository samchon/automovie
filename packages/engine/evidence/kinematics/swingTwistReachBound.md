# src/kinematics/swingTwistReachBound.ts#swingTwistReachBound.ISpan

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit, its meaning and its empty value.

## @evidence contracts/development/design.md#principled-representation

The scan reads grid steps, so the closed form answers in them: the farthest step an interval of reached swings holds, and that interval's ends when it alone decides the step's cell.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One input and three outputs, all read by `swingTwistRegion`'s reach scan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record is the caller's and reused per ray; an interval is reported only where the closed forms hold and nothing else reaches into the cell.

# src/kinematics/swingTwistReachBound.ts#swingTwistReachBound.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States inputs, units, the bound's meaning and the null cases.

## @evidence contracts/development/implementation.md#principled-implementation

The latitude and longitude chart of two successive rotations about orthogonal axes. Each admitted interval of rig angles, with its full-turn aliases (`nearestAngleAlias` admits an angle when any alias lies inside), maps to swings through `asin` and `atan2`, monotone on the pieces used. Where the circle passes within 1e-4 of the abduction axis (`|c|` under it) the longitude is undefined or nearly so and the scan tests three fixed abductions instead, so there the latitude alone bounds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admitted rig intervals once a joint, their swing intervals per reading, and the farthest end of their intersections.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An upper bound only: the scan and its bisection still decide the reach on the same grid, and every interval is widened by `MARGIN` (and its sines by 1e-9) so rounding cannot place a reached swing above it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work a great circle: at most three aliases of two intervals on two readings.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; the admitted rig intervals are computed once a joint by construction.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The returned closure holds three short interval lists and is released with the table's build.
