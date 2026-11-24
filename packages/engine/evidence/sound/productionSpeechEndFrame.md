# src/sound/productionSpeechEndFrame.ts#productionSpeechEndFrame

## @evidence contracts/development/common.md#meaningful-documentation

The comment defines the speech end frame, the tick rule it shares with the mixer, where the sample count comes from, the parameters' units and the refusals.

## @evidence contracts/development/implementation.md#principled-implementation

Frame boundaries map to sample ticks by the shared rational nearest-tick rule, which is nondecreasing in the frame, so the first frame reaching the target tick is unique. A closed-form estimate lands within one frame of it, because nearest rounding moves a boundary by at most half a tick, and two short loops settle the exact frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the span rule for both the timeline planner and the render route, so captions, ducking, visemes and placement read one definition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant is chosen: the rate, the tick rule and the count come from the plan and the admitted receipt.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time: one estimate and at most a few boundary evaluations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments with no shared work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It allocates nothing beyond its closure and holds no resource.
