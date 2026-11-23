# src/harness/IAutoMovieBeatEndActorState.ts#IAutoMovieBeatEndActorState

## @evidence contracts/development/design.md#principled-representation `resolveBeatSnapshot` samples the motions the shot actually plays, folds the pose root through the staged transform with `foldRoot` or takes a baked object clip's transform, rotates `+z` by the result for `facing`, and derives phase, velocity and plants with `gaitPhaseOf`, `rootVelocityOf` and `plantsAtEnd`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record per scene node holds the placement, the articulation and the four resumable facts, with `null` for an inapplicable fact rather than separate record shapes for props, walkers and riders.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The state is measured from the compiled shot rather than copied from the authored program, so a prop left in a hand ends where the baked clip put it; the pose root is cleared instead of being applied a second time by the next beat.

## @evidence contracts/development/common.md#meaningful-documentation

States the two producers and instants, the root folding and clearing, and the null convention; members give each value's frame, unit, sampling rule and window, and when each is null.
