# src/cinematics/IAutoMovieFramedSubject.ts#IAutoMovieFramedSubject

## @evidence contracts/development/design.md#principled-representation

The camera distance is `max(height * fraction / 2 / tan(fovY / 2), 2 * radius * fraction / 2 / (tan(fovY / 2) * aspect))`, the pinhole fit on each axis with the binding one winning; it assumes the base and extent are world metres and that `at` returns the same bottom-centre point the static `base` names, which `performShot` keeps by shifting the animated root by the constant offset between root and drawn base.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Carries only what the solve reads, a base, two extents and an optional trajectory, so the solve never resolves a scene id, model or formation itself and the hero take and every coverage take share one resolved subject.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No subject kind is special-cased in the solve: a figure, a facade and a crowd all go through the same two-axis fit, and a missing horizontal measurement is stated as an absent or zero `radius` rather than a guessed width.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, how each subject kind is measured, which fields set distance, aim and path, the metre and shot-local-second units, when `radius` binds, and what a null `at` does to `follow` and `truck`.
