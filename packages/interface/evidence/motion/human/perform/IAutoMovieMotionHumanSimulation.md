# src/motion/human/perform/IAutoMovieMotionHumanSimulation.ts#IAutoMovieMotionHumanSimulation

## @evidence contracts/development/common.md#meaningful-documentation

States the local clock, the body ids and what the identity and frames are used for.

## @evidence contracts/development/design.md#principled-representation

The window in film seconds, the engine's mode union and the engine's own simulation result; the simulation's input fixes its rate, duration and bodies.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the motions performance, which reads the cache for poses; the window and pair specs read the identity, frames and input to check determinism, contact, bindings and momentum.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reuses the engine's simulation and mode types instead of copying their members.
