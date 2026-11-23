# src/motion/human/striking/IAutoMovieMotionHumanStrikingRecord.ts#IAutoMovieMotionHumanStrikingRecord

## @evidence contracts/development/common.md#meaningful-documentation

offset: The intended landing offset from the aim point, world metres. planned: The contact goal predicted at the launch, offset included, world metres. reached: Where the weapon's surface reaches at the planned contact, world metres: the planned point, or the limb's highest or farthest reachable point when the target lies beyond it.

## @evidence contracts/development/design.md#principled-representation

offset: The intended landing offset from the aim point, world metres. planned: The contact goal predicted at the launch, offset included, world metres. reached: Where the weapon's surface reaches at the planned contact, world metres: the planned point, or the limb's highest or farthest reachable point when the target lies beyond it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/kick.ts (kick.plan, return); striking/knee.ts (knee.plan, return); striking/punch.ts (punch.plan, return); striking/StrikingRecord.ts (StrikingRecord.of, return); striking/StrikingRecord.ts (StrikingRecord.carries, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanStrikingReach.ISolution identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

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
