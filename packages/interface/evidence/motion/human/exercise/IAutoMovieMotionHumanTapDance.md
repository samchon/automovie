# src/motion/human/exercise/IAutoMovieMotionHumanTapDance.ts#IAutoMovieMotionHumanTapDance.Step

## @evidence contracts/development/common.md#meaningful-documentation

The steps' names.

## @evidence contracts/development/design.md#principled-representation

Closed choices "shuffle", "flap", "ballChange", "heelDrop", "crampRoll", "timeStep".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/tapDance.ts (tapDance.STEPS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly.

# src/motion/human/exercise/IAutoMovieMotionHumanTapDance.ts#IAutoMovieMotionHumanTapDance.Part

## @evidence contracts/development/common.md#meaningful-documentation

The ball's tap, the heel's drop, or the whole sole.

## @evidence contracts/development/design.md#principled-representation

Closed choices "ball", "heel", "flat".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/tapDance.ts (tapDance.STEPS).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly.

# src/motion/human/exercise/IAutoMovieMotionHumanTapDance.ts#IAutoMovieMotionHumanTapDance.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit, range and default.

## @evidence contracts/development/design.md#principled-representation

The step, the tempo in beats per minute or a cue-track lock, a whole repeat count and the leading foot.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members tapDance.plan reads; `lock` reuses the dance law's own type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: every member applies to every step, and the tempo and count ranges remain for runtime admission.
