# src/motion/human/audit/IAutoMovieMotionHumanAuditContinuity.ts#IAutoMovieMotionHumanAuditContinuity.IResult

## @evidence contracts/development/common.md#meaningful-documentation

jump: The largest displacement left at full resolution, metres. reversal: The largest out-and-back within two grid intervals, metres. speed: The fastest joint centre over a grid interval, metres per second.

## @evidence contracts/development/design.md#principled-representation

jump: The largest displacement left at full resolution, metres. reversal: The largest out-and-back within two grid intervals, metres. speed: The fastest joint centre over a grid interval, metres per second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAuditContinuity.ts (AutoMovieMotionHumanAuditContinuity.measure, return); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run); audit/AutoMovieMotionHumanAuditContinuity.ts (AutoMovieMotionHumanAuditContinuity.measure).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanAuditMeasure identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
