# src/motion/composition/IAutoMovieRelationalGoal.ts#IAutoMovieRelationalGoal

## @evidence contracts/development/common.md#meaningful-documentation

Separates bone-local effector coordinates from world arrival direction and film-time target sampling.

## @evidence contracts/development/design.md#principled-representation

freeze samples the target at the inclusive window start and track at the requested active second; callers supply ordered finite times and coherent unit directions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveAutoMovieRelationalGoal resolves subject/region ids and forwards point and optional paired-direction goals to whole-body fitting.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Direction fitting requires both approach and localDirection; either field alone is admitted but leaves only point fitting active.
