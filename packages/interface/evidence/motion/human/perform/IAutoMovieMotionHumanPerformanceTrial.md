# src/motion/human/perform/IAutoMovieMotionHumanPerformanceTrial.ts#IAutoMovieMotionHumanPerformanceTrial

## @evidence contracts/development/common.md#meaningful-documentation

States what is kept, for whom, and the three conditions under which the placement may take it; each member gives its meaning and timebase.

## @evidence contracts/development/design.md#principled-representation

The planning's own results (context, plan, entry share, recorded meetings) beside the inputs that decide equivalence: the intent's identity, the start in film seconds and two counts of the placed state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by `HumanPerformancePlace.place` for a trial, completed by `HumanPerformanceSchedule.align`, read once by the next placement; the performance state holds at most one.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the context, plan and meeting types; no pose, time or fitted result is held outside the plan itself.
