# src/everyday/gestureSignal.ts#gestureSignal.oscillation

## @evidence contracts/development/common.md#meaningful-documentation

States the signal, the window and its 15 % ramps, the range and the value outside the stroke.

## @evidence contracts/development/implementation.md#principled-implementation

A sine of the stroke's cycles under the smaller of two minimum-jerk ramps, so the signal and its slope start and end at zero and the hand joins its held goal without a jump.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pure signal shared by the wave, rub, scratch and head-shake strokes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 15 % ramp is a provisional shaping value named in the doc.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A pure function with nothing to share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/gestureSignal.ts#gestureSignal.bump

## @evidence contracts/development/common.md#meaningful-documentation

States the formula, the range and the value outside the stroke.

## @evidence contracts/development/implementation.md#principled-implementation

A squared sine, whose value and slope are zero at both ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function with nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/everyday/gestureSignal.ts#gestureSignal.rise

## @evidence contracts/development/common.md#meaningful-documentation

States the profile, its 60 % ramp and the range.

## @evidence contracts/development/implementation.md#principled-implementation

The minimum-jerk profile of a point-to-point movement.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One expression.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The 60 % ramp is a provisional shaping value named in the doc.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function with nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
