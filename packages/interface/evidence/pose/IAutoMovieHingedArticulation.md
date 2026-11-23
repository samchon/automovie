# src/pose/IAutoMovieHingedArticulation.ts#IAutoMovieHingedArticulation

## @evidence contracts/development/design.md#principled-representation

The two deltas are a hinge rotation in closed form and a chain-root rotation from the swivel sweep, and `overshoot` is the caller scorer's value, which `reachPose` takes from `jointRomOvershoot`, the measure the pose gate applies, so the reported cost is the gate's verdict rather than a solver-private score.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Mirrors the two-delta shape of `IAutoMovieTwoBoneArticulation` with the facts a hinged solve adds, its cost and the seed that continues it; the scorer's deviation and second key are returned for a caller that ranks fits by what they scored.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A rig that cannot hold any legal pose still returns its least-overshoot candidate with a positive `overshoot` rather than a clamped pose presented as clean, and a non-finite angle scores `Infinity` so it cannot win.

## @evidence contracts/development/common.md#meaningful-documentation

States the producer, the selection rule, the consumer, each delta's joint and frame, the hinge-only property of `lower`, and the unit and meaning of `overshoot` including `0` and `Infinity`.
