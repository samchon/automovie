# src/motion/human/handling/IAutoMovieMotionHumanGraspUse.ts#IAutoMovieMotionHumanGraspUse.IUse

## @evidence contracts/development/common.md#meaningful-documentation

line: How the tool's line lies to the forearm when it is presented: `forearm` continues it, as a pistol's bore and a thrusting point do; `oblique` rises 45 degrees from it, a sabre grip across the palm; `square` stands upright on it, a hammer grip; `across` runs level across the body toward the other hand, as a camera or a bar held in both hands lies, whatever the place; `along` lays the tool along the surface of its place with the working point's own face on it, as a razor lies on the jaw or a comb on the scalp, its way along the surface the hand's own (a place on the body only); `worn` puts the thing on that place as it is worn (`HumanWorn.frame`), the whole frame of its `wear` socket on the region, as a hat goes on the crown or spectacles on the nose (a region only). round: For a thing `worn` round about the region's normal, as a hat about the crown, that its turn about it is free: the grasp holds at whichever turn suits it; spectacles are not, and stay facing the body's way. False when absent. at: Where the tool is used, which is where the grasp must also hold: `ahead` presents it ahead of the shoulder, as a blade or a barrel is aimed; `mouth` brings its working point to the performer's own mouth, as a vessel's lip is drunk from; a `region` brings it to that named region of the performer's own body, as a razor's edge is laid on the jaw or a comb on the scalp. `ahead` when absent. At the mouth or a region the level part of the line runs from the hand back into the body (a cigarette's or a spoon's `forearm` line points at the lips), and `square` stays upright.

## @evidence contracts/development/design.md#principled-representation

line: How the tool's line lies to the forearm when it is presented: `forearm` continues it, as a pistol's bore and a thrusting point do; `oblique` rises 45 degrees from it, a sabre grip across the palm; `square` stands upright on it, a hammer grip; `across` runs level across the body toward the other hand, as a camera or a bar held in both hands lies, whatever the place; `along` lays the tool along the surface of its place with the working point's own face on it, as a razor lies on the jaw or a comb on the scalp, its way along the surface the hand's own (a place on the body only); `worn` puts the thing on that place as it is worn (`HumanWorn.frame`), the whole frame of its `wear` socket on the region, as a hat goes on the crown or spectacles on the nose (a region only). round: For a thing `worn` round about the region's normal, as a hat about the crown, that its turn about it is free: the grasp holds at whichever turn suits it; spectacles are not, and stay facing the body's way. False when absent. at: Where the tool is used, which is where the grasp must also hold: `ahead` presents it ahead of the shoulder, as a blade or a barrel is aimed; `mouth` brings its working point to the performer's own mouth, as a vessel's lip is drunk from; a `region` brings it to that named region of the performer's own body, as a razor's edge is laid on the jaw or a comb on the scalp. `ahead` when absent. At the mouth or a region the level part of the line runs from the hand back into the body (a cigarette's or a spoon's `forearm` line points at the lips), and `square` stays upright.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanGraspUse.ts (HumanGraspUse.RISE).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidRegion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/handling/IAutoMovieMotionHumanGraspUse.ts#IAutoMovieMotionHumanGraspUse.IPresentedProps

## @evidence contracts/development/common.md#meaningful-documentation

context: Borrowed action body, entry, prop resolver and performance start used to solve presentation.

## @evidence contracts/development/design.md#principled-representation

context: Borrowed action body, entry, prop resolver and performance start used to solve presentation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanGraspUse.ts (HumanGraspUse.presented, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanActionContext, AutoMovieHumanSide, IAutoMovieMotionHumanHand.IWrist, IAutoMovieMotionHumanGraspUse.IUse identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
