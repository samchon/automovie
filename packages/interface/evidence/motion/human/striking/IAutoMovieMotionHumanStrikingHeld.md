# src/motion/human/striking/IAutoMovieMotionHumanStrikingHeld.ts#IAutoMovieMotionHumanStrikingHeld.IPoints

## @evidence contracts/development/common.md#meaningful-documentation

from: The affordance the working line runs from toward `tip`; absent, the point's declared direction supplies the line. Surface normals keep their contact meaning. edge: The affordance whose `+Y` is the edge's direction; absent, any direction square to the axis.

## @evidence contracts/development/design.md#principled-representation

from: The affordance the working line runs from toward `tip`; absent, the point's declared direction supplies the line. Surface normals keep their contact meaning. edge: The affordance whose `+Y` is the edge's direction; absent, any direction square to the axis.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanGraspDemand.ts (HumanGraspDemand.grip, points); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.held, return); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.held, points); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.setup, read); lexicon/HumanWeaponPresent.ts (HumanWeaponPresent.present.s, points); striking/StrikingHeld.ts (StrikingHeld.of, points).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanGraspDemand.grip.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingHeld.ts#IAutoMovieMotionHumanStrikingHeld.ITool

## @evidence contracts/development/common.md#meaningful-documentation

prop: The prop's subject id; absent when the bare hand is the effector. tip: The working point from the grip socket, in the hand bone's frame, metres. length: The working length behind the point along the axis, metres: the distance from an explicit `from`, otherwise the grip's projection behind the tip; 0 for the bare hand.

## @evidence contracts/development/design.md#principled-representation

prop: The prop's subject id; absent when the bare hand is the effector. tip: The working point from the grip socket, in the hand bone's frame, metres. length: The working length behind the point along the axis, metres: the distance from an explicit `from`, otherwise the grip's projection behind the tip; 0 for the bare hand.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: affordance/operateInsert.ts (operateInsert.tool, return); affordance/operateInsert.ts (operateInsert.target, tool); handling/HumanGraspDemand.ts (HumanGraspDemand.grip, return); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.held, return); lexicon/HumanWeaponHeld.ts (HumanWeaponHeld.setup, read); lexicon/HumanWeaponPresent.ts (HumanWeaponPresent.present.s, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanSide, IAutoMovieVector3, IAutoMovieMotionHumanHeld.IHeld, IAutoMovieMotionWieldedTool identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/striking/IAutoMovieMotionHumanStrikingHeld.ts#IAutoMovieMotionHumanStrikingHeld.IHandFrame

## @evidence contracts/development/common.md#meaningful-documentation

point: The grip socket, world metres.

## @evidence contracts/development/design.md#principled-representation

point: The grip socket, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanFirearmReady.ts (HumanFirearmReady.pose, return); lexicon/HumanFirearmReady.ts (HumanFirearmReady.pose.frame, return); lexicon/HumanSword.ts (HumanSword.cut.path, return); lexicon/HumanSwordGuard.ts (HumanSwordGuard.guard, return); lexicon/HumanSwordLanding.ts (HumanSwordLanding.frame, return); lexicon/HumanSwordLanding.ts (HumanSwordLanding.frame.leaning, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
