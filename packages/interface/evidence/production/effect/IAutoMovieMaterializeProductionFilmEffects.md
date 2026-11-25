# src/production/effect/IAutoMovieMaterializeProductionFilmEffects.ts#IAutoMovieMaterializeProductionFilmEffects.IProps

## @evidence contracts/development/design.md#principled-representation

Film cue intervals are [startFrame, startFrame + durationFrames); the materializer requires safe nonnegative starts, positive safe durations, safe ends and intensity in [0, 1]. Frame-rate admission and reduction precede second conversion.

## @evidence contracts/development/design.md#minimal-and-owned-surface

materializeProductionFilmEffects owns the join between normalized film cues, current build identity and world recipes; projected shot intervals exist only to reject competing zone ownership.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Absent shotEffects means no shot-owned conflicts are supplied, not proof that none exist. Unknown zones/recipes and overlapping owners throw instead of silently selecting one owner.

## @evidence contracts/development/common.md#meaningful-documentation

Inputs for admitting film-owned cues and materializing their frame-clock streams. Film cue intervals are [startFrame, startFrame + durationFrames); the materializer requires safe nonnegative starts, positive safe durations, safe ends and intensity in [0, 1]. Frame-rate admission and reduction precede second conversion.
