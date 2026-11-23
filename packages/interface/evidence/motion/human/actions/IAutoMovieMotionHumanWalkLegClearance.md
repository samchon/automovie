# src/motion/human/actions/IAutoMovieMotionHumanWalkLegClearance.ts#IAutoMovieMotionHumanWalkLegClearance

## @evidence contracts/development/common.md#meaningful-documentation

ILeg: a posed leg with its side and its foot's world rotation.

## @evidence contracts/development/design.md#principled-representation

ILeg: the posed leg's joints and bones in world metres and rotations, and the foot's world rotation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/walkLegCapsules.ts (walkLegCapsules.bones, leg); actions/walkLegCapsules.ts (walkLegCapsules.toes, leg); actions/walkLegClearance.ts (walkLegClearance.excess, one); actions/walkLegClearance.ts (walkLegClearance.excess, other); reaction/staggerAdmission.ts (staggerAdmission, legs).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/actions/IAutoMovieMotionHumanWalkLegClearance.ts#IAutoMovieMotionHumanWalkLegClearance.ILeg

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame.

## @evidence contracts/development/design.md#principled-representation

The posed leg's joints and bones, and the foot's world rotation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The posed leg and two members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses `IAutoMovieMotionHumanLegChain.IPosed`.
