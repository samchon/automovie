# src/motion/human/exercise/IAutoMovieMotionHumanTrampoline.ts#IAutoMovieMotionHumanTrampoline.Shape

## @evidence contracts/development/common.md#meaningful-documentation

Straight, or the tuck, the pike or the straddle jump.

## @evidence contracts/development/design.md#principled-representation

Closed choices "straight", "tuck", "pike", "straddle".

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: exercise/trampolineBounce.ts (trampolineBounce.SHAPES).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly.

# src/motion/human/exercise/IAutoMovieMotionHumanTrampoline.ts#IAutoMovieMotionHumanTrampoline.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit, range and default.

## @evidence contracts/development/design.md#principled-representation

The trampoline by scene id, a whole bounce count, the apex as the feet's height above the bed in metres, and the apex shape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The four members trampolineBounce.plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: every member applies to every bounce; an apex beyond the legs' push remains for the law's runtime refusal.
