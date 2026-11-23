# src/analysis/solveAutoMovieSunPosition.ts#solveAutoMovieSunPosition

## @evidence contracts/development/implementation.md#principled-implementation

Meeus (1998) chapter 7 Julian Day, chapter 25 low-accuracy solar coordinates with the principal nutation and aberration terms, chapter 12 sidereal time with the equation of the equinoxes, then Reda and Andreas (2004) equations 26 to 37 for parallax, 42 for refraction and 44 to 46 for the azimuth. Meeus states 0.01 degrees within a few centuries of 2000, so distant years lose accuracy; the report's example site is met within 0.005 degrees. UTC feeds both clocks, which the issue and the method accept because terrestrial time moves the sun by under 0.001 degrees. Refraction is skipped below -0.8333 degrees, where the cited formula is not defined for a sun under the horizon. Poles are admitted; the azimuth there follows `atan2` of the cited formula.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function holds the astronomical chain in the order the sources state it; the Julian Day and the admission checks are private helpers because each answers a separate question.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every coefficient is the cited source's; no case is special-cased. The refraction floor and Earth constants are named with their source.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation names each source equation, the timescale choice and its error bound, the parallax and refraction rules, the stated accuracy and the thrown refusals.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant time: a fixed number of trigonometric evaluations per call.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call depends only on its inputs, and callers solve one instant at a time; there is no shared work to reuse.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one result record and retains nothing.
