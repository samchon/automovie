# src/motion/human/audit/IAutoMovieMotionHumanAuditDifference.ts#IAutoMovieMotionHumanAuditDifference.IOptions

## @evidence contracts/development/common.md#meaningful-documentation

other: The person in the second motion; the first one's subject by default. mirror: The lateral coordinate of the sagittal plane the second motion is reflected in; absent for no reflection. rate: Grid samples per second; 24 by default.

## @evidence contracts/development/design.md#principled-representation

other: The person in the second motion; the first one's subject by default. mirror: The lateral coordinate of the sagittal plane the second motion is reflected in; absent for no reflection. rate: Grid samples per second; 24 by default.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAuditDifference.ts (AutoMovieMotionHumanAuditDifference.measure, options).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in AutoMovieMotionHumanAuditDifference.measure.

# src/motion/human/audit/IAutoMovieMotionHumanAuditDifference.ts#IAutoMovieMotionHumanAuditDifference.IResult

## @evidence contracts/development/common.md#meaningful-documentation

distance: The largest distance between the same joint centre, metres. duration: The absolute difference of the two lengths, seconds.

## @evidence contracts/development/design.md#principled-representation

distance: The largest distance between the same joint centre, metres. duration: The absolute difference of the two lengths, seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAuditDifference.ts (AutoMovieMotionHumanAuditDifference.measure, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanAuditMeasure identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
