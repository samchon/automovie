# src/motion/human/throwing/IAutoMovieMotionHumanThrowObjectLaunch.ts#IAutoMovieMotionHumanThrowObjectLaunch

## @evidence contracts/development/common.md#meaningful-documentation

point: The release point, world metres. velocity: The launch velocity, world metres per second. seconds: Seconds since the action's start of the release.

## @evidence contracts/development/design.md#principled-representation

point: The release point, world metres. velocity: The launch velocity, world metres per second. seconds: Seconds since the action's start of the release.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: throwing/throwObject.ts (throwObject.of, return); throwing/throwObjectLaunch.ts (throwObjectLaunch.launches, launch); throwing/throwObjectLaunch.ts (throwObjectLaunch.path, launch); executable/cases/throwCases.ts (throwCases); throwing/catchObject.ts (catchObject.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/throwing/IAutoMovieMotionHumanThrowObjectLaunch.ts#IAutoMovieMotionHumanThrowObjectLaunch.ILaunch

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The initial state of a drag-free ballistic path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members read by a catcher and the capture.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Plain vectors and seconds.
