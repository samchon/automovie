# src/motion/human/posture/IAutoMovieMotionHumanPosture.ts#IAutoMovieMotionHumanPosture

## @evidence contracts/development/common.md#meaningful-documentation

root: The rig origin, world metres. yaw: Heading about +Y, degrees; 0 faces +Z. pitch: Forward tip of the whole body about its turned left axis, degrees. point: Where the end joint (wrist or ankle) goes, world metres. elbow: Where an arm's elbow goes when the law leaves it to the body: `"strain"` takes, among the places that leave the hand's rotation error least, the one where the arm strains least, read from the fit's own sweep (`AutoMovieMotionHumanBend.strainOf`), with `bend` serving only where no place is legal. Absent, `bend` decides; a leg ignores it. contact: The contact the hand or foot turns about, in its rest frame relative to its joint (a heel, a ball, a palm): when `rotation` cannot be met exactly within the limb's range, the end joint is re-aimed so this point stays where the goal puts it, and the rotation gives way, as a foot pivots on its ball.

## @evidence contracts/development/design.md#principled-representation

root: The rig origin, world metres. yaw: Heading about +Y, degrees; 0 faces +Z. pitch: Forward tip of the whole body about its turned left axis, degrees. point: Where the end joint (wrist or ankle) goes, world metres. elbow: Where an arm's elbow goes when the law leaves it to the body: `"strain"` takes, among the places that leave the hand's rotation error least, the one where the arm strains least, read from the fit's own sweep (`AutoMovieMotionHumanBend.strainOf`), with `bend` serving only where no place is legal. Absent, `bend` decides; a leg ignores it. contact: The contact the hand or foot turns about, in its rest frame relative to its joint (a heel, a ball, a palm): when `rotation` cannot be met exactly within the limb's range, the end joint is re-aimed so this point stays where the goal puts it, and the rotation gives way, as a foot pivots on its ball.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/jump.ts (jump.plan.offset, posture); actions/jump.ts (jump.plan.flightPosture, return); actions/jump.ts (jump.plan, return); actions/jumpAirborne.ts (jumpAirborne.posture, return); actions/jumpAirborne.ts (jumpAirborne.turning, posture); actions/jumpAirborne.ts (jumpAirborne.turning, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, AutoMovieHumanoidBone, IAutoMovieMotionHumanColliders.IPlaced identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
