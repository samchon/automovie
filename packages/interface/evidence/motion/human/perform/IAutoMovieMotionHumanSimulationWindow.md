# src/motion/human/perform/IAutoMovieMotionHumanSimulationWindow.ts#IAutoMovieMotionHumanSimulationWindow

## @evidence contracts/development/common.md#meaningful-documentation

States the clock, the grid snap of the end, which bodies take part and what `released` withdraws.

## @evidence contracts/development/design.md#principled-representation

Film seconds for both ends and subject ids for the bodies; `HumanPerformanceSimulation` refuses an end before the start, a span shorter than one 120 Hz interval and an unknown subject at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the motions performance; `HumanPerformance.simulate` reads it and the window and pair specs author it. `released` exists for a passive body that no impulse in the performance fells, the pair's free fall.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No scene-specific member; a fall the performance's own laws decide is read from the placed actions, so it needs no flag here.
