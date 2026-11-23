# src/motion/human/affordance/IAutoMovieMotionHumanOperateState.ts#IAutoMovieMotionHumanOperateState.IAtPlace

## @evidence contracts/development/common.md#meaningful-documentation

point: Unoperated contact point in world metres. normal: Unoperated surface normal in world coordinates.

## @evidence contracts/development/design.md#principled-representation

point: Unoperated contact point in world metres. normal: Unoperated surface normal in world coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: affordance/operateState.ts (operateState.at, place).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/affordance/IAutoMovieMotionHumanOperateState.ts#IAutoMovieMotionHumanOperateState.IAtResult

## @evidence contracts/development/common.md#meaningful-documentation

point: Operated contact point in world metres. normal: Operated surface normal in world coordinates. roll: Knob rotation in degrees; zero for mechanisms without knob roll.

## @evidence contracts/development/design.md#principled-representation

point: Operated contact point in world metres. normal: Operated surface normal in world coordinates. roll: Knob rotation in degrees; zero for mechanisms without knob roll.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: affordance/operateState.ts (operateState.at, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
