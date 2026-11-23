# src/motion/composition/IAutoMovieScheduleEntry.ts#IAutoMovieScheduleEntry

## @evidence contracts/development/common.md#meaningful-documentation

Documents absolute film instants, full-duration event mapping, cut provenance and retained intent/state.

## @evidence contracts/development/design.md#principled-representation

index remains walk order after chronological sorting; contact after a cut is omitted while original events remain. Runtime timing/cut admission belongs to schedule placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieSchedulePlace creates drafts and resolveAutoMovieSchedule freezes final entry shells; consumers read stable indices for interruption links.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Opaque state is production-owned and unconstrained by the engine; optional contact, outcome, state and cut are independent facts of a placed intent.
