# src/motion/perform/IAutoMovieActorContext.ts#IAutoMovieActorContext

## @evidence contracts/development/design.md#principled-representation

Collects the exact inputs read by makeActorSynthesizer; host staging supplies finite quantities and matching skeleton/pose/rig data, while prior verified beats may replace position, facing, speed, phase and pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Keeps synthesis inputs together without owning timeline assembly or importing a renderer object.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Rig-less gaze keeps the existing single-bone fallback, while arm and reaction verbs require geometry; no guessed arm lengths or anatomical height fraction is stored here.

## @evidence contracts/development/common.md#meaningful-documentation

Member comments state metres, metres/second, degrees, phase seconds, optional-rig behavior and paired clinical rest-frame conventions.
