# src/motion/human/audit/IAutoMovieMotionHumanAuditStroke.ts#IAutoMovieMotionHumanAuditStroke

## @evidence contracts/development/common.md#meaningful-documentation

seconds: When the scalar turns, film seconds.

## @evidence contracts/development/design.md#principled-representation

seconds: When the scalar turns, film seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAuditStroke.ts (AutoMovieMotionHumanAuditStroke.measure, return); audit/AutoMovieMotionHumanAuditStroke.ts (AutoMovieMotionHumanAuditStroke.measure).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in AutoMovieMotionHumanAuditStroke.measure.

# src/motion/human/audit/IAutoMovieMotionHumanAuditStroke.ts#IAutoMovieMotionHumanAuditStroke.IExtreme

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit.

## @evidence contracts/development/design.md#principled-representation

When and how far, the two facts a repetition is checked by.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, read by the audit's test and by law tests.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional member.

# src/motion/human/audit/IAutoMovieMotionHumanAuditStroke.ts#IAutoMovieMotionHumanAuditStroke.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it lists and in which order.

## @evidence contracts/development/design.md#principled-representation

Peaks and troughs apart, since a law names one of them as its repetition.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two lists; counts and excursions are read off them by the caller.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No derived member that could disagree with the lists.
