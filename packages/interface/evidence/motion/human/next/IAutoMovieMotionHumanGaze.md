# src/motion/human/next/IAutoMovieMotionHumanGaze.ts#IAutoMovieMotionHumanGaze

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

## @evidence contracts/development/design.md#principled-representation

from: Seconds since the action's start from which the head is written. to: Seconds since the action's start until which the head is written. to: Film second the gaze returns to the body's own direction; never when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/glance.ts (glance, recruit); compose/lookPrimitive.ts (lookPrimitive, props); compose/glance.ts (glance, target); everyday/HumanConversation.ts (HumanConversation.gaze, return); everyday/HumanConversation.ts (HumanConversation.share, requests); everyday/HumanConversation.ts (HumanConversation.share, r).

# src/motion/human/next/IAutoMovieMotionHumanGaze.ts#IAutoMovieMotionHumanGaze.Recruit

## @evidence contracts/development/common.md#meaningful-documentation

Which segments a gaze may recruit.

## @evidence contracts/development/design.md#principled-representation

Closed choices "auto", "eyes", "head", "trunk" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanGaze.ts (HumanGaze.split, recruit); everyday/HumanGaze.ts (HumanGaze.aim, recruit); everyday/look.ts (look.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanGaze.split.

# src/motion/human/next/IAutoMovieMotionHumanGaze.ts#IAutoMovieMotionHumanGaze.HeadRecruit

## @evidence contracts/development/common.md#meaningful-documentation

Says what the union decides.

## @evidence contracts/development/design.md#principled-representation

A gaze shift is made by the eyes alone or by the eyes and the head, the two cases the head channel can write.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, read by `look`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A closed literal union; the trunk is not a member because this primitive does not own it.

# src/motion/human/next/IAutoMovieMotionHumanGaze.ts#IAutoMovieMotionHumanGaze.Frame

## @evidence contracts/development/common.md#meaningful-documentation

States each argument, when the function is called and the result's frame and unit.

## @evidence contracts/development/design.md#principled-representation

What is looked at may move or ride on the performer, so it is a function of the posture so far and the time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One function type, taken by both gaze primitives.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fixed point is the constant function, so there is no second form for it.

# src/motion/human/next/IAutoMovieMotionHumanGaze.ts#IAutoMovieMotionHumanGaze.ILook

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, its unit and the range of the weight.

## @evidence contracts/development/design.md#principled-representation

The span the head is written over, what is looked at, which segments join and how far they have gone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members, all read by `look`; `glance` fills them from a clock.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The weight is a function of seconds and not a named easing.

# src/motion/human/next/IAutoMovieMotionHumanGaze.ts#IAutoMovieMotionHumanGaze.ILayer

## @evidence contracts/development/common.md#meaningful-documentation

to: Film second the gaze returns to the body's own direction; never when absent. with: Which segments may join; `auto` when absent.

## @evidence contracts/development/design.md#principled-representation

to: Film second the gaze returns to the body's own direction; never when absent. with: Which segments may join; `auto` when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanConversation.ts (HumanConversation.gaze, return); everyday/HumanConversation.ts (HumanConversation.share, requests); everyday/HumanConversation.ts (HumanConversation.share, r); everyday/HumanGaze.ts (HumanGaze.layer, requests); everyday/HumanGaze.ts (HumanGaze.layer, request); lexicon/HumanPursuit.ts (HumanPursuit.glances, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionHumanGaze.Recruit identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/next/IAutoMovieMotionHumanGaze.ts#IAutoMovieMotionHumanGaze.ISplit

## @evidence contracts/development/common.md#meaningful-documentation

eyes: Eye-in-head direction at the end of the shift. yaw:  pitch:

## @evidence contracts/development/design.md#principled-representation

eyes: Eye-in-head direction at the end of the shift. yaw:  pitch:

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanGaze.ts (HumanGaze.split, return); everyday/HumanGaze.ts (HumanGaze.aim); everyday/HumanGaze.ts (HumanGaze.layer); everyday/look.ts (look.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanGaze.split.

# src/motion/human/next/IAutoMovieMotionHumanGaze.ts#IAutoMovieMotionHumanGaze.IDirectionResult

## @evidence contracts/development/common.md#meaningful-documentation

yaw: Yaw in degrees, positive toward the performer's left. pitch: Pitch in degrees, positive downward.

## @evidence contracts/development/design.md#principled-representation

yaw: Yaw in degrees, positive toward the performer's left. pitch: Pitch in degrees, positive downward.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanGaze.ts (HumanGaze.direction, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanGaze.direction.

# src/motion/human/next/IAutoMovieMotionHumanGaze.ts#IAutoMovieMotionHumanGaze.IAimWeights

## @evidence contracts/development/common.md#meaningful-documentation

eyes: Progress in [0, 1] of the eyes toward its assigned share of the aimed pose. head: Progress in [0, 1] of the head toward its assigned share of the aimed pose. trunk: Progress in [0, 1] of the trunk toward its assigned share of the aimed pose.

## @evidence contracts/development/design.md#principled-representation

eyes: Progress in [0, 1] of the eyes toward its assigned share of the aimed pose. head: Progress in [0, 1] of the head toward its assigned share of the aimed pose. trunk: Progress in [0, 1] of the trunk toward its assigned share of the aimed pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/HumanGaze.ts (HumanGaze.aim, weights).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanGaze.aim.
