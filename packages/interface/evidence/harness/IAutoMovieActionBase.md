# src/harness/IAutoMovieActionBase.ts#IAutoMovieActionBase

## @evidence contracts/development/design.md#principled-representation `performShot` checks actor ids against the staged nodes and cameras, `start` and a numeric span against `[0, shot duration]`, and `repeat` as a positive integer, then `compilePerformance` repeats each synthesized clip and places it at `start` in the lane `actionRegion` assigns.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The timing, actor, repetition and region fields live once here and every verb extends them, so the gate and the compiler read the same names for every verb instead of a per-verb timing shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An auto span runs to the shot end for overlap/attach checks rather than being guessed from synthesis, and physicsIntent is unread. The common gate uses Number.isInteger for repeat without a safe-integer/workload cap and checks only the declared unrepeated span; callers must supply feasible repetition counts, and repeated synthesis is not independently bounded to that span here.

## @evidence contracts/development/common.md#meaningful-documentation

States who validates the fields; members give the actor list rules and the camera exception, time units and bounds, what `"auto"` means to each consumer, how `repeat` extends the motion but not the checked span, every default region, and that `physicsIntent` has no reader.
