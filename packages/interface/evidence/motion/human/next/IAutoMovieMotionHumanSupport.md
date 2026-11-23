# src/motion/human/next/IAutoMovieMotionHumanSupport.ts#IAutoMovieMotionHumanSupport

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Support family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/support.ts (support.plan, context); actions/supportWindows.ts (supportWindows.of, context); chain/HumanChainPosture.ts (HumanChainPosture.support, params); actions/support.ts (support.plan.preference, stance); actions/support.ts (support.plan.seed, stance); actions/support.ts (support.plan, stance).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionTarget, IAutoMovieMotionHumanLieDown.IPose identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/next/IAutoMovieMotionHumanSupport.ts#IAutoMovieMotionHumanSupport.IPreset

## @evidence contracts/development/common.md#meaningful-documentation

States what the preset fixes, which presets use it and how the rows read it.

## @evidence contracts/development/design.md#principled-representation

One required member with the planner's own stances, so a preset fixes exactly that key and the composition gives the rest.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This family owns the preset shape; the scramble and slide-off rows read its data.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: the key is named once here instead of an inline pick of the planner's parameters.

# src/motion/human/next/IAutoMovieMotionHumanSupport.ts#IAutoMovieMotionHumanSupport.IRow

## @evidence contracts/development/common.md#meaningful-documentation

Names what a row of `support` still takes.

## @evidence contracts/development/design.md#principled-representation

The planner's parameters less the one key a preset fixes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Serves the support rows' parameter map.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: a named derivation of `IParams`, written once.

# src/motion/human/next/IAutoMovieMotionHumanSupport.ts#IAutoMovieMotionHumanSupport.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The member states its meaning.

## @evidence contracts/development/design.md#principled-representation

The stances in order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One member read by `plan`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No posture is typed.

# src/motion/human/next/IAutoMovieMotionHumanSupport.ts#IAutoMovieMotionHumanSupport.AssistRole

## @evidence contracts/development/common.md#meaningful-documentation

The helper receives the other person's weight and the helped person moves from seated support to the feet.

## @evidence contracts/development/design.md#principled-representation

Each role has distinct support keys and the roles use the same hand-contact course.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Support uses the role only when an action declares an assisted rise.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The role changes the authored stance, not the reach or refusal allowance.

# src/motion/human/next/IAutoMovieMotionHumanSupport.ts#IAutoMovieMotionHumanSupport.IAssist

## @evidence contracts/development/common.md#meaningful-documentation

Names the support roles, participating subject and the side of both hands.

## @evidence contracts/development/design.md#principled-representation

The concrete keyed hand course arises from the two rendered bodies; author parameters only identify its participants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanCoupled.helpUp authors the paired roles and the support plan reads them together once.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The action's own contact windows and reach constraints still apply.

# src/motion/human/next/IAutoMovieMotionHumanSupport.ts#IAutoMovieMotionHumanSupport.IStance

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

A set of contacts and the time the move into it takes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by the support law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No posture is typed: the planner solves it from the contacts.

# src/motion/human/next/IAutoMovieMotionHumanSupport.ts#IAutoMovieMotionHumanSupport.IContact

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

A part on a target, bearing or gripping.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members, all read by the support law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The target is the shared target union.

# src/motion/human/next/IAutoMovieMotionHumanSupport.ts#IAutoMovieMotionHumanSupport.Part

## @evidence contracts/development/common.md#meaningful-documentation

A body part that bears: a foot on its ball and toes, a hand on its palm, a knee on the shin's top, the seat on the buttocks, the back or the front of the trunk lying on it.

## @evidence contracts/development/design.md#principled-representation

Closed choices "leftFoot", "rightFoot", "leftHand", "rightHand", "leftKnee", "rightKnee", "seat", "back", "front" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/supportContact.ts (supportContact.window, part); actions/supportContact.ts (supportContact.limb, part); actions/supportContact.ts (supportContact.onFloors, parts);floor/getUp.ts (getUp.plan.stances, part); lexicon/HumanSupportRows.ts (on, part).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in supportContact.window.
