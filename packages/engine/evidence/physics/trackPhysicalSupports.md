# src/physics/trackPhysicalSupports.ts#trackPhysicalSupports

## @evidence contracts/development/implementation.md#principled-implementation

The endpoint force is the stable PD of Tan, Liu and Turk (2011) as AutoMoviePhysicalTracking evaluates it; the stance yield keeps an actual floor constraint from fighting a stationary task. `64 * Number.EPSILON` scaled by the goal's per-step reach is the stationarity bound: a goal velocity within Float64 rounding of the goal position over one substep is stationary.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the pattern's limbs; the force law is AutoMoviePhysicalTracking's, the joint mapping accumulatePhysicalMotorTorques', and the floor-compatibility test a local helper.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No limb, pattern or scene has its own rule. Non-null assertions read the declared support strength after `Object.hasOwn`, the segment body and goal the binding and sampler provide for every profile bone, and the material admission guarantees for every shape.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the pattern's limbs; the stance test scans the limb's patch segments, their shapes and materials once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads the current substep's poses and goals; nothing is reusable across calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; forces go to the bodies or to the caller's actuation map.

## @evidence contracts/development/common.md#meaningful-documentation

States the strength, the excluded limbs, the force law and its units, both actuation routes, the stance yield with its geometric test and the refusal.
