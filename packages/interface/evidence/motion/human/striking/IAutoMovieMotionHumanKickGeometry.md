# src/motion/human/striking/IAutoMovieMotionHumanKickGeometry.ts#IAutoMovieMotionHumanKickGeometry

## @evidence contracts/development/common.md#meaningful-documentation

origin: The kicking ankle at the launch, world metres. back: The kicking ankle at the replant, world metres. contacts: The feet's contact windows, as shares of the kick's full duration. start: Film second of its time zero. turn: The pelvis's turn about the vertical from the entry heading, degrees. lean: The whole body's tilt away from the target about the support hip, degrees.

## @evidence contracts/development/design.md#principled-representation

origin: The kicking ankle at the launch, world metres. back: The kicking ankle at the replant, world metres. contacts: The feet's contact windows, as shares of the kick's full duration. start: Film second of its time zero. turn: The pelvis's turn about the vertical from the entry heading, degrees. lean: The whole body's tilt away from the target about the support hip, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/kick.ts (kick.plan.geometry, return); striking/KickGeometry.ts (KickGeometry.build, return); striking/KickGeometry.ts (KickGeometry.compose, parts); striking/KickGeometry.ts (KickGeometry.compose, return); striking/KickRedirect.ts (KickRedirect.build, return); striking/kick.ts (kick.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanPosture, IAutoMovieVector3, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanStrikingRecord.IRecord identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical IAutoMovieMotionHumanKick.IParams, IAutoMovieMotionHumanActionContext, IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/striking/IAutoMovieMotionHumanKickGeometry.ts#IAutoMovieMotionHumanKickGeometry.ISource

## @evidence contracts/development/common.md#meaningful-documentation

start: Film second of its time zero.

## @evidence contracts/development/design.md#principled-representation

start: Film second of its time zero.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/kick.ts (kick.redirected, return); striking/KickRedirect.ts (KickRedirect.build, source); striking/kick.ts (kick.plan); striking/kick.ts (kick.redirected).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanKickGeometry.ITiming, IAutoMovieMotionHumanKickGeometry, IAutoMovieMotionHumanKick.IParams, IAutoMovieMotionHumanActionContext identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/striking/IAutoMovieMotionHumanKickGeometry.ts#IAutoMovieMotionHumanKickGeometry.ITiming

## @evidence contracts/development/common.md#meaningful-documentation

side: The kicking side. lead: The stance's lead side. prep: The preparation's end: the launch of the knee.

## @evidence contracts/development/design.md#principled-representation

side: The kicking side. lead: The stance's lead side. prep: The preparation's end: the launch of the knee.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/kick.ts (kick.measure, return); striking/KickGeometry.ts (KickGeometry.build, timing); striking/KickGeometry.ts (KickGeometry.compose, timing); striking/KickGeometry.ts (KickGeometry.windows, timing); striking/kick.ts (kick.plan); striking/KickCarriage.ts (KickCarriage).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in kick.measure.

# src/motion/human/striking/IAutoMovieMotionHumanKickGeometry.ts#IAutoMovieMotionHumanKickGeometry.ICarriage

## @evidence contracts/development/common.md#meaningful-documentation

turn: The pelvis's turn about the vertical from the entry heading, degrees. lean: The whole body's tilt away from the target about the support hip, degrees. pitch: The body's forward tip added to the entry's, degrees.

## @evidence contracts/development/design.md#principled-representation

turn: The pelvis's turn about the vertical from the entry heading, degrees. lean: The whole body's tilt away from the target about the support hip, degrees. pitch: The body's forward tip added to the entry's, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/KickCarriage.ts (KickCarriage.posture, carriage); striking/KickContact.ts (KickContact.choose, set); striking/KickContact.ts (KickContact.choose.under, carriage); striking/KickGeometry.ts (KickGeometry.build, shown); striking/KickPlans.ts (KickPlans.create, return); striking/KickPlans.ts (KickPlans.create, c).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in KickCarriage.posture.

# src/motion/human/striking/IAutoMovieMotionHumanKickGeometry.ts#IAutoMovieMotionHumanKickGeometry.ILeg

## @evidence contracts/development/common.md#meaningful-documentation

ankle: The ankle joint, world metres. hint: The knee's bend hint, world metres.

## @evidence contracts/development/design.md#principled-representation

ankle: The ankle joint, world metres. hint: The knee's bend hint, world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/KickPlans.ts (KickPlans.create, return); striking/KickRedirect.ts (KickRedirect.build, return); striking/KickSwing.ts (KickSwing.create, return); striking/KickGeometry.ts (KickGeometry); striking/KickPlans.ts (KickPlans); striking/KickPlans.ts (KickPlans.create).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/striking/IAutoMovieMotionHumanKickGeometry.ts#IAutoMovieMotionHumanKickGeometry.IKept

## @evidence contracts/development/common.md#meaningful-documentation

step: The source's step-up, metres. drive: The source's pelvis drive, metres.

## @evidence contracts/development/design.md#principled-representation

step: The source's step-up, metres. drive: The source's pelvis drive, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: striking/KickGeometry.ts (KickGeometry.build, kept).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
