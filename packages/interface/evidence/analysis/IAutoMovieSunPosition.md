# src/analysis/IAutoMovieSunPosition.ts#IAutoMovieSunPosition

## @evidence contracts/development/common.md#meaningful-documentation

States the producer and consumer, that the angles are topocentric and in degrees, each angle's reference and range, the azimuth's compass convention and the refraction threshold that decides whether elevation is refracted.

## @evidence contracts/development/design.md#principled-representation

Three degree angles in the observer's horizon frame: zenith from the vertical, azimuth eastward from north, elevation above the horizon. Elevation and zenith are redundant by `zenith = 90 - elevation`, kept both because the cited report states its results as zenith while staging reads elevation; the solver writes them from one value so they cannot disagree. Ranges are documented, not typed, because TypeScript cannot bound numbers.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns it; `solveAutoMovieSunPosition` writes it and `autoMovieSunDirection` reads azimuth and elevation. It carries no declination, hour angle or distance, which no consumer reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional field or alternative shape exists; a sun below the horizon is the same record with a negative elevation.
