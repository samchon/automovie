# src/motion/human/throwing/IAutoMovieMotionHumanThrowObjectForm.ts#IAutoMovieMotionHumanThrowObjectForm.Style

## @evidence contracts/development/common.md#meaningful-documentation

Capture cases of the throw and catch family (#3232): performer `a` throws to performer `b` standing facing it, overarm over 6 m, underarm over 4 m and a toss over 2.5 m, aimed at the place ahead of `b` where its catch meets the path; `b` catches with two hands. How the object is thrown.

## @evidence contracts/development/design.md#principled-representation

A closed style choice distinguishes generic delivery, rugby lateral, quarterback delivery and the gridiron snap.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: executable/cases/throwCases.ts (throwCases); throwing/throwObject.ts (throwObject.plan); throwing/throwObjectForm.ts (throwObjectForm.ANGLE); throwing/throwObjectForm.ts (throwObjectForm.WINDUP); throwing/throwObjectForm.ts (throwObjectForm.TURN); throwing/throwObjectForm.ts (throwObjectForm.TILT).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted literal values are declared here directly; runtime handling remains in throwCases.
