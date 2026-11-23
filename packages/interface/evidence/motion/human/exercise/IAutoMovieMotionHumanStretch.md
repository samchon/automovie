# src/motion/human/exercise/IAutoMovieMotionHumanStretch.ts#IAutoMovieMotionHumanStretch

## @evidence contracts/development/common.md#meaningful-documentation

side: The side stretched or lifted; `right` when absent. hold: Seconds held; `HOLD` when absent. Inclusive minimum: 0. Unit: "s". depth: How far into the range; `moderate` when absent.

## @evidence contracts/development/design.md#principled-representation

side: The side stretched or lifted; `right` when absent. hold: Seconds held; `HOLD` when absent. Inclusive minimum: 0. Unit: "s". depth: How far into the range; `moderate` when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: chain/HumanChainSport.ts (HumanChainSport.stretch, params); exercise/stretch.ts (stretch.plan, context); exercise/stretch.ts (stretch.plan); executable/cases/stretchCases.ts (stretchCases).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionManner identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

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
