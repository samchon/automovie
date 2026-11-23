# src/motion/composition/IAutoMovieScheduleWalk.ts#IAutoMovieScheduleWalk

## @evidence contracts/development/common.md#meaningful-documentation

One schedule walk owns mutable entries and anchor, interrupted-entry, anchored-entry and cue-track maps. Entry indices are walk order and anchor/cue instants are film seconds; the placement and cut routines share this context only during resolution.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

This namespace groups the IAutoMovieScheduleWalk contracts used by packages/engine/src/composition/AutoMovieScheduleWalk.ts; each nested declaration retains its own shape and domain constraints, without an implementation-package dependency.

## @evidence contracts/development/design.md#principled-representation

One schedule walk owns mutable entries and anchor, interrupted-entry, anchored-entry and cue-track maps. Entry indices are walk order and anchor/cue instants are film seconds; the placement and cut routines share this context only during resolution. The namespace groups these type contracts without implementing the operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical IAutoMovieScheduleWalk contract belongs to interface; packages/engine/src/composition/AutoMovieScheduleWalk.ts and packages/engine/src/composition/AutoMovieScheduleCut.ts use its nested records and callbacks. Runtime computation remains with those consumers.

# src/motion/composition/IAutoMovieScheduleWalk.ts#IAutoMovieScheduleWalk.IWalk

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its keys and its unit.

## @evidence contracts/development/design.md#principled-representation

The placed entries, the anchors' instants, the cuts' successors, the anchored entries and the cue tracks are the five things a later placement reads of an earlier one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members, all read by the cut, the placements and the walk.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No composition is named and nothing outlives the walk.
