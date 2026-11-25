# src/motion/human/perform/IAutoMovieMotionHumanPerformanceState.ts#IAutoMovieMotionHumanPerformanceState

## @evidence contracts/development/common.md#meaningful-documentation

States what the record holds, who reads it, why its members are public and that it is not exported. bone: The bone it is worn on; held in the hand when absent. mount: The other prop's socket it rides (`IAutoMovieMotionHumanActionPlan.mounts`); held in the hand or worn when absent. inHand: The grip window's in-hand motion of the prop, composed on `offset` by the span's share (`IAutoMovieMotionHumanContactWindow.inHand`); none when the prop keeps its offset.

## @evidence contracts/development/design.md#principled-representation

One record of the resolved performance, built in one place and read by functions that take it, in place of one class of two thousand lines. bone: The bone it is worn on; held in the hand when absent. mount: The other prop's socket it rides (`IAutoMovieMotionHumanActionPlan.mounts`); held in the hand or worn when absent. inHand: The grip window's in-hand motion of the prop, composed on `offset` by the span's share (`IAutoMovieMotionHumanContactWindow.inHand`); none when the prop keeps its offset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members are the ones the performance kept privately before the split (#3399), and the readers' per-performance results (soft parts, prop writers and posings, flights, hits) the performance owns. Runtime boundary references: perform/HumanHitTrack.ts (HumanHitTrack.instants, self); perform/HumanHitTrack.ts (HumanHitTrack.provisional, self); perform/HumanPerformanceAhead.ts (HumanPerformanceAhead.reader, self); perform/HumanPerformanceAhead.ts (HumanPerformanceAhead.find, self); perform/HumanPerformanceAim.ts (HumanPerformanceAim.aim, self); perform/HumanPerformanceContacts.ts (HumanPerformanceContacts.contacts, self).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No reader keeps a copy of a member; the caches live here and are settled here. Shares the canonical IAutoMovieMotionHumanPerformance.IInput, AutoMovieHumanoidBone, IAutoMovieRigidTransform, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanSegment, IAutoMovieMotionWeaponPath identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanPerformanceState.ts#IAutoMovieMotionHumanPerformanceState.IConstructor

## @evidence contracts/development/common.md#meaningful-documentation

The callable constructor and static factories.

## @evidence contracts/development/design.md#principled-representation

A single canonical performance input constructs the shared resolution state; construction and its possible law refusals remain the runtime state's responsibility.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used by the enclosing IAutoMovieMotionHumanPerformanceState contract's parameter and result relationships.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanPerformance.IInput, IAutoMovieMotionHumanPerformanceState identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanPerformanceState.ts#IAutoMovieMotionHumanPerformanceState.IGrip

## @evidence contracts/development/common.md#meaningful-documentation

bone: The bone it is worn on; held in the hand when absent. mount: The other prop's socket it rides (`IAutoMovieMotionHumanActionPlan.mounts`); held in the hand or worn when absent. inHand: The grip window's in-hand motion of the prop, composed on `offset` by the span's share (`IAutoMovieMotionHumanContactWindow.inHand`); none when the prop keeps its offset.

## @evidence contracts/development/design.md#principled-representation

bone: The bone it is worn on; held in the hand when absent. mount: The other prop's socket it rides (`IAutoMovieMotionHumanActionPlan.mounts`); held in the hand or worn when absent. inHand: The grip window's in-hand motion of the prop, composed on `offset` by the span's share (`IAutoMovieMotionHumanContactWindow.inHand`); none when the prop keeps its offset.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop.since, g); perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop.carrier, w); perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop.seat, w); perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop.seat.earlier, g); perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop.moved, w); perform/HumanPerformanceHold.ts (HumanPerformanceHold.prop.hold, w).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidBone, IAutoMovieRigidTransform, IAutoMovieMotionHumanContactWindow identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanPerformanceState.ts#IAutoMovieMotionHumanPerformanceState.IWriter

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and unit.

## @evidence contracts/development/design.md#principled-representation

A writer names its authored coordinate and the independent degree of freedom it addresses, its film-second window and its travel there.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members, all read by `HumanPerformanceObject`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A prop's own track leaves the source absent, so one list orders both kinds.

# src/motion/human/perform/IAutoMovieMotionHumanPerformanceState.ts#IAutoMovieMotionHumanPerformanceState.IStrike

## @evidence contracts/development/common.md#meaningful-documentation

subject: The striker. segment: The striker's action that carries the weapon. weapon: The weapon.

## @evidence contracts/development/design.md#principled-representation

subject: The striker. segment: The striker's action that carries the weapon. weapon: The weapon.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanPerformanceHits.ts (HumanPerformanceHits.melee, strike); perform/HumanPerformanceState.ts (HumanPerformanceState).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanSegment, IAutoMovieMotionWeaponPath identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/perform/IAutoMovieMotionHumanPerformanceState.ts#IAutoMovieMotionHumanPerformanceState.ITethered

## @evidence contracts/development/common.md#meaningful-documentation

Names the prop that declares a line and the line, as the state's `tethered` index lists them by the far prop.

## @evidence contracts/development/design.md#principled-representation

A line is found by the prop it holds as well as by the prop that declares it; the record pairs the two so a reader of the far prop needs no search over every prop.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, both read by the tether owner (`HumanPerformanceTether`).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record copies nothing: it refers to the declared prop and line, built once with the state's props.