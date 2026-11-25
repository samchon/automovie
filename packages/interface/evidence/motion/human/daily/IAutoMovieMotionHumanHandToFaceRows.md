# src/motion/human/daily/IAutoMovieMotionHumanHandToFaceRows.ts#IAutoMovieMotionHumanHandToFaceRows.Task

## @evidence contracts/development/common.md#meaningful-documentation

The tasks.

## @evidence contracts/development/design.md#principled-representation

Closed choices "drink", "sip", "eat", "bite", "phone", "read", "brushTeeth", "comb", "washFace", "wipeMouth", "pinchNose" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: daily/handToFace.ts (handToFace.ROWS); daily/handToFaceRows.ts (handToFaceRows.ROWS); executable/cases/handToFaceCases.ts (handToFaceCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in handToFace.ROWS.

# src/motion/human/daily/IAutoMovieMotionHumanHandToFaceRows.ts#IAutoMovieMotionHumanHandToFaceRows.IRow

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

The touch row's data plus the head's share of the approach.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members `plan` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Regions are the interface's; the right hand's region is named and the left hand's mirrored.
