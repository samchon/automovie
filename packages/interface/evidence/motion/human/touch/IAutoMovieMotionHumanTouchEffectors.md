# src/motion/human/touch/IAutoMovieMotionHumanTouchEffectors.ts#IAutoMovieMotionHumanTouchEffectors.With

## @evidence contracts/development/common.md#meaningful-documentation

Which part of the hand touches.

## @evidence contracts/development/design.md#principled-representation

Closed choices "palm", "fingertips", "forefinger", "handBack", "fist", "handEdge", "heel" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: touch/touch.ts (touch.EFFECTORS); touch/touchEffectors.ts (touchEffectors.TABLE).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in touch.EFFECTORS.
