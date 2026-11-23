# src/terrain/climbStairsWeight.ts#climbStairsWeight

## @evidence contracts/development/common.md#meaningful-documentation

Names the side, time frame, phase boundaries and units of the result.

## @evidence contracts/development/implementation.md#principled-implementation

Each swing fixes the opposite support's whole load; double support interpolates adjacent loads with zero endpoint velocity and acceleration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered list of takeoff and touchdown knots plus the entry and exit stands drives the lookup.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every event uses its authored time and bearing side, including the last gathering step.

## @evidence contracts/development/implementation.md#efficient-algorithms

The plan prepares two knots per step and finds the surrounding interval in logarithmic time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same clock and step order determine all loads throughout the plan.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader owns only an array bounded by the scheduled step count.
