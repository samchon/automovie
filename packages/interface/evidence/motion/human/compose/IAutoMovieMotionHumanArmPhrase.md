# src/motion/human/compose/IAutoMovieMotionHumanArmPhrase.ts#IAutoMovieMotionHumanArmPhrase.IPhrase

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is; each member gives its meaning, and the optional two what their absence means.

## @evidence contracts/development/design.md#principled-representation

A phrase is one arm moving on one clock from and back to one origin; the contact states that the place is solid by naming what the hand bears on, so a place in the air cannot carry a contact window.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members shared by `visit`, `stroke`, `strike` and `oscillate`; the clock, the origin, the contact window and the modifiers are their owners' types. The everyday armPhrase law composes visit, stroke and oscillate from these records.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The contact is one optional record instead of a solid flag beside optional contact fields; the manner is picked from the manner's own modifiers.

# src/motion/human/compose/IAutoMovieMotionHumanArmPhrase.ts#IAutoMovieMotionHumanArmPhrase.ISwing

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is; each member gives its axes and unit.

## @evidence contracts/development/design.md#principled-representation

A pendular arm is described by its joint angles, not by a hand goal: the shoulder's three clinical angles and the elbow's one, in the degrees a posture's joints are written in.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, read only by `swing`; the swim law's arm strokes (`sport/swim.ts`) are its consumer so far, and the scalar angles remain independent of a particular gait.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Both members are required; the elbow is one number because a hinge has one angle.

# src/motion/human/compose/IAutoMovieMotionHumanArmPhrase.ts#IAutoMovieMotionHumanArmPhrase.Phrase

## @evidence contracts/development/common.md#meaningful-documentation

The phrase.

## @evidence contracts/development/design.md#principled-representation

Closed choices "visit", "stroke", "oscillate" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/armPhrase.ts (armPhrase.plan, context.params.phrase).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in armPhrase.plan, which branches on each.

# src/motion/human/compose/IAutoMovieMotionHumanArmPhrase.ts#IAutoMovieMotionHumanArmPhrase.IOffset

## @evidence contracts/development/common.md#meaningful-documentation

out: Away from the midline on the acting side. up: Upward. forward: Forward.

## @evidence contracts/development/design.md#principled-representation

out: Away from the midline on the acting side. up: Upward. forward: Forward.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/armPhrase.ts (armPhrase.plan.arms.shift, o); everyday/armPhrase.ts (armPhrase.plan.arms); everyday/armPhrase.ts (armPhrase).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in armPhrase.plan.arms.shift.

# src/motion/human/compose/IAutoMovieMotionHumanArmPhrase.ts#IAutoMovieMotionHumanArmPhrase.IParams

## @evidence contracts/development/common.md#meaningful-documentation

offset: The target's point moved in the performer's frame by shares of the arm's length; none when absent. from: A stroke's start, by the same shares from the target's point; the target's point when absent. swing: An oscillation's swing, by the same shares at the swing's ends; a tenth of the arm out and in when absent.

## @evidence contracts/development/design.md#principled-representation

offset: The target's point moved in the performer's frame by shares of the arm's length; none when absent. from: A stroke's start, by the same shares from the target's point; the target's point when absent. swing: An oscillation's swing, by the same shares at the swing's ends; a tenth of the arm out and in when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: everyday/armPhrase.ts (armPhrase.plan, context); everyday/armPhrase.ts (armPhrase.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanArmPhrase.Phrase, IAutoMovieMotionTarget, IAutoMovieMotionHumanArmPhrase.IOffset, AutoMovieHumanSide, IAutoMovieMotionHumanHand.Surface, IAutoMovieMotionHumanHand.Shape identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanArmPhrase.ts#IAutoMovieMotionHumanArmPhrase.IVisitProps

## @evidence contracts/development/common.md#meaningful-documentation

target: Borrowed target-frame callback retained by the primitive and read on writes in action-relative seconds, including zero-weight writes. Its exceptions propagate.

## @evidence contracts/development/design.md#principled-representation

target: Borrowed target-frame callback retained by the primitive and read on writes in action-relative seconds, including zero-weight writes. Its exceptions propagate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmPhrase.ts (AutoMovieMotionHumanArmPhrase.visit, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanArmPhrase.IPhrase, IAutoMovieMotionHumanArmTarget.Frame identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanArmPhrase.ts#IAutoMovieMotionHumanArmPhrase.IStrokeProps

## @evidence contracts/development/common.md#meaningful-documentation

path: Retained synchronous target callback in action-relative seconds. At positive progress each write calls it both at that progress and at zero with the same posture and seconds, regardless of contact or extent; zero-weight writes may call it. Keep captured inputs stable; exceptions propagate.

## @evidence contracts/development/design.md#principled-representation

path: Retained synchronous target callback in action-relative seconds. At positive progress each write calls it both at that progress and at zero with the same posture and seconds, regardless of contact or extent; zero-weight writes may call it. Keep captured inputs stable; exceptions propagate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmPhrase.ts (AutoMovieMotionHumanArmPhrase.stroke, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanArmPhrase.IPhrase, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanArmTarget.ITarget identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanArmPhrase.ts#IAutoMovieMotionHumanArmPhrase.IStrikeProps

## @evidence contracts/development/common.md#meaningful-documentation

chamber: Retained callback giving the prepared arm target in action-relative seconds; sampled when the primitive writes, including zero-weight writes. Exceptions propagate. target: Retained strike target callback in action-relative seconds; captured inputs must stay stable and callback exceptions propagate. weapons: Borrowed weapon records passed through to the primitive; omitted means no weapon declarations. The readonly array is not copied into an independent ownership boundary.

## @evidence contracts/development/design.md#principled-representation

chamber: Retained callback giving the prepared arm target in action-relative seconds; sampled when the primitive writes, including zero-weight writes. Exceptions propagate. target: Retained strike target callback in action-relative seconds; captured inputs must stay stable and callback exceptions propagate. weapons: Borrowed weapon records passed through to the primitive; omitted means no weapon declarations. The readonly array is not copied into an independent ownership boundary.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmPhrase.ts (AutoMovieMotionHumanArmPhrase.strike, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanArmPhrase.IPhrase, IAutoMovieMotionHumanArmTarget.Frame, IAutoMovieMotionWeaponPath identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanArmPhrase.ts#IAutoMovieMotionHumanArmPhrase.IOscillateProps

## @evidence contracts/development/common.md#meaningful-documentation

pose: Retained synchronous callback in action-relative seconds. Swing is the base wave in [-1, 1] multiplied by free-space extent (default 1); with contact the multiplier is 1. Extent above 1 therefore permits larger swing arguments. Called during writes, including zero-weight writes; captured inputs must remain stable and exceptions propagate.

## @evidence contracts/development/design.md#principled-representation

pose: Retained synchronous callback in action-relative seconds. Swing is the base wave in [-1, 1] multiplied by free-space extent (default 1); with contact the multiplier is 1. Extent above 1 therefore permits larger swing arguments. Called during writes, including zero-weight writes; captured inputs must remain stable and exceptions propagate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanArmPhrase.ts (AutoMovieMotionHumanArmPhrase.oscillate, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanArmPhrase.IPhrase, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanArmTarget.ITarget identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
