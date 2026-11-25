# src/motion/human/handling/IAutoMovieMotionHumanGrasp.ts#IAutoMovieMotionHumanGrasp.ITarget

## @evidence contracts/development/common.md#meaningful-documentation

point: The grip point, world metres. width: The grasped width, metres.

## @evidence contracts/development/design.md#principled-representation

point: The grip point, world metres. width: The grasped width, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanGrasp.ts (HumanGrasp.target, return); handling/HumanGrasp.ts (HumanGrasp.at, return); handling/HumanGrasp.ts (HumanGrasp.hand, target); handling/HumanGrasp.ts (HumanGrasp.around, target); handling/HumanGrasp.ts (HumanGrasp.around, return); handling/HumanGraspReach.ts (HumanGraspReach.around, target).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, AutoMovieGripKind, IAutoMovieCurlChainUntilContact.ICollider identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/handling/IAutoMovieMotionHumanGrasp.ts#IAutoMovieMotionHumanGrasp.IKey

## @evidence contracts/development/common.md#meaningful-documentation

bend: The elbow hint at the key, world metres. judge: How far what the key places strays from its place once the arm is fitted to the key within its ranges, metres: a held tool's working point off where its use asks it, a worn thing's socket off its region. Absent, the key places nothing but the hand. bound: The most the judgement may be, metres: the bound the action that asks the key holds the pose to. The caller's own bound when absent.

## @evidence contracts/development/design.md#principled-representation

bend: The elbow hint at the key, world metres. judge: How far what the key places strays from its place once the arm is fitted to the key within its ranges, metres: a held tool's working point off where its use asks it, a worn thing's socket off its region. Absent, the key places nothing but the hand. bound: The most the judgement may be, metres: the bound the action that asks the key holds the pose to. The caller's own bound when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanClasp.ts (HumanClasp.choose.fits, return); handling/HumanGrasp.ts (HumanGrasp.reachable, stroke); handling/HumanGraspDemand.ts (HumanGraspDemand.key, return); handling/HumanGraspSearch.ts (HumanGraspSearch, stroke); handling/HumanGraspSearch.ts (HumanGraspSearch.fit, key); handling/HumanGraspUse.ts (HumanGraspUse.presented, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanHand.IWrist, IAutoMovieVector3, AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/handling/IAutoMovieMotionHumanGrasp.ts#IAutoMovieMotionHumanGrasp.IReach

## @evidence contracts/development/common.md#meaningful-documentation

turn: Degrees of the chosen turn. tilt: Degrees of the chosen tilt. miss: The error the arm leaves over the grasp and its stroke: degrees of rotation plus millimetres of position.

## @evidence contracts/development/design.md#principled-representation

turn: Degrees of the chosen turn. tilt: Degrees of the chosen tilt. miss: The error the arm leaves over the grasp and its stroke: degrees of rotation plus millimetres of position.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanClasp.ts (HumanClasp.choose.fits, return); handling/HumanClasp.ts (HumanClasp.choose.aBones, r); handling/HumanClasp.ts (HumanClasp.choose.bBones, r); handling/HumanClasp.ts (HumanClasp.choose.admitted, reaches); handling/HumanClasp.ts (HumanClasp.choose.admitted.all, _); handling/HumanGrasp.ts (HumanGrasp.reachable, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanHand.IWrist, IAutoMovieHumanLimbReference, IAutoMoviePose identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/handling/IAutoMovieMotionHumanGrasp.ts#IAutoMovieMotionHumanGrasp.IReachableRequired

## @evidence contracts/development/common.md#meaningful-documentation

measure: Synchronous candidate score over aligned grasp-then-stroke arrays. keys contains the existing composite degree/millimetre arm-fit scores; judged and bounds are metres, with NaN where no explicit judge/bound exists (including the first grasp). The caller defines score units and must handle sentinels and validity. Its result is compared with bound; callback exceptions propagate, and the borrowed arrays are call-local.

## @evidence contracts/development/design.md#principled-representation

measure: Synchronous candidate score over aligned grasp-then-stroke arrays. keys contains the existing composite degree/millimetre arm-fit scores; judged and bounds are metres, with NaN where no explicit judge/bound exists (including the first grasp). The caller defines score units and must handle sentinels and validity. Its result is compared with bound; callback exceptions propagate, and the borrowed arrays are call-local.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanGrasp.ts (HumanGrasp.reachable, required).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanGrasp.reachable.
