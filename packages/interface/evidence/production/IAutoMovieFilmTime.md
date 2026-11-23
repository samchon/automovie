# src/production/IAutoMovieFilmTime.ts#IAutoMovieFilmTime

## @evidence contracts/development/design.md#principled-representation

A frame index or grid-aligned second value identifies a production-clock boundary; engine film-time measurement owns conversion, roundoff admission and current-timeline range checks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two authoring forms share one time type without carrying an independent frame rate per timestamp; the production's frame format owns that conversion.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Seconds do not authorize arbitrary nearest-frame cuts; the structural union's dual-field allowance is disclosed together with the existing reader's frame precedence.

## @evidence contracts/development/common.md#meaningful-documentation

Defines frame/second units, production-clock ownership, numerical tolerance, dual-field precedence and the engine reader's failure conditions.
