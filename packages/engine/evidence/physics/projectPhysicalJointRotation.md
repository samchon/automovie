# src/physics/projectPhysicalJointRotation.ts#projectPhysicalJointRotation

## @evidence contracts/development/common.md#meaningful-documentation

Gives the purpose (admit a relative joint rotation to the joint's one admitted set) and each set in turn: the anatomical gate of a ball joint read by swing and twist, the sequential chart's box, and the independent twist coordinates.

## @evidence contracts/development/implementation.md#principled-implementation

A gated joint (`range`) is admitted on the range-of-motion gate's own set: the rotation carried into the bone's frame (`basis q basis^-1`) is brought into the range by `swingTwistRange.project` in closed form, its direction back along its great circle to the region's radius and its twist clamped to its interval. In the range's chart (`swingTwistRange.chart`) that set is the unit disc of directions times the twist interval, a product of convex sets, so clamping each factor is the projection; no box applies to such a joint, whose clinical angles are readings, and no alternating projection is run. A charted joint clamps each Tait-Bryan angle of the chart's reading (`AutoMoviePhysicalJointChart.nearest`) into its free axis's range and holds a locked one at zero; any other joint clamps each free coordinate 2 atan(q.axis / w). The premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body throws (1 throw site). Beyond structural 0, 1 and 2 the coordinate branch uses the literal 1e-12, which keeps the finite Rodrigues representation off the half turn; its basis is stated in the comment, not independently sourced.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One norm check, then exactly one of three admissions, the gate first, each delegating to its owner (`swingTwistRange`, `AutoMoviePhysicalJointChart`, `Quaternion`) instead of copying it; it adds no option, layer or abstraction beyond its documented parameters.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 1e-12 is not independently sourced here.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call: one gate projection (its radius read off the region's kept table), or one chart reading with three clamps, or three coordinate clamps over at most three axes. No speedup is claimed and none is measured.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The operation coordinates no requests, phases or consumers and holds no cache of its own: each call recomputes from its arguments, and the gate's radius table is the region's own, kept by its owner for the joint's records.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The function acquires no handle, timer, listener or task and keeps no state between calls; its allocations become the returned value or die with the call, so nothing grows.
