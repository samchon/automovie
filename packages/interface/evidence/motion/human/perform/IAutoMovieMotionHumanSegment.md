# src/motion/human/perform/IAutoMovieMotionHumanSegment.ts#IAutoMovieMotionHumanSegment

## @evidence contracts/development/common.md#meaningful-documentation

One scheduled and planned human action with its law, context, film placement and optional transition from another segment. Performance evaluation and motion audits share this identity.

## @evidence contracts/development/design.md#principled-representation

entry: The schedule entry's walk-order index. start: Film second of the law's time zero. blend: Offset decay time, seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Performance placement creates planned segments consumed by pose evaluation, overlays, prop contacts and audits; caches and carried-grip work state remain nested evaluator helpers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Film placement and the plan's action-local clock stay separate, and a transition explicitly references its source segment. The legs' continuation seeds are a reader the placement prepares once with the segment, not a table keyed by the plan. The performance scheduler owns admission and recursive evaluation guards.

# src/motion/human/perform/IAutoMovieMotionHumanSegment.ts#IAutoMovieMotionHumanSegment.IAnchorFits

## @evidence contracts/development/common.md#meaningful-documentation

States the keys, the values and the null entries.

## @evidence contracts/development/design.md#principled-representation

The display's own fit names and the engine's swivel seed, as a nearby second's fits are kept.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written and read by the motions display's leaf reader alone.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses IAutoMovieSwivelSeed; a missing name and a null seed stay distinct.

# src/motion/human/perform/IAutoMovieMotionHumanSegment.ts#IAutoMovieMotionHumanSegment.IOverlay

## @evidence contracts/development/common.md#meaningful-documentation

channels: The channels, or single digits, it takes from the carrier.

## @evidence contracts/development/design.md#principled-representation

channels: The channels, or single digits, it takes from the carrier.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanPerformance.ts (HumanPerformance.overlays, return); perform/HumanPerformanceRead.ts (HumanPerformanceRead.overlays, return); perform/HumanSegmentOverlay.ts (HumanSegmentOverlay.overlaid.build, used); perform/HumanSegmentOverlay.ts (HumanSegmentOverlay.overlaid.build.tag, o); perform/HumanSegmentOverlay.ts (HumanSegmentOverlay.overlaid.build, o); perform/HumanSegmentOverlay.ts (HumanSegmentOverlay.contactGoals, overlay).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieMotionHumanChannelClaim identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanSegment.ts#IAutoMovieMotionHumanSegment.IPerson

## @evidence contracts/development/common.md#meaningful-documentation

stops: Resolved stops of this person's weapons, film seconds, keyed by `weapon(segment, id)`.

## @evidence contracts/development/design.md#principled-representation

stops: Resolved stops of this person's weapons, film seconds, keyed by `weapon(segment, id)`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanPerformanceContacts.ts (HumanPerformanceContacts.hold, person); perform/HumanPerformanceContacts.ts (HumanPerformanceContacts.contacts.nearest, owner); perform/HumanPerformanceContacts.ts (HumanPerformanceContacts.contacts.events, person); perform/HumanPerformanceFlight.ts (HumanPerformanceFlight.flights, people); perform/HumanPerformanceFlight.ts (HumanPerformanceFlight.flight, person); perform/HumanPerformanceLayers.ts (HumanPerformanceLayers.window, person).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanPerformer, IAutoMovieMotionHumanSkill, IAutoMovieMotionHumanSegment, IAutoMovieMotionHumanSegment.IOverlay, IAutoMovieMotionHumanPosture identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanSegment.ts#IAutoMovieMotionHumanSegment.ILayered

## @evidence contracts/development/common.md#meaningful-documentation

fade: Seconds over which it comes in and goes out.

## @evidence contracts/development/design.md#principled-representation

fade: Seconds over which it comes in and goes out.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanPerformanceLayers.ts (HumanPerformanceLayers.window, return); perform/HumanPerformanceState.ts (HumanPerformanceState, return); perform/HumanSegmentPose.ts (HumanSegmentPose.layered, { layer, from, to, fade }).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanLayer identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanSegment.ts#IAutoMovieMotionHumanSegment.IHeld

## @evidence contracts/development/common.md#meaningful-documentation

until: Film second a later action takes the hand over; infinite while none has. takenBy: the order of the action that took the hand over, absent while none has. carry: The holding arm relative to the chest, captured when the carry starts.

## @evidence contracts/development/design.md#principled-representation

until: Film second a later action takes the hand over; infinite while none has. carry: The holding arm relative to the chest, captured when the carry starts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanPerformanceContacts.ts (HumanPerformanceContacts.hold, h); perform/HumanSegmentCarry.ts (HumanSegmentCarry.carries, holds); perform/HumanSegmentCarry.ts (HumanSegmentCarry.carries, h); perform/HumanSegmentCarry.ts (HumanSegmentCarry.capture, held); perform/HumanSegmentEntry.ts (HumanSegmentEntry.entry, h); perform/HumanSegmentOverlay.ts (HumanSegmentOverlay.overlaid, carried).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone, IAutoMovieMotionHumanSegment, IAutoMovieMotionHumanSegment.ICarry identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanSegment.ts#IAutoMovieMotionHumanSegment.ICarry

## @evidence contracts/development/common.md#meaningful-documentation

position: The hand joint in the chest's frame, metres. elbow: The elbow in the chest's frame, metres: the carry's bend hint.

## @evidence contracts/development/design.md#principled-representation

position: The hand joint in the chest's frame, metres. elbow: The elbow in the chest's frame, metres: the carry's bend hint.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanSegmentCarry.ts (HumanSegmentCarry.capture, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, IAutoMovieHumanLimbReference identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanSegment.ts#IAutoMovieMotionHumanSegment.IShown

## @evidence contracts/development/common.md#meaningful-documentation

Documents IAutoMovieMotionHumanSegment.IShown: One displayed pose as its evaluation produced it, kept with what its readers take from it.

## @evidence contracts/development/design.md#principled-representation

One record of pose, reading over the canonical IAutoMoviePose, IAutoMovieSkeletonPoseResolution contracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Its producer fills it and the enclosing IAutoMovieMotionHumanSegment contract's readers use it; nothing else is declared.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A type contract only: it holds no cached answer, fitted constant or fixture-specific member, and admission and computation stay with its producer.
