# src/motion/human/handling/IAutoMovieMotionHumanHeldUse.ts#IAutoMovieMotionHumanHeldUse.IGrasp

## @evidence contracts/development/common.md#meaningful-documentation

handle: The handle the tool was taken by. line: The line its use names (`IAutoMovieMotionHumanGraspUse.IUse.line`).

## @evidence contracts/development/design.md#principled-representation

handle: The handle the tool was taken by. line: The line its use names (`IAutoMovieMotionHumanGraspUse.IUse.line`).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanHeldUse.ts (HumanHeldUse.key, grasp).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanGraspUse.IUse identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/handling/IAutoMovieMotionHumanHeldUse.ts#IAutoMovieMotionHumanHeldUse.IKept

## @evidence contracts/development/common.md#meaningful-documentation

prop: The held prop's subject id. point: The prop's working point, one of its affordance ids. grasp: The grasp the prop was taken up by for its use.

## @evidence contracts/development/design.md#principled-representation

prop: The held prop's subject id. point: The prop's working point, one of its affordance ids. grasp: The grasp the prop was taken up by for its use.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanHeldUse.ts (HumanHeldUse.kept, kept).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanHeldUse.IGrasp identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/handling/IAutoMovieMotionHumanHeldUse.ts#IAutoMovieMotionHumanHeldUse.ISecondProps

## @evidence contracts/development/common.md#meaningful-documentation

context: Borrowed action body, entry and subject/prop resolvers for the assisting hand. clock: Action-relative clock shared with the primary hand's use. goal: Retained synchronous callback for the PRIMARY hand's goal at a displayed posture and action-relative second. This goal places the tool and thus the assisting handle; exceptions propagate during evaluation.

## @evidence contracts/development/design.md#principled-representation

context: Borrowed action body, entry and subject/prop resolvers for the assisting hand. clock: Action-relative clock shared with the primary hand's use. goal: Retained synchronous callback for the PRIMARY hand's goal at a displayed posture and action-relative second. This goal places the tool and thus the assisting handle; exceptions propagate during evaluation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanHeldUse.ts (HumanHeldUse.second, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanActionContext, IAutoMovieMotionClock, AutoMovieHumanSide, IAutoMovieMotionHumanGrasp.IKey, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
