# src/motion/human/handling/IAutoMovieMotionHumanPushPull.ts#IAutoMovieMotionHumanPushPull.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and default.

## @evidence contracts/development/design.md#principled-representation

The load, its handles, the way, where to, the load level and whether it moves.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The handles are named affordances of the prop; the load is a declared level, not a typed lean.

# src/motion/human/handling/IAutoMovieMotionHumanPushPull.ts#IAutoMovieMotionHumanPushPull.Way

## @evidence contracts/development/common.md#meaningful-documentation

How the load is moved.

## @evidence contracts/development/design.md#principled-representation

Closed choices "push", "pull", "drag" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Public boundary formerly declared in handling/pushPull.ts; canonical declarations reference this identity directly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.
