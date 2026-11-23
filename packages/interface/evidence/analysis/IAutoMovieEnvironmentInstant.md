# src/analysis/IAutoMovieEnvironmentInstant.ts#IAutoMovieEnvironmentInstant

## @evidence contracts/development/design.md#principled-representation

Context validation checks finite sun components with length above 1e-12, non-negative finite illuminances, null or finite temperature and null or [0,1] humidity. It requires zero direct beam for a non-positive normalized sun/up dot product only when both measured norms are finite and above 1e-12; an overflowing norm can skip that check.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Scalar fields hold declared sun, sky and outdoor air quantities, nullable where a study does not need them; outdoorRelativeHumidity currently has validation but no analysis consumer, so it promises no humidity-dependent result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The sun stays a declared vector, which `autoMovieSunDirection` computes from `solveAutoMovieSunPosition` so the instant and a staged sun light share one position; no sky model or weather default exists, and an instant without outdoor air temperature makes the envelope study return `not-run` instead of assuming a value, and the unread humidity field is stated as unread.

## @evidence contracts/development/common.md#meaningful-documentation

States that the sun is declared and which functions derive it, that illuminance stays declared, the units and ranges of every quantity, the horizon rule and its reference, the null meaning of both outdoor fields, and which solver reads which field.
