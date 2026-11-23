# src/motion/human/audit/IAutoMovieMotionHumanAuditRange.ts#IAutoMovieMotionHumanAuditRange.IPosed

## @evidence contracts/development/common.md#meaningful-documentation

States what is read and which producer satisfies it.

## @evidence contracts/development/design.md#principled-representation

Clinical angles live on the pose, not on the resolved bones the other audits read.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, a structural subset of `HumanPerformance`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the interface's pose; no cast or optional member.

# src/motion/human/audit/IAutoMovieMotionHumanAuditRange.ts#IAutoMovieMotionHumanAuditRange.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and what it is read on.

## @evidence contracts/development/design.md#principled-representation

The worst overshoot and the one share it cannot tell.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, each asserted by the audit's test.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional member.
