# src/motion/human/actions/IAutoMovieMotionHumanWalkPace.ts#IAutoMovieMotionHumanWalkPace.IProps

## @evidence contracts/development/common.md#meaningful-documentation

distance: The path's length, metres. period: The realised step period for a planned one, seconds. lead: How far ahead of the ankle the middle of a flight gait's centre of pressure path lies, metres; 0 when absent.

## @evidence contracts/development/design.md#principled-representation

distance: The path's length, metres. period: The realised step period for a planned one, seconds. lead: How far ahead of the ankle the middle of a flight gait's centre of pressure path lies, metres; 0 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/WalkPace.ts (WalkPace.fit, props); actions/WalkPace.ts (WalkPace.travelled, props); actions/walkStation.ts (walkStation.cadenced, return); actions/WalkPace.ts (WalkPace).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in WalkPace.fit.
