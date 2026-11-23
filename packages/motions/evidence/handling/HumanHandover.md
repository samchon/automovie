# src/handling/HumanHandover.ts#HumanHandover.plan

## @evidence contracts/development/common.md#meaningful-documentation

The namespace defines both bodies, displayed starting bones, held prop and exchange timing; this method returns their common receiver grip and transfer schedule.

## @evidence contracts/development/implementation.md#principled-implementation

The mutual exchange point translates the held prop; the grasp search ranks each receiver turn by the fit at the offered grip and at the upright carry key; the times are the cited reach, carry and mass-interpolated transfer times.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The offered frame, one receiver grip search, then the timing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The release follows the receiver's grip by the transfer time; partners beyond reach are refused by the mutual goal.

## @evidence contracts/development/implementation.md#efficient-algorithms

The carry wrist and the hanging elbow are read once for every candidate key; one turn grid of thirteen grasp fits plus the keys the lower bound does not prune.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The turn grid shares one alignment per turn (`HumanGraspHand.turns`); each candidate is fitted on its own.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The search's geometry ends with the call; the plan holds frames, the target, wrists, the arm reference and scalar times.

# src/handling/HumanHandover.ts#HumanHandover.carried

## @evidence contracts/development/common.md#meaningful-documentation

States the place, what it is read on and the frame of the result.

## @evidence contracts/development/implementation.md#principled-implementation

The elbow at the side with the forearm level is the carrying posture of a light object; both lengths are the body's own.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shoulder read and one point in the posture's heading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No metre constant: the upper arm and the forearm are the body's measures.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by the receiver's plan for its carry and by the grip choice as a key pose, so both mean one place.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One forward-kinematics pass.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.

# src/handling/HumanHandover.ts#HumanHandover.upright

## @evidence contracts/development/common.md#meaningful-documentation

States the freedom, how each instant's turn is chosen, how the turn runs between them and what the ends keep.

## @evidence contracts/development/implementation.md#principled-implementation

An upright vessel's rotation is fixed up to a turn about the vertical, so that turn is the arm's to choose; the tip is read as the asked rotation's error applied to the world's up, the only error that spills what the hand holds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A fixed number of instants, a fixed set of turns, one linear interpolation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The turn is chosen at plan time and is a function of time alone, never of a previous frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

Nine posture resolves per instant, one instant per STEP of the path, at plan time; each later read finds its interval in O(log K) comparisons and interpolates linearly.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by the giver's offer and the receiver's take-away, the two upright carries of a handover.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned function retains K times and K scalar turns until its action is released; actual sample postures and solver workspaces are not captured or retained.

# src/handling/HumanHandover.ts#HumanHandover.tipped

## @evidence contracts/development/common.md#meaningful-documentation

States what is measured and the unit.

## @evidence contracts/development/implementation.md#principled-implementation

The asked rotation holds the prop upright, so the reached rotation's error from it, applied to the world's up, is the tip and nothing else.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolve, one quotient, one angle.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A goal with no rotation is not upright by anything, so it reads as infinitely tipped.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Read by `upright` along a path and by the receiver's choice of its carrying place.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One posture resolve.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A pure function that retains nothing.
