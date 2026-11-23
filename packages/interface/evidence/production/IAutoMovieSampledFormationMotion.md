# src/production/IAutoMovieSampledFormationMotion.ts#IAutoMovieSampledFormationMotion

## @evidence contracts/development/design.md#principled-representation

Extends the per-cue motion state with a nullable reform, so the sampled value is the cue's eased interpolation between `from` and `to` and the identity state before any cue, both pure functions of the cue list and time.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Adds one member to the interface's motion state instead of a parallel record, so every consumer of a motion state also accepts a sampled one.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Distinguishes no target from an identity target by null rather than by fabricating an identity re-form, so consumers never compare layouts to detect the absence.

## @evidence contracts/development/common.md#meaningful-documentation

States the identity state returned before any cue, the held state between cues, and why the reform is null rather than an identity re-form.
