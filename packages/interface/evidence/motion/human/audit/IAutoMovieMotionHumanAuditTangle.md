# src/motion/human/audit/IAutoMovieMotionHumanAuditTangle.ts#IAutoMovieMotionHumanAuditTangle.IPair

## @evidence contracts/development/common.md#meaningful-documentation

depth: How deep beyond the rest pose, metres, positive. seconds: The film second of that depth; zero for a single pose.

## @evidence contracts/development/design.md#principled-representation

depth: How deep beyond the rest pose, metres, positive. seconds: The film second of that depth; zero for a single pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAuditPartner.ts (AutoMovieMotionHumanAuditPartner.measure.read, pairs); audit/AutoMovieMotionHumanAuditTangle.ts (AutoMovieMotionHumanAuditTangle.measure.pairs, x); audit/AutoMovieMotionHumanAuditTangle.ts (AutoMovieMotionHumanAuditTangle.measure.pairs, y); audit/AutoMovieMotionHumanAuditTangle.ts (AutoMovieMotionHumanAuditTangle.pose, return); audit/AutoMovieMotionHumanAuditTangle.ts (AutoMovieMotionHumanAuditTangle.across, return); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/audit/IAutoMovieMotionHumanAuditTangle.ts#IAutoMovieMotionHumanAuditTangle.IResult

## @evidence contracts/development/common.md#meaningful-documentation

worst: The deepest pair. pairs: Every unordered pair that passed into each other at some instant, its deepest instant, deepest first.

## @evidence contracts/development/design.md#principled-representation

worst: The deepest pair. pairs: Every unordered pair that passed into each other at some instant, its deepest instant, deepest first.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAuditTangle.ts (AutoMovieMotionHumanAuditTangle.measure, return); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanAuditMeasure, IAutoMovieMotionHumanAuditTangle.IPair identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
