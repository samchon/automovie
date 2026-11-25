# src/striking/StrikingSupport.ts#StrikingSupport.goal

## @evidence contracts/development/common.md#meaningful-documentation

States the two hand frames, the offset basis and the elbow rule.

## @evidence contracts/development/implementation.md#principled-implementation

Expands the support offset in the held tool's rotated orthonormal basis, aligns the bare hand to the handle's axis and edge, and asks the shared arm goal to put its grip there.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The tool axes, the offset, the aligned hand and one arm goal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The same goal is used before and during the stroke, including when the support hand changes handles.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant rigid-frame work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses StrikingHeld.bare/hand and AutoMovieMotionHumanArm.goal.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/striking/StrikingSupport.ts#StrikingSupport.posture

## @evidence contracts/development/common.md#meaningful-documentation

States the one-hand identity and the arm goal added for two hands.

## @evidence contracts/development/implementation.md#principled-implementation

Adds goal's rigidly carried support contact to the same posture the holding arm is judged on.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A null case and one arm member.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves every other limb and body channel.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Calls the shared supporting-hand goal.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
