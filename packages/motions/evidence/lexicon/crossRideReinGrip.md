# src/lexicon/crossRideReinGrip.ts#crossRideReinGrip

## @evidence contracts/development/common.md#meaningful-documentation

States the freedom, the defect a square hold causes, both ways the turn is read and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The crossing is the one free coordinate of a fist's hold on a round line. A taking hand reads the reachable turn nearest the square by the rig's own arm fit (Tolani, Goswami and Badler 2000, §3.2.4); a holding hand reads the twist about the normal (swing-twist decomposition) of the turn the law before asked it, so a law that continues a hold continues its goal.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The square hold, then one of two readings.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unreachable crossing is refused by the reach owner, never clamped.

## @evidence contracts/development/implementation.md#efficient-algorithms

Once per plan and holding hand: a read of the entry's goal, or one forward-kinematics read where it has none, for a holding hand; the reach owner's bounded scan for a taking one.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses `HumanMountRider.wrist` for the square hold, `placeHumanHandSurface` for the wrist and `AutoMovieMotionHumanArmReach.attitude` for the reach.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number and retains nothing.
