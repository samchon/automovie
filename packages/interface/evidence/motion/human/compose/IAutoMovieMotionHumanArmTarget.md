# src/motion/human/compose/IAutoMovieMotionHumanArmTarget.ts#IAutoMovieMotionHumanArmTarget.ITarget

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is and its frame; each member gives its unit and its meaning when absent.

## @evidence contracts/development/design.md#principled-representation

The surface, its point and the hand's rotation fix the wrist; the bend hint fixes the elbow's one remaining freedom; the shape and the curl fix the fingers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Seven members, each read by `goal` or `move`; `curl` is optional because most shapes need none, `offset` because only an issuer that fixes the surface and shape reads it once.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses `IAutoMovieMotionHumanHand.Surface` and `IAutoMovieMotionHumanHand.Shape` and the interface's vector and quaternion types.

# src/motion/human/compose/IAutoMovieMotionHumanArmTarget.ts#IAutoMovieMotionHumanArmTarget.ISided

## @evidence contracts/development/common.md#meaningful-documentation

States what the record adds to a target.

## @evidence contracts/development/design.md#principled-representation

A target is the same for either hand; which arm takes it is a separate fact, added by extension.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One added member; the one record every law that places hands by a list reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Extends `ITarget` instead of repeating its members.

# src/motion/human/compose/IAutoMovieMotionHumanArmTarget.ts#IAutoMovieMotionHumanArmTarget.Frame

## @evidence contracts/development/common.md#meaningful-documentation

States the current posture/local seconds and optional synchronous same-body FK/genuine ROM loans; target rows contain only the actual numeric hand placement.

## @evidence contracts/development/design.md#principled-representation

A target that rides on something (the performer's trunk, a partner, a prop) is a function of the posture so far and the time, evaluated when the row is written.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One function type, taken by every arm primitive.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A fixed target is the constant function, so there is no second form for it.

# src/motion/human/compose/IAutoMovieMotionHumanArmTarget.ts#IAutoMovieMotionHumanArmTarget.IOrigin

## @evidence contracts/development/common.md#meaningful-documentation

States what the record is and its frame; each member gives its axes and unit.

## @evidence contracts/development/design.md#principled-representation

A hand that has not started or has finished belongs to the body, so its place is held relative to the root and the heading and travels with them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, the surface's point and the hand's rotation; produced by `origin` and read by `move`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A separate type from `ITarget`, whose members are in the world frame, so the two frames cannot be mixed.

# src/motion/human/compose/IAutoMovieMotionHumanArmTarget.ts#IAutoMovieMotionHumanArmTarget.IMove

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, its unit and the range of the weight.

## @evidence contracts/development/design.md#principled-representation

The span the arm is written over, its two ends and the weight between them: a blend of two hand states on a time course.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Eight members, all read by `move`, the optional `curvature` among them (a straight path when absent); `reach`, `hold` and `retract` fill them from a clock.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The weight is a function of seconds and not a named easing, so any time course fits without a new member.
