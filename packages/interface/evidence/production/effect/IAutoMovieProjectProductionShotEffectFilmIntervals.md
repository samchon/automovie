# src/production/effect/IAutoMovieProjectProductionShotEffectFilmIntervals.ts#IAutoMovieProjectProductionShotEffectFilmIntervals.IProps

## @evidence contracts/development/design.md#principled-representation

Shot cues own [start, end) seconds; a source frame is included only when its rational boundary lies in that interval. Projection intersects this with each half-open source trim.

## @evidence contracts/development/design.md#minimal-and-owned-surface

projectProductionShotEffectFilmIntervals supplies materializeProductionFilmEffects with shot-owned film intervals for zone-conflict checks; the map needs only compiled effects.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing shot records contribute no intervals because the builder owns availability diagnostics. Invalid cue seconds or an inconsistent clock throw rather than inventing frame bounds.

## @evidence contracts/development/common.md#meaningful-documentation

Inputs for projecting shot effect ownership through film source trims. Shot cues own [start, end) seconds; a source frame is included only when its rational boundary lies in that interval. Projection intersects this with each half-open source trim.
