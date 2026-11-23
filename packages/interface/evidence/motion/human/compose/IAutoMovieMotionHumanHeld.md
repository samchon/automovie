# src/motion/human/compose/IAutoMovieMotionHumanHeld.ts#IAutoMovieMotionHumanHeld.IHeld

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, the frame of `frame` and that `affordances` are in the prop's own frame.

## @evidence contracts/development/design.md#principled-representation

The prop's subject id, the holding side, the prop's rigid offset in the hand's grip frame (metres and a rotation) and its declared contacts, the facts every held-thing action starts from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, all read through `of` and the point and direction readers by the handling and striking laws, the workout load and the pole vault; the affordances are the interface package's own type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No prop kind is named; the side is the closed `"left" | "right"` union and `frame` reuses `IAutoMovieRigidTransform`.

# src/motion/human/compose/IAutoMovieMotionHumanHeld.ts#IAutoMovieMotionHumanHeld.IUse

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and the meaning of its absence.

## @evidence contracts/development/design.md#principled-representation

The hand's attitude as an effector, whether the prop stands upright, and the prop's point by its id.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, all read by `effector`; a hand-to-face row satisfies it as it is.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The point is the prop's own id, never coordinates.

# src/motion/human/compose/IAutoMovieMotionHumanHeld.ts#IAutoMovieMotionHumanHeld.IGraspedWrist

## @evidence contracts/development/common.md#meaningful-documentation

point: Grasped wrist position in world metres. rotation: Grasped hand orientation as a world unit quaternion.

## @evidence contracts/development/design.md#principled-representation

point: Grasped wrist position in world metres. rotation: Grasped hand orientation as a world unit quaternion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanHeld.ts (AutoMovieMotionHumanHeld.grasped, wrist).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieQuaternion identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/compose/IAutoMovieMotionHumanHeld.ts#IAutoMovieMotionHumanHeld.IPointResult

## @evidence contracts/development/common.md#meaningful-documentation

point: Held affordance point expressed in the hand frame, metres. direction: Held affordance direction expressed in the hand frame.

## @evidence contracts/development/design.md#principled-representation

point: Held affordance point expressed in the hand frame, metres. direction: Held affordance direction expressed in the hand frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: compose/AutoMovieMotionHumanHeld.ts (AutoMovieMotionHumanHeld.point, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
