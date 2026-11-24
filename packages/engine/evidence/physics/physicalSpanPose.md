# src/physics/physicalSpanPose.ts#physicalSpanPose

## @evidence contracts/development/common.md#meaningful-documentation

States how the trunk is carried by the response's centre of mass and how each leg reaches its foot's place.

## @evidence contracts/development/implementation.md#principled-implementation

The legs reach by the analytical leg inverse kinematics `physicalSwingReference.pose` already uses (Kajita et al., Section 2.5); the trunk moves with the response's centre of mass less the authored one.

## @evidence contracts/development/implementation.md#efficient-algorithms

One carried copy of the goals and one leg fit per support limb per substep.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalSpanPose.ts#physicalSpanPose

## @evidence contracts/development/common.md#meaningful-documentation

Documents the kinematic selection, the fit's budget, the play window and the hand-back.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The prepared response is held on the binding by its recorded inputs and prepared again only when a restore replaces them.