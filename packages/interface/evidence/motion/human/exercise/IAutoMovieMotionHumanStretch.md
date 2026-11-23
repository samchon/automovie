# src/motion/human/exercise/IAutoMovieMotionHumanStretch.ts#IAutoMovieMotionHumanStretch.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The pose, the side, the hold and the intensity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values the plan reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The intensity is a closed union.

# src/motion/human/exercise/IAutoMovieMotionHumanStretch.ts#IAutoMovieMotionHumanStretch.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Capture cases of the standing stretches and yoga poses (#3246), each held 3 s on the right side at moderate intensity from quiet standing. The poses.

## @evidence contracts/development/design.md#principled-representation

Closed choices "neckSide", "crossBody", "overheadSide", "quadriceps", "tree" distinguish the admitted cases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: executable/cases/stretchCases.ts (stretchCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in stretchCases.
