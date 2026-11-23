# src/production/IAutoMovieFormationCadenceSegment.ts#IAutoMovieFormationCadenceSegment

## @evidence contracts/development/design.md#principled-representation

Cadence is the integral of covered ground over `[0, time]`, so the interval is cut at cue boundaries and each piece records seconds, eased distance and turn, which a consumer sums to get the cycle phase exactly at any seek time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four fields, each a quantity a cycle consumer adds up; resolving the gait to a figure model stays with the viewer, which knows the runtime models of each LOD tier.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Nothing accumulates between frames, so no frame-to-frame drift is corrected afterwards; a gap carries the previous gait as a stated rule rather than a guess for a missing cue.

## @evidence contracts/development/common.md#meaningful-documentation

States the gait's source and its null before the first cue, the gap gait rule, the seconds, the x-z plane and meter unit of distance, and that the turn is unsigned radians.
