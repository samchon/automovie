# src/motion/human/actions/IAutoMovieMotionHumanWalkSteps.ts#IAutoMovieMotionHumanWalkSteps.IInput

## @evidence contracts/development/common.md#meaningful-documentation

to: The destination floor point, world metres. via: Floor points passed in order before the destination, world metres. face: The heading at arrival, degrees; the last leg's direction when absent.

## @evidence contracts/development/design.md#principled-representation

to: The destination floor point, world metres. via: Floor points passed in order before the destination, world metres. face: The heading at arrival, degrees; the last leg's direction when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/walkSteps.ts (walkSteps.plan, input).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanWalkPace.IProps, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanEntryState, IAutoMovieVector3, IAutoMovieMotionHumanWalkFacing.IFacing identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/actions/IAutoMovieMotionHumanWalkSteps.ts#IAutoMovieMotionHumanWalkSteps.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

duration: Seconds. events: Named instants in seconds. stances: Stance spans per foot, seconds.

## @evidence contracts/development/design.md#principled-representation

duration: Seconds. events: Named instants in seconds. stances: Stance spans per foot, seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/walkSteps.ts (walkSteps.plan, return); actions/walkWindows.ts (walkWindows.of, steps); actions/walk.ts (walk.locomote).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanWalkFoot.IScheduled identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/actions/IAutoMovieMotionHumanWalkSteps.ts#IAutoMovieMotionHumanWalkSteps.IStance

## @evidence contracts/development/common.md#meaningful-documentation

side: The foot kept planted. from, to: The span, action-local seconds. inPlace: Whether the footfall that begins it is taken in place at the arrival.

## @evidence contracts/development/design.md#principled-representation

One planted span of one foot, marked when its footfall only turns the body at the arrival.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/walkSteps.ts (walkSteps.plan, return); actions/walkLocomote.ts (the swing's reach ranges).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Plain seconds and a flag; the footfall's place and timing stay with walkSteps.
