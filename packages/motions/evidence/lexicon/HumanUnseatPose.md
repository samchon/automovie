# src/lexicon/HumanUnseatPose.ts#HumanUnseatPose.slumped

## @evidence contracts/development/common.md#meaningful-documentation

States the slump.

## @evidence contracts/development/implementation.md#principled-implementation

The spine, chest and neck flex forward by `FLEX` times the share.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One loop.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new posture.

# src/lexicon/HumanUnseatPose.ts#HumanUnseatPose.flying

## @evidence contracts/development/common.md#meaningful-documentation

States the blend and the dropped holds.

## @evidence contracts/development/implementation.md#principled-implementation

Joint angles and the pitch interpolated, the heading by its shortest turn, the roll back to level.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One pass over the joints.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Linear in the joints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new posture.

# src/lexicon/HumanUnseatPose.ts#HumanUnseatPose.hang

## @evidence contracts/development/common.md#meaningful-documentation

States the place and its frame.

## @evidence contracts/development/implementation.md#principled-implementation

The hand's rest offset from the hips turned by the posture's heading, the place `reach` starts a free hand from.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One offset.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new point.

# src/lexicon/HumanUnseatPose.ts#HumanUnseatPose.reach

## @evidence contracts/development/common.md#meaningful-documentation

States the reach.

## @evidence contracts/development/implementation.md#principled-implementation

The hand's rest offset from the hips turned by the posture's heading, blended to the point; the elbow bends toward a point back and out from where it hangs.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One goal.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new posture.

# src/lexicon/HumanUnseatPose.ts#HumanUnseatPose.beside

## @evidence contracts/development/common.md#meaningful-documentation

States the point.

## @evidence contracts/development/implementation.md#principled-implementation

The body's own measures turned by the posture's heading, dropped to the floor.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One offset.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new point.

# src/lexicon/HumanUnseatPose.ts#HumanUnseatPose.standingHeight

## @evidence contracts/development/common.md#meaningful-documentation

States the height.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

The body's hip height.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One read.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanUnseatPose.ts#HumanUnseatPose.clearsFlank

## @evidence contracts/development/common.md#meaningful-documentation

States the test and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Eight samples of the flight, each read in the carrier contact's frame at its own second, against the straddle's half width taken from the entry's feet.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The flank is the straddle's, a lower bound of the carrier's width.

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight frame readings.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Run once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/lexicon/HumanUnseatPose.ts#HumanUnseatPose.shoulder

## @evidence contracts/development/common.md#meaningful-documentation

States the point.

## @evidence contracts/development/implementation.md#principled-implementation

The posture resolved for the upper arm alone; its joint is the shoulder the trunk places.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One offset.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

One resolve restricted to the upper arm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure read.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new point.

# src/lexicon/HumanUnseatPose.ts#HumanUnseatPose.reachable

## @evidence contracts/development/common.md#meaningful-documentation

States the search and its result.

## @evidence contracts/development/implementation.md#principled-implementation

Sixteen even samples of the span; reachable within the upper arm, forearm and half the hand.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

One loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A target never in reach yields none; nothing is stretched.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sixteen posture reads, each with one shoulder resolve restricted to the upper arm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Run once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
