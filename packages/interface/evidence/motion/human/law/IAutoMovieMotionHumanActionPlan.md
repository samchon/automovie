# src/motion/human/law/IAutoMovieMotionHumanActionPlan.ts#IAutoMovieMotionHumanActionPlan

## @evidence contracts/development/common.md#meaningful-documentation

duration: Duration, seconds; positive. events: Named instants, shares of the duration. contacts: Contact windows, shares of the duration. from: Share of this action from which the prop is held. from: Share of this action from which the prop is worn. from: Share of this action from which the prop rides the socket.

## @evidence contracts/development/design.md#principled-representation

duration: Duration, seconds; positive. events: Named instants, shares of the duration. contacts: Contact windows, shares of the duration. from: Share of this action from which the prop is held. from: Share of this action from which the prop is worn. from: Share of this action from which the prop rides the socket.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/jump.ts (jump.plan, return); actions/run.ts (run.plan, return); actions/stand.ts (stand.plan, return); actions/support.ts (support.plan, return); actions/walk.ts (walk.plan, return); actions/walk.ts (walk.locomote, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionEvent, IAutoMovieMotionHumanContactWindow, AutoMovieMotionHumanChannelClaim, IAutoMovieMotionHumanBase, IAutoMovieMotionHumanPosture, IAutoMovieHumanoidSurfaces.ITangent identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. The posture's trailing argument is the explicit IAutoMovieMotionHumanEvaluation, so no posture callback has a hidden contextual counterpart.

# src/motion/human/law/IAutoMovieMotionHumanActionPlan.ts#IAutoMovieMotionHumanActionPlan.IPhysicalWindow

## @evidence contracts/development/common.md#meaningful-documentation

States the clock, unit and endpoint rule.

## @evidence contracts/development/design.md#principled-representation

The two event times delimit the part of an action whose outcome requires physical judgement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared by the law that places the phase and the motion audit that judges it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The phase is declared explicitly by its producer without inferring it from poses.
