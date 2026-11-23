# src/motion/human/compose/IAutoMovieMotionHumanArmPlanned.ts#IAutoMovieMotionHumanArmPlanned.ISpan

## @evidence contracts/development/common.md#meaningful-documentation

States each instant's meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The reach, the hold and the return are bounded by four instants of the action's clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, all read by `planned`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Seconds, not clock names, so a law without a clock (a gesture) fits.

# src/motion/human/compose/IAutoMovieMotionHumanArmPlanned.ts#IAutoMovieMotionHumanArmPlanned.ITogether

## @evidence contracts/development/common.md#meaningful-documentation

States who joins and who solves.

## @evidence contracts/development/design.md#principled-representation

Two arms whose paths are coupled are one problem (Erdmann and Lozano-Pérez 1987), so the group holds them and their one solution.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members, the solution and the guard against re-entry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The solution is kept so every member reads the same plan.

# src/motion/human/compose/IAutoMovieMotionHumanArmPlanned.ts#IAutoMovieMotionHumanArmPlanned.IPlanned

## @evidence contracts/development/common.md#meaningful-documentation

States what is taken from the carry and what is added.

## @evidence contracts/development/design.md#principled-representation

An arm's task: its rest, its goal, its weight and its declared contacts, the seed of the law's own fit of its hold where the law gives one, and the arm it ends at.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The carry's members `planned` reads, and `back`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The members are the carry's own by `Pick`, not restated.

# src/motion/human/compose/IAutoMovieMotionHumanArmPlanned.ts#IAutoMovieMotionHumanArmPlanned.IWarm

## @evidence contracts/development/common.md#meaningful-documentation

States what is handed on, between whom, and the key it is filed under.

## @evidence contracts/development/design.md#principled-representation

The span the solution was reached on beside the solver's own state, so the next plan can carry it phrase by phrase onto its own span.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written and read by `planned`; a holder between two plans passes it on unread.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No verdict or pose is carried; the next solve admits the state anew, so a state of another action can cost time and never a wrong plan.
