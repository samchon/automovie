# src/compose/AutoMovieMotionWave.ts#AutoMovieMotionWave.sample

## @evidence contracts/development/common.md#meaningful-documentation

Returns the original ramped sine from the actual named-window linear progress; cycles must be a positive integer and keep their original error.

## @evidence contracts/development/implementation.md#principled-implementation

Whole cycles meet zero at the endpoints; the product of original half-cycle minimum-jerk ramps brings speed to zero there, using the same scalar polynomial owner.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Count admission precedes the actual clock callback, then the shared signal owner evaluates both ramps and sine.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Count check/error, custom clock.linear invocation, half=1/(2*cycles), ramp argument grouping and final product remain unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant count/clock dispatch, two scalar minimum-jerk reads and one sine per actual sample; no derivative records are built.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Cold and prepared entry points use the same exact signal owner; no sample value is shared across seconds.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A cold call retains no clock, input, output or handle.

# src/compose/AutoMovieMotionWave.ts#AutoMovieMotionWave.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States fixed count/names, eager count admission and current custom callback behavior at each actual second.

## @evidence contracts/development/implementation.md#principled-implementation

Count validity and half-cycle width depend only on the fixed count, while every current clock.linear invocation remains necessary for a custom clock's behavior/effects.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One count check and copied names feed the same signal owner; no native-clock assumption or copied wave law appears in Head.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every requested second still invokes clock.linear with its original receiver and current method; waveform grouping, count rule and error text are unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Across Q reads one count check and half-width division replace Q repetitions; all current clock/progress, two scalar ramp and sine work remains, without a measured speedup claim.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only immutable count, half-width and copied names are shared. World progress and custom clock callback results are always evaluated normally.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned action reader retains one clock and three scalar/name constants until release, without a time/result history or external handle.
