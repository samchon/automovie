# src/motion/human/law/IAutoMovieMotionHumanContactWindow.ts#IAutoMovieMotionHumanContactWindow

## @evidence contracts/development/common.md#meaningful-documentation

from: Start share. to: End share. inHand: A grip's in-hand motion of the held object (#3447): a rigid displacement in the hand's frame at a share of this window from 0 to 1, metres, the identity at 0. The performance composes it before the offset it stored at closure (position R_d p + t_d, rotation R_d R), so a pen turned into a writing grip or a coin rolled across the fingers moves in the hand while the hand holds it. It must be a pure function of the share. Absent, the object keeps the offset it had at closure. kind: Support discriminant: ground, prop or another person. kind: Support discriminant: ground, prop or another person. subject: Scene subject id of the supporting prop or person.

## @evidence contracts/development/design.md#principled-representation

from: Start share. to: End share. inHand: A grip's in-hand motion of the held object (#3447): a rigid displacement in the hand's frame at a share of this window from 0 to 1, metres, the identity at 0. The performance composes it before the offset it stored at closure (position R_d p + t_d, rotation R_d R), so a pen turned into a writing grip or a coin rolled across the fingers moves in the hand while the hand holds it. It must be a pure function of the share. Absent, the object keeps the offset it had at closure. kind: Support discriminant: ground, prop or another person. kind: Support discriminant: ground, prop or another person. subject: Scene subject id of the supporting prop or person.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/stand.ts (stand.plan, return); actions/supportWindows.ts (supportWindows.of, return); actions/supportWindows.ts (supportWindows.of.close.part, p); actions/walkDelayed.ts (walkDelayed, c); actions/walkDelayed.ts (walkDelayed, return); actions/walkPaced.ts (walkPaced, c).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion, AutoMovieHumanoidRegion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers. Shares the canonical AutoMovieHumanoidRegion, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanContactWindow.ts#IAutoMovieMotionHumanContactWindow.Socket

## @evidence contracts/development/common.md#meaningful-documentation

States both forms, the frame and the unit.

## @evidence contracts/development/design.md#principled-representation

A sole socket by name, or the same rest-frame offset a leg goal turns its foot about.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the slip and lift audits (audit/AutoMovieMotionHumanAuditGround.ts, plants).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanFoot.Socket and IAutoMovieVector3 identities.

# src/motion/human/law/IAutoMovieMotionHumanContactWindow.ts#IAutoMovieMotionHumanContactWindow.Support

## @evidence contracts/development/common.md#meaningful-documentation

kind: Support discriminant: ground, prop or another person. kind: Support discriminant: ground, prop or another person. subject: Scene subject id of the supporting prop or person.

## @evidence contracts/development/design.md#principled-representation

kind: Support discriminant: ground, prop or another person. kind: Support discriminant: ground, prop or another person. subject: Scene subject id of the supporting prop or person.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/supportWindows.ts (supportWindows.of.frames, return); carrier/HumanSupportFrame.ts (HumanSupportFrame.of, return); carrier/HumanSupportFrame.ts (HumanSupportFrame.contact, return); carrier/HumanSupportFrame.ts (HumanSupportFrame.at, named); compose/AutoMovieMotionHumanTouchContacts.ts (AutoMovieMotionHumanTouchContacts.windows, hand); perform/HumanPerformancePlace.ts (HumanPerformancePlace.place.context, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical AutoMovieHumanoidRegion, AutoMovieHumanoidBone identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/law/IAutoMovieMotionHumanContactWindow.ts#IAutoMovieMotionHumanContactWindow.IGround

## @evidence contracts/development/common.md#meaningful-documentation

Height measures world elevation in metres. An omitted height selects the floor.

## @evidence contracts/development/design.md#principled-representation

The ground discriminant identifies horizontal stationary support, so elevation alone locates its plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The contact window uses this variant for both floor and tread support. Height distinguishes raised treads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies actual support elevation without encoding a stair number or scene.
