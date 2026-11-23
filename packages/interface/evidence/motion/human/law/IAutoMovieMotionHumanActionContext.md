# src/motion/human/law/IAutoMovieMotionHumanActionContext.ts#IAutoMovieMotionHumanActionContext

## @evidence contracts/development/common.md#meaningful-documentation

attributes: The performer's group attributes (`IAutoMovieMotionHumanPerformer.attributes`), each in [0, 1]; an attribute absent, or the whole record absent, reads as its neutral value. start: Film second of the action's time zero. tempo: A factor on every span of the action that physics does not fix, over its manner's own tempo (`AutoMovieMotionManner.of`): 1 when absent, and more where the action is replanned to take the time its planned motion needs within the speed bound (Hollerbach 1984's time scaling, applied where the action is placed). support: What the carrier stands on when it is not the ground: the first prop its plan plants a foot on (a stance on a cart's bed), so an overlay that begins with it is carried by that prop (`HumanSupportFrame`). Absent on the ground. start: Film second of its law's time zero. posture: Their placed posture at a film second, read under the same rule as `root`: the posture their active action writes, before layers and the decaying offset of a cut. An instanced member displays it moved (`instance`). Absent where the context reads no placed path.

## @evidence contracts/development/design.md#principled-representation

attributes: The performer's group attributes (`IAutoMovieMotionHumanPerformer.attributes`), each in [0, 1]; an attribute absent, or the whole record absent, reads as its neutral value. start: Film second of the action's time zero. tempo: A factor on every span of the action that physics does not fix, over its manner's own tempo (`AutoMovieMotionManner.of`): 1 when absent, and more where the action is replanned to take the time its planned motion needs within the speed bound (Hollerbach 1984's time scaling, applied where the action is placed). support: What the carrier stands on when it is not the ground: the first prop its plan plants a foot on (a stance on a cart's bed), so an overlay that begins with it is carried by that prop (`HumanSupportFrame`). Absent on the ground. start: Film second of its law's time zero. posture: Their placed posture at a film second, read under the same rule as `root`: the posture their active action writes, before layers and the decaying offset of a cut. An instanced member displays it moved (`instance`). Absent where the context reads no placed path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/jump.ts (jump.plan, context); actions/run.ts (run.plan, context); actions/stand.ts (stand.plan, context); actions/support.ts (support.plan, context); actions/supportWindows.ts (supportWindows.of, context); actions/walk.ts (walk.plan, context).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanBody, IAutoMovieMotionHumanSkill identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical AutoMovieMotionHumanActionKey, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanContactWindow.Support, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanBody identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanActionContext.ts#IAutoMovieMotionHumanActionContext.Instant

## @evidence contracts/development/common.md#meaningful-documentation

States the admitted sources and output timebase.

## @evidence contracts/development/design.md#principled-representation

Reuses the scheduled instant representation, with numeric film time as the result.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Balance calls the existing performance resolver through the action context.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No duration share substitutes for the foreign named event.

# src/motion/human/law/IAutoMovieMotionHumanActionContext.ts#IAutoMovieMotionHumanActionContext.ICarrier

## @evidence contracts/development/common.md#meaningful-documentation

support: What the carrier stands on when it is not the ground: the first prop its plan plants a foot on (a stance on a cart's bed), so an overlay that begins with it is carried by that prop (`HumanSupportFrame`). Absent on the ground.

## @evidence contracts/development/design.md#principled-representation

support: What the carrier stands on when it is not the ground: the first prop its plan plants a foot on (a stance on a cart's bed), so an overlay that begins with it is carried by that prop (`HumanSupportFrame`). Absent on the ground.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanBase.ts (AutoMovieMotionHumanBase.under).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieMotionHumanActionKey, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanContactWindow.Support identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanActionContext.ts#IAutoMovieMotionHumanActionContext.IRoot

## @evidence contracts/development/common.md#meaningful-documentation

position: The root, world metres. yaw: The heading, degrees about +Y with 0 facing +Z.

## @evidence contracts/development/design.md#principled-representation

position: The root, world metres. yaw: The heading, degrees about +Y with 0 facing +Z.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/walkStation.ts (walkStation.point.read, return); perform/HumanPerformancePlace.ts (HumanPerformancePlace.place.context, return); perform/HumanPerformanceRead.ts (HumanPerformanceRead.root, return); ensemble/HumanFormation.ts (HumanFormation.frame); everyday/approach.ts (approach.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanActionContext.ts#IAutoMovieMotionHumanActionContext.IPartner

## @evidence contracts/development/common.md#meaningful-documentation

role: Their role's name within the kind. subject: Their subject id.

## @evidence contracts/development/design.md#principled-representation

role: Their role's name within the kind. subject: Their subject id.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanPerformanceMeeting.ts (HumanPerformanceMeeting.reader, partner); perform/HumanPerformanceMeeting.ts (HumanPerformanceMeeting.reader.key, other); perform/HumanPerformanceMeeting.ts (HumanPerformanceMeeting.reader.meeting, other); perform/HumanPerformanceMeeting.ts (HumanPerformanceMeeting.reader).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanPerformanceMeeting.reader.

# src/motion/human/law/IAutoMovieMotionHumanActionContext.ts#IAutoMovieMotionHumanActionContext.ISeries

## @evidence contracts/development/common.md#meaningful-documentation

random: The stream, the same for every instance of the action's id. index: Which occurrence of the action's id in the performer's chain this is, from 0.

## @evidence contracts/development/design.md#principled-representation

random: The stream, the same for every instance of the action's id. index: Which occurrence of the action's id in the performer's chain this is, from 0.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanVariation.ts (AutoMovieMotionHumanVariation.of, return); compose/AutoMovieMotionHumanVariationDraw.ts (AutoMovieMotionHumanVariationDraw.uniforms, draws); compose/AutoMovieMotionHumanVariationDraw.ts (AutoMovieMotionHumanVariationDraw.normals, draws); compose/AutoMovieMotionHumanVariationDraw.ts (AutoMovieMotionHumanVariationDraw.disc, draws); perform/HumanPerformancePlace.ts (HumanPerformancePlace.place.context, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieRandom identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanActionContext.ts#IAutoMovieMotionHumanActionContext.ICut

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it is; exactly one of `event` and `share` is present.

## @evidence contracts/development/design.md#principled-representation

The composition's own cut (`IAutoMovieIntent.until`) in this action's terms, and the next law's own plant declaration.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, what an action reads to prepare the next one's entry; built by `HumanPerformanceAhead.cut`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No action is named: the plant is the next law's declaration, read from its resolved parameters.

# src/motion/human/law/IAutoMovieMotionHumanActionContext.ts#IAutoMovieMotionHumanActionContext.IHandover

## @evidence contracts/development/common.md#meaningful-documentation

States what each member holds and who reads and writes it.

## @evidence contracts/development/design.md#principled-representation

The solutions are the planner's own handover records (`IAutoMovieMotionHumanArmPlanned.IWarm`), keyed as its groups key them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the last plan wrote, read; what this plan writes, filled. The performance owns both, per action.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No verdict, pose or trajectory is handed on: a solution starts a solve that admits its own result, so a stale one costs time, never a wrong plan.
