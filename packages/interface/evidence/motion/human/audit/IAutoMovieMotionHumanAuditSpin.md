# src/motion/human/audit/IAutoMovieMotionHumanAuditSpin.ts#IAutoMovieMotionHumanAuditSpin

## @evidence contracts/development/common.md#meaningful-documentation

turn: The largest turn left at full resolution, degrees, with the bone and the start of its final interval; zero at `none` when every bone turns continuously at the limit. spin: The fastest turn over a grid interval, degrees per second, with the bone and the interval's start.

## @evidence contracts/development/design.md#principled-representation

turn: The largest turn left at full resolution, degrees, with the bone and the start of its final interval; zero at `none` when every bone turns continuously at the limit. spin: The fastest turn over a grid interval, degrees per second, with the bone and the interval's start.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAuditSpin.ts (AutoMovieMotionHumanAuditSpin.measure, return); audit/AutoMovieMotionHumanAuditSpin.ts (AutoMovieMotionHumanAuditSpin.measure).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanAuditMeasure identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/audit/IAutoMovieMotionHumanAuditSpin.ts#IAutoMovieMotionHumanAuditSpin.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and what its second and bone mean.

## @evidence contracts/development/design.md#principled-representation

A discontinuity and a rate, the two ways a turn is wrong.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, each asserted by the audit's test.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional member.
