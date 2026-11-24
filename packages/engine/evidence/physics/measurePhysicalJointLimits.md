# src/physics/measurePhysicalJointLimits.ts#measurePhysicalJointLimits

## @evidence contracts/development/implementation.md#principled-implementation

Each joint is measured against the set the solver admits it to (`projectPhysicalJointRotation`), so an admitted pose reads within its limits. A gated joint (`range`) reads its rotation in the bone's frame by swing and twist (`swingTwistRange.read`): the swing past the region's radius on its great circle (`swingTwistRange.radius`) and the twist past its interval at the alias nearest it (`nearestAngleAlias`), the range-of-motion gate's own measure, converted to radians. A charted joint is read by the chart (`AutoMoviePhysicalJointChart.nearest`): each free axis's angle against its range, and each locked axis's angle plus the component about it of the turn the chart's reading leaves (`PhysicalRotationVector.log` of the rotation against the composed reading) against zero, so a reading that drops a locked turn still reports it. Otherwise each free coordinate is the wrapped twist projection and each locked one 2 asin(q.axis). The premises are the units, frames and ranges stated in its parameter documentation; apart from structural 0, 1 and 2 and the degree-to-radian factor the body uses no numeric literal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One relative rotation, then exactly one of three readings, the gate first, each mapped onto the three entries' violations; it reuses `Quaternion`, `swingTwistRange`, `nearestAngleAlias`, `PhysicalRotationVector` and `AutoMoviePhysicalJointChart` from their owners and adds no option beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call: one relative rotation, then one swing-twist reading with one radius lookup, or one chart reading with one composition and one logarithm, or three range lookups over the joint's at most three axes. No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache of its own: each call recomputes from its arguments, and the gate's radius table is the region's own, kept by its owner for the joint's records.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its allocations become the returned value or die with the call, so nothing grows.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (Measure every native angular constraint from displayed bone frames) and states, per reading, what each entry measures and its unit.
