# src/climbing/climbLadderBeats.ts#climbLadderBeats.IMove

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its timebase.

## @evidence contracts/development/design.md#principled-representation

The rung reached and its interval in action seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three fields the rung lookup reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by prepare.

# src/climbing/climbLadderBeats.ts#climbLadderBeats.IReading

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The rung index it moves to or holds, its progress, and whether it moves.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three fields climbLadder's pose writers read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Read, never stored.

# src/climbing/climbLadderBeats.ts#climbLadderBeats.IBeats

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The beat, the moves per limb, the clock and its readers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members climbLadder.plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Read-only after preparation.

# src/climbing/climbLadderBeats.ts#climbLadderBeats.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, units and result.

## @evidence contracts/development/implementation.md#principled-implementation

One beat for the hands' first reach, then four beats a rung, each limb moving once a rung on a minimum-jerk course.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moves and events, the clock, then the lookups.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every move follows from the beat and the order.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear preparation in rungs; each lookup is a binary search over one limb's moves.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The moves are built once and shared by every lookup.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The moves grow with the rungs and are released with the plan.
