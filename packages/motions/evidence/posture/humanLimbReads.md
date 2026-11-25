# src/posture/humanLimbReads.ts#humanLimbReads

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, per what, which consumers read it and the attached-goal exception.

## @evidence contracts/development/implementation.md#principled-implementation

The same sets the view and the source read built per fit: the obstacle bones of the placed other arm (`HumanArmObstacleBones`), the limb's bones, closed under the rig's parent relation by the same climb; the demand is the rig producer's own `prepareBones` of the source read's set.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the four limbs and two placements; the view and the fit read the result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Membership only: the view still filters each pose's own records in their order, and the demand reads each pose through the ordinary admission.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(B) a set for B bones, sixteen sets and eight demands once a body, where every fit built its two sets and sorted its demand.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

A value of the rig, made with the body (`createHumanBody`) and held by it.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Sixteen small sets and eight demands, released with the body.
