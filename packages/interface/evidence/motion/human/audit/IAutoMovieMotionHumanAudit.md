# src/motion/human/audit/IAutoMovieMotionHumanAudit.ts#IAutoMovieMotionHumanAudit.Check

## @evidence contracts/development/common.md#meaningful-documentation

The name of a check.

## @evidence contracts/development/design.md#principled-representation

Closed choices "tangle", "floor", "slip", "lift", "jump", "reversal", "speed", "balance" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.LIMITS); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.CHECKS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.

# src/motion/human/audit/IAutoMovieMotionHumanAudit.ts#IAutoMovieMotionHumanAudit.ILimits

## @evidence contracts/development/common.md#meaningful-documentation

The largest reading each check allows; `null` leaves a check unread.

## @evidence contracts/development/design.md#principled-representation

Closed choices null distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanAudit.Check identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/audit/IAutoMovieMotionHumanAudit.ts#IAutoMovieMotionHumanAudit.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

rate: Grid samples per second; 24 by default. limits: Limits that replace the defaults.

## @evidence contracts/development/design.md#principled-representation

rate: Grid samples per second; 24 by default. limits: Limits that replace the defaults.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run, options).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanAudit.ILimits identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/audit/IAutoMovieMotionHumanAudit.ts#IAutoMovieMotionHumanAudit.IFinding

## @evidence contracts/development/common.md#meaningful-documentation

check: The check that read it. limit: The limit it exceeds.

## @evidence contracts/development/design.md#principled-representation

check: The check that read it. limit: The limit it exceeds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.describe, f); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanAudit.Check identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/audit/IAutoMovieMotionHumanAudit.ts#IAutoMovieMotionHumanAudit.IReport

## @evidence contracts/development/common.md#meaningful-documentation

measures: Every check's reading; absent for a check left unread.

## @evidence contracts/development/design.md#principled-representation

measures: Every check's reading; absent for a check left unread.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run, return); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.describe, report); audit/AutoMovieMotionHumanAudit.ts (AutoMovieMotionHumanAudit.run); audit/HumanVerdicts.ts (HumanVerdicts.of).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanAudit.Check, IAutoMovieMotionHumanAuditMeasure, IAutoMovieMotionHumanAuditTangle.IPair, IAutoMovieMotionHumanAudit.IFinding identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
