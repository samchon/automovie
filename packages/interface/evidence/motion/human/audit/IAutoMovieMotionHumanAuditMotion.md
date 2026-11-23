# src/motion/human/audit/IAutoMovieMotionHumanAuditMotion.ts#IAutoMovieMotionHumanAuditMotion

## @evidence contracts/development/common.md#meaningful-documentation

States what the audit reads and which producers satisfy it. start: Where the action's own clock starts, film seconds. entryTime: Where the action takes the body over, film seconds. end: Where it ends, film seconds.

## @evidence contracts/development/design.md#principled-representation

The displayed bones are the only thing drawn, and the contact windows the only declared intent a geometric check needs; both are read as their owners declare them. start: Where the action's own clock starts, film seconds. entryTime: Where the action takes the body over, film seconds. end: Where it ends, film seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three required members, a structural subset of `HumanPerformance`, each read by an audit check, and two optional readers of a scene with moving supports or water, absent on a motion without them. Runtime boundary references: audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run, source); audit/AutoMovieMotionHumanAudit.ts (remember, source); audit/AutoMovieMotionHumanAudit.ts (remember, return); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.measure, motion); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.margin, motion); audit/AutoMovieMotionHumanAuditContact.ts (AutoMovieMotionHumanAuditContact.measure, motion).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the contact window, the engine's resolved bone and rigid transform; no cast, and each optional reader states its reading when absent. Shares the canonical IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/audit/IAutoMovieMotionHumanAuditMotion.ts#IAutoMovieMotionHumanAuditMotion.ISpan

## @evidence contracts/development/common.md#meaningful-documentation

start: Where the action's own clock starts, film seconds. entryTime: Where the action takes the body over, film seconds. end: Where it ends, film seconds.

## @evidence contracts/development/design.md#principled-representation

start: Where the action's own clock starts, film seconds. entryTime: Where the action takes the body over, film seconds. end: Where it ends, film seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/HumanVerdicts.ts (shifted, return); audit/HumanVerdicts.ts (shifted, span).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/audit/IAutoMovieMotionHumanAuditMotion.ts#IAutoMovieMotionHumanAuditMotion.ISpanPlan

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the audited declarations and their action clock.

## @evidence contracts/development/design.md#principled-representation

Uses the action plan's canonical time and balance fields and borrows its contact windows as read-only.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Audit-only view used by ISpan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Does not copy or recompute any contact or balance terms.

# src/motion/human/audit/IAutoMovieMotionHumanAuditMotion.ts#IAutoMovieMotionHumanAuditMotion.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

from: Start, film seconds. to: End, film seconds.

## @evidence contracts/development/design.md#principled-representation

from: Start, film seconds. to: End, film seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.margin.open, w); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.margin.borne, w); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.margin.feet, w); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.margin.support, w); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.standing, windows); audit/AutoMovieMotionHumanAuditBalance.ts (AutoMovieMotionHumanAuditBalance.standing.open, w).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
