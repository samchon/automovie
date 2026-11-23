# src/film/resolveBeatEnd.ts#resolveBeatEnd

## @evidence contracts/development/implementation.md#principled-implementation

Samples at `shot.duration`, the instant the cut leaves, through the shared `resolveBeatSnapshot`, so the end state is measured from the motions the shot plays rather than copied from the program that authored it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A named entry point that fixes the instant, so callers ask for the closing boundary by name and the sampling rules live once in `resolveBeatSnapshot`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Adds no rule of its own; every actor goes through the same snapshot body the opening uses, so no actor, prop or caller is treated differently at the end.

## @evidence contracts/development/common.md#meaningful-documentation

States the instant, what makes the state resumable and when plants are present, where a baked prop ends, which callers read it and what it is compared with, and every throw.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Delegates the whole cost to `resolveBeatSnapshot`, which answers it; this wrapper adds one property read.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Computes one shot's closing state per call and caches nothing; `compileDefinedShot` stores it on the compiled result for the runtime to hand the next beat, and `validateFilmContinuity` resolves each beat's end once per check.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the returned state, whose ownership `resolveBeatSnapshot` answers.
