# src/motion/human/audit/IAutoMovieMotionHumanAuditRange.ts#IAutoMovieMotionHumanAuditRange

## @evidence contracts/development/common.md#meaningful-documentation

duration: The motion's length, film seconds. overshoot: The farthest a joint stands past its range, degrees, with the bone and the axis (`flexion`, `abduction`, `twist` or `swing`); `Infinity` for a non-finite angle.

## @evidence contracts/development/design.md#principled-representation

duration: The motion's length, film seconds. overshoot: The farthest a joint stands past its range, degrees, with the bone and the axis (`flexion`, `abduction`, `twist` or `swing`); `Infinity` for a non-finite angle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAuditRange.ts (AutoMovieMotionHumanAuditRange.measure, motion); audit/AutoMovieMotionHumanAuditRange.ts (AutoMovieMotionHumanAuditRange.unloaded, posed); audit/HumanVerdicts.ts (HumanVerdicts.of.posed, return); audit/AutoMovieMotionHumanAuditRange.ts (AutoMovieMotionHumanAuditRange.measure, return); audit/AutoMovieMotionHumanAuditRange.ts (AutoMovieMotionHumanAuditRange.unloaded, return); audit/HumanVerdicts.ts (HumanVerdicts.of).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMoviePose, IAutoMovieMotionHumanAuditMeasure identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

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
