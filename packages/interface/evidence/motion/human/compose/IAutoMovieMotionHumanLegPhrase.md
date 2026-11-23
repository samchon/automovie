# src/motion/human/compose/IAutoMovieMotionHumanLegPhrase.ts#IAutoMovieMotionHumanLegPhrase.IPhrase

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is; each member gives its meaning, and the optional two what their absence means.

## @evidence contracts/development/design.md#principled-representation

A leg phrase is one foot leaving and rejoining one stance on one clock; the contact states that the place is solid by naming what the foot bears on, so a place in the air cannot carry a contact window.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members shared by `lift`, `tap`, `swing` and `pivot`, mirroring the arm's phrase; the placement, the clock, the contact window and the modifiers are their owners' types. The exported lift, tap, swing and pivot factories read these fields to construct leg primitives.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The contact is one optional record instead of a solid flag beside optional contact fields; `pivot` omits it because its contact is always the ground.

# src/motion/human/compose/IAutoMovieMotionHumanLegPhrase.ts#IAutoMovieMotionHumanLegPhrase.ILiftProps

## @evidence contracts/development/common.md#meaningful-documentation

raised: Retained callback for the lifted foot's target frame, evaluated on the phrase's action-relative clock.

## @evidence contracts/development/design.md#principled-representation

raised: Retained callback for the lifted foot's target frame, evaluated on the phrase's action-relative clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanLegPhrase.ts (AutoMovieMotionHumanLegPhrase.lift, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanLegPhrase.IPhrase, IAutoMovieMotionHumanLeg.Frame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanLegPhrase.ts#IAutoMovieMotionHumanLegPhrase.ITapProps

## @evidence contracts/development/common.md#meaningful-documentation

target: Retained callback for the foot's tapping target frame on the phrase clock. clearance: Maximum added ankle lift above the interpolated travel baseline, metres.

## @evidence contracts/development/design.md#principled-representation

target: Retained callback for the foot's tapping target frame on the phrase clock. clearance: Maximum added ankle lift above the interpolated travel baseline, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanLegPhrase.ts (AutoMovieMotionHumanLegPhrase.tap, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanLegPhrase.IPhrase, IAutoMovieMotionHumanLeg.Frame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanLegPhrase.ts#IAutoMovieMotionHumanLegPhrase.ISwingProps

## @evidence contracts/development/common.md#meaningful-documentation

chamber: Retained callback for the prepared leg target frame. target: Retained callback for the leg's strike target frame. weapons: Borrowed weapon declarations carried through the swing; omitted means none.

## @evidence contracts/development/design.md#principled-representation

chamber: Retained callback for the prepared leg target frame. target: Retained callback for the leg's strike target frame. weapons: Borrowed weapon declarations carried through the swing; omitted means none.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanLegPhrase.ts (AutoMovieMotionHumanLegPhrase.swing, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanLegPhrase.IPhrase, IAutoMovieMotionHumanLeg.Frame, IAutoMovieMotionWeaponPath identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanLegPhrase.ts#IAutoMovieMotionHumanLegPhrase.IPivotProps

## @evidence contracts/development/common.md#meaningful-documentation

turn: Yaw added by the pivot, degrees about world +Y. pitch: Foot pitch at the pivot's fullest, degrees, positive toes up.

## @evidence contracts/development/design.md#principled-representation

turn: Yaw added by the pivot, degrees about world +Y. pitch: Foot pitch at the pivot's fullest, degrees, positive toes up.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanLegPhrase.ts (AutoMovieMotionHumanLegPhrase.pivot, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanLegPhrase.IPhrase identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
