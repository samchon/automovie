# src/posture/HumanArmTrajectoryPace.ts#HumanArmTrajectoryPace.duration

## @evidence contracts/development/common.md#meaningful-documentation

Establishes the rounding direction and its timing purpose.

## @evidence contracts/development/implementation.md#principled-implementation

Film time is rounded upwards on the admission grid. The resulting motion still has to pass its unchanged speed bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One frame quantization.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No threshold changes and no verdict is accepted without resampling the retimed motion.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

One scalar calculation.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmTrajectoryPace.ts#HumanArmTrajectoryPace.slower

## @evidence contracts/development/common.md#meaningful-documentation

States the ratio, its floor and the inputs.

## @evidence contracts/development/implementation.md#principled-implementation

A probe's step over an interval divided by the bound times the interval is its speed's ratio to the bound; stretching the span by the greatest ratio brings every probe within it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over arms, intervals and speed probes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The probe's travel is read against its base (`HumanArmTrajectoryTravel`), so a carrier's own motion is not slowed.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one placement per frame and one step per speed probe per interval.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A matching admission can supply its completed placements. Otherwise consecutive intervals share their boundary placement.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanArmTrajectoryPace.ts#HumanArmTrajectoryPace.coursed

## @evidence contracts/development/common.md#meaningful-documentation

States the ends' rule and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Each interior waypoint encodes the course's arm at its instant, inside the coordinates' ranges (`M.ranged`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One map over arms and instants.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The ends are the context's own, so the course never moves the rest or the back.

## @evidence contracts/development/implementation.md#efficient-algorithms

One course read and encoding per arm and waypoint.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh coordinates and retains nothing.

# src/posture/HumanArmTrajectoryPace.ts#HumanArmTrajectoryPace.uniform

## @evidence contracts/development/common.md#meaningful-documentation

States the grid, its ends and units.

## @evidence contracts/development/implementation.md#principled-implementation

Steps of `STEP` from the start, the last interior one more than a nanosecond short of the end so no interval is a rounding sliver.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Both ends are kept exactly.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the span's frames.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh array and retains nothing.
