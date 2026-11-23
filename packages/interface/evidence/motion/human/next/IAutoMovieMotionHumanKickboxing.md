# src/motion/human/next/IAutoMovieMotionHumanKickboxing.ts#IAutoMovieMotionHumanKickboxing

## @evidence contracts/development/common.md#meaningful-documentation

States the families a bout acts with, where their timing is owned, the bout's data and what is not yet defined.

## @evidence contracts/development/design.md#principled-representation

The bout's vocabulary is the Strike and Defence interfaces, extended rather than redeclared, so each law keeps one method.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ring and corner types and the runtime data; no method the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: no strike or defence method is declared a second time.
