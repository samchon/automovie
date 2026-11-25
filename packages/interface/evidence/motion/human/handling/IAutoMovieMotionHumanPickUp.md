# src/motion/human/handling/IAutoMovieMotionHumanPickUp.ts#IAutoMovieMotionHumanPickUp.Along

## @evidence contracts/development/common.md#meaningful-documentation

States the share's ends, its middle and its axis.

## @evidence contracts/development/design.md#principled-representation

A dimensionless share of the affordance's own band (`IAutoMovieAffordance.length`), along its own wrapped axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One number, read by the pick up's grasp target.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No metre offset is assumed: the band's length is the prop's.

# src/motion/human/handling/IAutoMovieMotionHumanPickUp.ts#IAutoMovieMotionHumanPickUp.IParams

## @evidence contracts/development/common.md#meaningful-documentation

hand: The grasping hand; `right` when absent. lift: How far the wrist rises after the grasp, metres; 0 when the other hand already holds the prop, otherwise 0.1 when absent. A steadying hand cannot lift independently. use: What the prop is taken up for, when it is a tool: the grasp is then chosen for the use and not only for the reach. A handle can be wrapped from any side, and the side the hanging arm reaches most easily leaves a blade or a barrel where the wrist cannot later aim it. With a use, the grasp must also hold with the tool presented ahead of the shoulder on the line the use names, and a handle no grasp serves so is refused. Absent, the grasp is chosen for the reach and the lift alone.

## @evidence contracts/development/design.md#principled-representation

hand: The grasping hand; `right` when absent. lift: How far the wrist rises after the grasp, metres; 0 when the other hand already holds the prop, otherwise 0.1 when absent. A steadying hand cannot lift independently. use: What the prop is taken up for, when it is a tool: the grasp is then chosen for the use and not only for the reach. A handle can be wrapped from any side, and the side the hanging arm reaches most easily leaves a blade or a barrel where the wrist cannot later aim it. With a use, the grasp must also hold with the tool presented ahead of the shoulder on the line the use names, and a handle no grasp serves so is refused. Absent, the grasp is chosen for the reach and the lift alone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainMutual.ts (HumanChainMutual.pickUp, params); handling/pickUp.ts (pickUp.plan, context); handling/pickUpSearch.ts (pickUpSearch.of, context); handling/pickUpStance.ts (pickUpStance.of, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanSide, IAutoMovieMotionHumanGraspUse.IUse identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
