# src/motion/human/perform/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.ICarrier

## @evidence contracts/development/common.md#meaningful-documentation

Names the hand, authored point, orientation frame and underlying posture.

## @evidence contracts/development/design.md#principled-representation

The grip point and hand basis are constants in the moving prop's own frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only what the arm planner and the resulting posture reader need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The point names the prop's public points record and the body is the performer's canonical body.

# src/motion/human/perform/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IInput

## @evidence contracts/development/common.md#meaningful-documentation

States the prop's lifecycle and the bounds of the simultaneous carry.

## @evidence contracts/development/design.md#principled-representation

Both performers share one path and one closed interval.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One prop and its path, two carriers and the common span.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The prop's site positions are taken from its canonical data, with no carry-specific geometry.

# src/motion/human/perform/IAutoMovieMotionHumanSharedCarry.ts#IAutoMovieMotionHumanSharedCarry.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

States where the prop and postures are read and who owns the motion outside the interval.

## @evidence contracts/development/design.md#principled-representation

The prop exposes its single track through the existing motion hook.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One shared prop and one posture reader per performer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Returns canonical postures and the canonical performance prop.
