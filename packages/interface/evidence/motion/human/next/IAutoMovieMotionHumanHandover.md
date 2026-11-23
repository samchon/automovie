# src/motion/human/next/IAutoMovieMotionHumanHandover.ts#IAutoMovieMotionHumanHandover

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Handover family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Handover laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanHandover.ts#IAutoMovieMotionHumanHandover.Outcome

## @evidence contracts/development/common.md#meaningful-documentation

Plan a handover. How the handover ends.

## @evidence contracts/development/design.md#principled-representation

Closed choices "transfer", "withdraw", "decline" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanHandover.ts (HumanHandover.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in HumanHandover.plan.

# src/motion/human/next/IAutoMovieMotionHumanHandover.ts#IAutoMovieMotionHumanHandover.IPerson

## @evidence contracts/development/common.md#meaningful-documentation

body: The body. side: The acting hand. bones: The person's displayed world bones at the start.

## @evidence contracts/development/design.md#principled-representation

body: The body. side: The acting hand. bones: The person's displayed world bones at the start.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanHandover.ts (HumanHandover.plan.hand, bones); handling/HumanHandoverMeeting.ts (HumanHandoverMeeting.goal.sternum, person); handling/HumanHandoverMeeting.ts (HumanHandoverMeeting.kind.person, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieResolvedBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/next/IAutoMovieMotionHumanHandover.ts#IAutoMovieMotionHumanHandover.IInput

## @evidence contracts/development/common.md#meaningful-documentation

mass: The prop's mass, kilograms; 0.09 when absent. outcome: The outcome; `transfer` when absent. meet: Where the receiving grip is handed over, world metres, as the partners' meeting places it (`HumanHandoverMeeting`); the standing pair's mutual goal when absent.

## @evidence contracts/development/design.md#principled-representation

mass: The prop's mass, kilograms; 0.09 when absent. outcome: The outcome; `transfer` when absent. meet: Where the receiving grip is handed over, world metres, as the partners' meeting places it (`HumanHandoverMeeting`); the standing pair's mutual goal when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanHandover.ts (HumanHandover.plan, input); handling/HumanHandoverMeeting.ts (HumanHandoverMeeting.goal, input).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanHandover.IPerson, IAutoMovieMotionHumanProp, IAutoMovieRigidTransform, IAutoMovieMotionHumanHandover.Outcome, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/next/IAutoMovieMotionHumanHandover.ts#IAutoMovieMotionHumanHandover.IPlan

## @evidence contracts/development/common.md#meaningful-documentation

transfer: Both hands' shared hold.

## @evidence contracts/development/design.md#principled-representation

transfer: Both hands' shared hold.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: handling/HumanHandover.ts (HumanHandover.plan, return); handling/handOver.ts (handOver.plan); handling/receive.ts (receive.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanHandover.Outcome, IAutoMovieMotionHumanHand.IWrist, IAutoMovieRigidTransform, IAutoMovieMotionHumanGrasp.ITarget, IAutoMovieHumanLimbReference identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
