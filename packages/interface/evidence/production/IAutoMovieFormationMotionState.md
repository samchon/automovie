# src/production/IAutoMovieFormationMotionState.ts#IAutoMovieFormationMotionState

## @evidence contracts/development/design.md#principled-representation

Translation is a world-space offset, heading is additive in degrees and spacing is multiplied in the unit frame; separating these channels preserves their distinct composition order during sampling and slot placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One state holds only the three formation-wide channels interpolated by sampleFormationMotion; changing arrangement belongs to the cue's layout field.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Positive spacing multipliers preserve non-collapsed local spacing; identity is explicitly zero translation and heading with unit spacing, not an inferred missing state.

## @evidence contracts/development/common.md#meaningful-documentation

Defines world versus unit frames, heading units, additive offsets and positive spacing multipliers.
