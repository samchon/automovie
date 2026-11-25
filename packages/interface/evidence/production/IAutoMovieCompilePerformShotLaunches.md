# src/production/IAutoMovieCompilePerformShotLaunches.ts#IAutoMovieCompilePerformShotLaunches.IResult

## @evidence contracts/development/design.md#principled-representation

Clip key times and event times use shot-local seconds; clips span the full shot and flight keys begin at action.start. actionIndex preserves the originating launch's position.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compilePerformShotLaunches produces these mutable arrays for performShot to append later object clips and coupling events before final event sorting.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The result can contain successful launches while the context collector contains failures; performShot refuses that stage as a whole. Recoil actions are appended to the action plan rather than hidden inside this result.

## @evidence contracts/development/common.md#meaningful-documentation

Baked projectile clips and interaction events returned from the launch stage. Clip key times and event times use shot-local seconds; clips span the full shot and flight keys begin at action.start. actionIndex preserves the originating launch's position.
