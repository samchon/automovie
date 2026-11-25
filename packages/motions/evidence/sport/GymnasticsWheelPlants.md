# src/sport/GymnasticsWheelPlants.ts#GymnasticsWheelPlants.IFingers

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The T-shape's two hands in their order of contact.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

World directions given by the law.

# src/sport/GymnasticsWheelPlants.ts#GymnasticsWheelPlants

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the writer.

## @evidence contracts/development/implementation.md#principled-implementation

Each window's laid goal from the carried pose where it came down; at the ends a minimum-jerk weight blends the carried joints toward the laid solve's joints on each joint's rotation (`blendHumanJoint`), the input-pose blend of a skeletal control's weight, so zero weight is the carried pose itself.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Windows, then per limb the heaviest window, then one write.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The laid place is the wheel's own contact point; the fingers are the flat hand's (`HumanHandShape`).

## @evidence contracts/development/implementation.md#efficient-algorithms

One bone FK per window at its start; per written sample, one FK of the limb and, for an arm, one of its hand under a flexed elbow; a blended sample adds one solve of that limb.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The leg goal, the hand target, the hand shape, the joint blend and the pose reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the windows' places.
