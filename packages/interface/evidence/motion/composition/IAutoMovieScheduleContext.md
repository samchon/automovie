# src/motion/composition/IAutoMovieScheduleContext.ts#IAutoMovieScheduleContext

## @evidence contracts/development/common.md#meaningful-documentation

States the proposed film start and borrowed live walk-order entries.

## @evidence contracts/development/design.md#principled-representation

start is film seconds; entries excludes the current draft and is a growing array, not a frozen historical snapshot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieSchedulePlace supplies this context to timing, until, outcome and state; laws must copy if they need a snapshot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The context exposes only already placed entries, making declaration-order dependence explicit.

# src/motion/composition/IAutoMovieScheduleContext.ts#IAutoMovieScheduleContext.Demand

## @evidence contracts/development/common.md#meaningful-documentation

Names the three outcomes and the member that returns them.

## @evidence contracts/development/design.md#principled-representation

A closed string union of the three outcomes, so no other result can be returned.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieSchedule returns it and placeDemandedHumanPerformer branches on it; one literal per outcome it distinguishes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal names the outcome, with no optional fields to combine.
