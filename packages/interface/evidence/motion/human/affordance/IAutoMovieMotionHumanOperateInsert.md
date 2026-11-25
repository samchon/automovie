# src/motion/human/affordance/IAutoMovieMotionHumanOperateInsert.ts#IAutoMovieMotionHumanOperateInsert.IMechanism

## @evidence contracts/development/common.md#meaningful-documentation

tip: The held prop's working point that leads into the socket; `tip` when absent. depth: How far the working point goes in, metres; positive; the socket's declared depth when absent.

## @evidence contracts/development/design.md#principled-representation

tip: The held prop's working point that leads into the socket; `tip` when absent. depth: How far the working point goes in, metres; positive; the socket's declared depth when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: affordance/operateInsert.ts (operateInsert.depth, mechanism); affordance/operateInsert.ts (operateInsert.travel, mechanism); affordance/operateInsert.ts (operateInsert.tool, mechanism); affordance/operateInsert.ts (operateInsert.target, mechanism).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionTarget identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/affordance/IAutoMovieMotionHumanOperateInsert.ts#IAutoMovieMotionHumanOperateInsert.ITargetSocket

## @evidence contracts/development/common.md#meaningful-documentation

point: Socket contact point in world metres. normal: Outward socket normal in world coordinates; insertion follows its normalised opposite.

## @evidence contracts/development/design.md#principled-representation

point: Socket contact point in world metres. normal: Outward socket normal in world coordinates; insertion follows its normalised opposite.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: affordance/operateInsert.ts (operateInsert.target, socket).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
