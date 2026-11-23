# src/motion/human/striking/IAutoMovieMotionHumanStrikingRecord.ts#IAutoMovieMotionHumanStrikingRecord.IRecord

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and meaning.

## @evidence contracts/development/design.md#principled-representation

World points for the offset, the plan and the reach, the shared reach status, and the stop as a function of the film second so a stop is reported only once it has happened.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What audits and capture verdicts compare a strike with.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the reach status union.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingRecord.ts#IAutoMovieMotionHumanStrikingRecord.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

record: What the strike decided, read from its current geometry.

## @evidence contracts/development/design.md#principled-representation

record: What the strike decided, read from its current geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/StrikingRecord.ts (StrikingRecord.carries, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanStrikingRecord.IRecord identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
