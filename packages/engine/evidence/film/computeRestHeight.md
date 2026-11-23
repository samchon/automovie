# src/film/computeRestHeight.ts#computeRestHeight

## @evidence contracts/development/implementation.md#principled-implementation

Reads each joint's model-space Y from the shared rest-frame forward kinematics and returns max minus min; rest scale is unit by the rig contract, so the composed translations are the joint positions the renderer poses.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A one-axis reduction over `skeletonRestFrames`, which owns the composition and the malformed-rig refusals that `computeModelRestExtent` shares, so the two rest measurements cannot disagree about where a bone sits.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no rig; the empty skeleton's 0 is the measured span of nothing, and the subject-height substitution for it belongs to `nodeSubjectExtent`, not here.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and axis, why a joint span understates a drawn figure with the stickman ratio, which function to use for framing, the empty-rig result, and each throwing case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the bone count B: one rest-frame walk of O(B) and one pass over the bones for the extremes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure measurement of one skeleton that coordinates nothing across calls; a caller framing one rig repeatedly owns any reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing past the call; the rest-frame map it builds is dropped on return and only a number leaves.
