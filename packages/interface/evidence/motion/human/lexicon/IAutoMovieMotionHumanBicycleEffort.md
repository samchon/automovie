# src/motion/human/lexicon/IAutoMovieMotionHumanBicycleEffort.ts#IAutoMovieMotionHumanBicycleEffort

## @evidence contracts/development/common.md#meaningful-documentation

Names the moving prop, its contacts, lift in metres and the ordered events in seconds.

## @evidence contracts/development/design.md#principled-representation

Separate time boundaries establish the saddle-free window while the prop owns the pedal, grip and saddle frames.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanBicycleEffort consumes these parameters and delegates the seated pose to HumanRide.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The bicycle and both crank contacts remain supplied by the scene. The lift is an authored performance choice.
