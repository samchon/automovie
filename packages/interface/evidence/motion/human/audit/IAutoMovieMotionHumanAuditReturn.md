# src/motion/human/audit/IAutoMovieMotionHumanAuditReturn.ts#IAutoMovieMotionHumanAuditReturn

## @evidence contracts/development/common.md#meaningful-documentation

world: The largest distance between a joint centre at the two instants, world frame, metres, with the bone, at the later instant. shape: The same in each instant's own pelvis frame, metres.

## @evidence contracts/development/design.md#principled-representation

world: The largest distance between a joint centre at the two instants, world frame, metres, with the bone, at the later instant. shape: The same in each instant's own pelvis frame, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAuditReturn.ts (AutoMovieMotionHumanAuditReturn.measure, return); audit/AutoMovieMotionHumanAuditReturn.ts (AutoMovieMotionHumanAuditReturn.measure).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanAuditMeasure identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/audit/IAutoMovieMotionHumanAuditReturn.ts#IAutoMovieMotionHumanAuditReturn.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its unit and its frame.

## @evidence contracts/development/design.md#principled-representation

Form and placement apart, since an action may promise one without the other.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, each asserted by the audit's test.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional member.
