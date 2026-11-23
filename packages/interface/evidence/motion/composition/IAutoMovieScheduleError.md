# src/motion/composition/IAutoMovieScheduleError.ts#IAutoMovieScheduleError

## @evidence contracts/development/common.md#meaningful-documentation

The closed error-code union identifies schedule reference, timing, cut-share and missing-law failures. The record carries the failed name or number and optional intent/anchor context and accepted alternatives; AutoMovieScheduleError formats these facts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This namespace groups the IAutoMovieScheduleError contracts used by packages/engine/src/composition/AutoMovieScheduleError.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.

## @evidence contracts/development/design.md#principled-representation

The closed error-code union identifies schedule reference, timing, cut-share and missing-law failures. The record carries the failed name or number and optional intent/anchor context and accepted alternatives; AutoMovieScheduleError formats these facts. The namespace groups these type contracts without implementing the operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieScheduleError contract belongs to interface; packages/engine/src/composition/AutoMovieScheduleError.ts and packages/engine/src/composition/AutoMovieScheduleCut.ts use its nested records and callbacks. Runtime computation remains with those consumers.

# src/motion/composition/IAutoMovieScheduleError.ts#IAutoMovieScheduleError.Code

## @evidence contracts/development/common.md#meaningful-documentation

Lists each of the seven codes with the check that raises it.

## @evidence contracts/development/design.md#principled-representation

A closed union of the resolver's checks, so a content package switches over every kind of reference failure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seven codes, each thrown by `resolveAutoMovieSchedule`; none is declared for a presumed future check.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A literal union, not a free string; no code stands for two failures.

# src/motion/composition/IAutoMovieScheduleError.ts#IAutoMovieScheduleError.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it names; the optional ones state when they are absent.

## @evidence contracts/development/design.md#principled-representation

The record of the error's fields: the check that failed, the intent's subject and capability, the anchor or track named, the value that failed and what would have been accepted.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `resolveAutoMovieSchedule` passes when it throws; every member becomes a field of the error that a content package reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `subject`, `capability` and `of` are optional because a failure may not belong to an intent or an anchor; they combine without meaningless states, and `alternatives` is none when absent.
