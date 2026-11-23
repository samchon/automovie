# src/motion/human/audit/IAutoMovieMotionHumanAuditTiming.ts#IAutoMovieMotionHumanAuditTiming

## @evidence contracts/development/common.md#meaningful-documentation

start: Where the action's own clock starts, film seconds. entryTime: Where the action takes the body over, film seconds. end: Where it ends, film seconds.

## @evidence contracts/development/design.md#principled-representation

start: Where the action's own clock starts, film seconds. entryTime: Where the action takes the body over, film seconds. end: Where it ends, film seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAuditTiming.ts (AutoMovieMotionHumanAuditTiming.faults, spans); audit/AutoMovieMotionHumanAuditTiming.ts (AutoMovieMotionHumanAuditTiming.faults, span); audit/AutoMovieMotionHumanAuditTiming.ts (AutoMovieMotionHumanAuditTiming.instant, span); audit/AutoMovieMotionHumanAuditTiming.ts (AutoMovieMotionHumanAuditTiming.order, span); audit/AutoMovieMotionHumanAuditTiming.ts (AutoMovieMotionHumanAuditTiming.shared, a); audit/AutoMovieMotionHumanAuditTiming.ts (AutoMovieMotionHumanAuditTiming.shared, b).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionEvent, IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/audit/IAutoMovieMotionHumanAuditTiming.ts#IAutoMovieMotionHumanAuditTiming.ISpan

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit.

## @evidence contracts/development/design.md#principled-representation

The placement in film seconds and the plan's declared shares, as their owners state them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A structural subset of the placed segment; only what the rules read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the event and the contact window; the two optional members are optional on the plan itself.
