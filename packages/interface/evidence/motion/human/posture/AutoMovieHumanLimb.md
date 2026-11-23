# src/motion/human/posture/AutoMovieHumanLimb.ts#AutoMovieHumanLimb

## @evidence contracts/development/common.md#meaningful-documentation

An anatomical limb identified by the performer's own side. Motion channel ownership, limb goals and posture fitting use this closed vocabulary.

## @evidence contracts/development/design.md#principled-representation

Closed choices "leftArm", "rightArm", "leftLeg", "rightLeg" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Action goals, channel claims and resolveHumanPosture use the same four anatomical limb identifiers; Human calibration objects remain separate contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literal union is independent of HumanPosture's runtime LIMBS value. Runtime posture fitting owns reach and attachment refusal, not this vocabulary.
