# src/motion/human/perform/IAutoMovieMotionHumanProp.ts#IAutoMovieMotionHumanProp

## @evidence contracts/development/common.md#meaningful-documentation

points: Named points in the prop's frame, metres, with outward unit normals. worn: The person and bone the prop is worn on from the film's start, with its frame in the bone's posed frame: a hat on the head, a holster on the hips. While worn it rides that bone and `frame` is not read; a grip takes it off, and an action's `wears` puts it on again. Not worn when absent. fixed: Whether the prop is a fixture: a thing set in the scene that bears on the floor or a wall and is never lifted, such as a ladder, a rail or a wall bar. A hand that grips a fixture bears on it, as a climber's hand on a rung, and never carries it, so it stays at its rest frame whatever grips it. Not a fixture when absent. position: Origin, world metres. offset: The prop's frame in the bone's posed frame, metres. shapes: Its colliders, with the moved parts' colliders moved; absent when the prop declares none.

## @evidence contracts/development/design.md#principled-representation

points: Named points in the prop's frame, metres, with outward unit normals. worn: The person and bone the prop is worn on from the film's start, with its frame in the bone's posed frame: a hat on the head, a holster on the hips. While worn it rides that bone and `frame` is not read; a grip takes it off, and an action's `wears` puts it on again. Not worn when absent. fixed: Whether the prop is a fixture: a thing set in the scene that bears on the floor or a wall and is never lifted, such as a ladder, a rail or a wall bar. A hand that grips a fixture bears on it, as a climber's hand on a rung, and never carries it, so it stays at its rest frame whatever grips it. Not a fixture when absent. position: Origin, world metres. offset: The prop's frame in the bone's posed frame, metres. shapes: Its colliders, with the moved parts' colliders moved; absent when the prop declares none.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: dressing/HumanWorn.ts (HumanWorn.frame, prop); executable/cases/ballStrikeCases.ts (ball, return); executable/cases/climbCases.ts (ladderProp, return); executable/cases/dressCases.ts (wearable, return); executable/cases/everydayCaseKit.ts (everydayCaseKit.one, props); executable/cases/everydayCaseKit.ts (everydayCaseKit.perform, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieAffordance, IAutoMovieSoftBodyDomain, IAutoMoviePhysicalShape identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, AutoMovieHumanoidBone, IAutoMovieAffordance, IAutoMoviePhysicalShape, AutoMovieMotionHumanScheduledInstant identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanProp.ts#IAutoMovieMotionHumanProp.ISoftSpan

## @evidence contracts/development/common.md#meaningful-documentation

States the two identities, the length in metres and the first/last particle meaning.

## @evidence contracts/development/design.md#principled-representation

This record selects one model span whose endpoints are resolved at the soft domain's fixed-step boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanObject.cord supplies the binding and the performance soft boundary reads it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The cord does not redeclare any articulation, endpoint coordinates or frame callback.

# src/motion/human/perform/IAutoMovieMotionHumanProp.ts#IAutoMovieMotionHumanProp.IPlacedPoint

## @evidence contracts/development/common.md#meaningful-documentation

States the frame of the point and normal and when full orientation is available.

## @evidence contracts/development/design.md#principled-representation

Preserves the existing world point and normal records; the world rotation carries the grip tangent of a moving affordance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanObject.prop supplies the rotation when its callback has a full contact transform; HumanRideHands reads its grip axis.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A point-only provider can omit the rotation; no rotation is inferred from a normal that leaves its tangent undetermined.

# src/motion/human/perform/IAutoMovieMotionHumanProp.ts#IAutoMovieMotionHumanProp.IWorn

## @evidence contracts/development/common.md#meaningful-documentation

offset: The prop's frame in the bone's posed frame, metres.

## @evidence contracts/development/design.md#principled-representation

offset: The prop's frame in the bone's posed frame, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanPerformanceRead.ts (HumanPerformanceRead.grips); throwing/HumanGlove.ts (HumanGlove.pocket).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone, IAutoMovieRigidTransform identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanProp.ts#IAutoMovieMotionHumanProp.IMounted

## @evidence contracts/development/common.md#meaningful-documentation

Names the carrier's prop and socket and defines the child's offset from the posed socket in metres and a unit quaternion.

## @evidence contracts/development/design.md#principled-representation

A prop id and its affordance id identify a rigid frame. The offset expresses the child frame in that socket, which can be posed by its own articulation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two references and a shared rigid transform let the existing mount reader serve initial and action-authored placement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The authored relative frame is explicit. HumanPerformance checks references, authority and cycles before resolving the performance.

# src/motion/human/perform/IAutoMovieMotionHumanProp.ts#IAutoMovieMotionHumanProp.IPosed

## @evidence contracts/development/common.md#meaningful-documentation

shapes: Its colliders, with the moved parts' colliders moved; absent when the prop declares none.

## @evidence contracts/development/design.md#principled-representation

shapes: Its colliders, with the moved parts' colliders moved; absent when the prop declares none.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanObject.ts (HumanObject.prop, return); perform/HumanPerformanceObject.ts (HumanPerformanceObject.pose, return); affordance/operateDrive.ts (operateDrive.part); perform/HumanPerformanceObject.ts (HumanPerformanceObject.point); perform/HumanPerformanceObject.ts (HumanPerformanceObject.pose); perform/HumanPerformanceObject.ts (HumanPerformanceObject.POSED).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieAffordance, IAutoMoviePhysicalShape identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanProp.ts#IAutoMovieMotionHumanProp.ITrack

## @evidence contracts/development/common.md#meaningful-documentation

duration: Seconds the track lasts; its last travel holds after. Endless when absent.

## @evidence contracts/development/design.md#principled-representation

duration: Seconds the track lasts; its last travel holds after. Endless when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanObject.ts (HumanObject.prop, tracks).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieMotionHumanScheduledInstant identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
