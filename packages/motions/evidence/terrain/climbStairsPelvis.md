# src/terrain/climbStairsPelvis.ts#climbStairsPelvis

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result; the namespace gives the timing.

## @evidence contracts/development/implementation.md#principled-implementation

Minimum-jerk progress between stances, its height on the swing and its progress over the floor half a step behind.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepares contact and progress intervals once, then selects the height and floor spans separately.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

After the last step the path holds the last stance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear preparation/storage in steps includes fixed height differences, progress denominators and original XYZ interpolation deltas. Two logarithmic selections and constant-size interpolation remain per read; the prepared lerp's fresh output receives the original separate Y without a second vector copy.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The final clock/stances stay fixed, so named seconds, windows and original coordinate differences prepare once through the shared Vector3 owner. Every actual progress/lift still evaluates; only a guaranteed fresh interpolation vector is locally updated, never a retained stance or output from another read.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader owns one set of interval arrays bounded by the step count and releases them with the plan, without retaining query history.
