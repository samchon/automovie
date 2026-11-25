# src/posture/HumanHandAttitude.ts#HumanHandAttitude.held

## @evidence contracts/development/common.md#meaningful-documentation

States inputs, numerical solve order, returned posture, unchanged-rig operation boundary and current-value preparation on a later call.

## @evidence contracts/development/implementation.md#principled-implementation

The wrist's local rotation decomposed on its chart inside its range and clamped; the residual's twist about the forearm's axis, converted to the forearm's clinical twist by its rate read off the rig, added to the current twist.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A wrist solve, one twist share and a second wrist solve.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both joints are clamped by the rig's range; what neither can turn stays a residual, never reported as reached.

## @evidence contracts/development/implementation.md#efficient-algorithms

Initial placement retains the complete coupled solve. Up to three later wrist/forearm observations request only their chain frames: the shared selector can omit independent unobserved world goals, falling back fully for unsupported coupling. Ordered authored admission remains complete; one reader and prepared wrist metadata avoid repeated same-valued FK/rig math, without a measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One held invocation owns or synchronously borrows exact FK plus its parent's genuine same-body ROM metadata. Every canonical read still projects all actual authored joints, and unknown projections fall back cold. Forearm/hand observations retain proven dependency closure; fixed wrist metadata alone is shared while each residual/decomposition/clamp remains actual.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

One local lazy FK getter owns O(B) successful scalar snapshots, and one wrist reader borrows fixed rig metadata plus its rest inverse/clamp closure until return or throw. Neither reader enters the returned posture, a plan, body memory or callback; fresh joints/tuples retain their existing output ownership.
