# src/motion/composition/IAutoMovieScheduleCut.ts#IAutoMovieScheduleCut

## @evidence contracts/development/common.md#meaningful-documentation

A resolved cut carries a dimensionless share in [0, 1] and an optional event reference; event absence distinguishes a directly chosen share. AutoMovieScheduleCut resolves and admits the cut before placement consumes it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This namespace groups the IAutoMovieScheduleCut contracts used by packages/engine/src/composition/AutoMovieScheduleCut.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.

## @evidence contracts/development/design.md#principled-representation

A resolved cut carries a dimensionless share in [0, 1] and an optional event reference; event absence distinguishes a directly chosen share. AutoMovieScheduleCut resolves and admits the cut before placement consumes it. The namespace groups these type contracts without implementing the operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieScheduleCut contract belongs to interface; packages/engine/src/composition/AutoMovieScheduleCut.ts and packages/engine/src/composition/AutoMovieSchedulePlace.ts use its nested records and callbacks. Runtime computation remains with those consumers.

# src/motion/composition/IAutoMovieScheduleCut.ts#IAutoMovieScheduleCut.ICut

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning and range.

## @evidence contracts/development/design.md#principled-representation

A cut is a share in [0, 1] of the duration, with the event it was found at when it was found at one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both written onto the schedule's entry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No intent or law is named; the event is optional because a share needs none.
