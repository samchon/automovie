# src/human/generation/IAutoMovieHumanHeadNeck.ts#IAutoMovieHumanHeadNeck

## @evidence contracts/development/common.md#meaningful-documentation

Retained neck placement and the active lower-head generating sources.

## @evidence contracts/development/design.md#principled-representation `level`: Section mean height, distinct from the adopted posterior C7 point, calibration mm. `x`: Centre ahead of the origin. `radius`: Circle-equivalent scale G/(2*pi); this alone does not close a noncircular head-mass section's actual tape.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHeadLandmarks.layout, AutoMovieHumanHeadNeckScalars.axis. Also types AutoMovieHumanNeckSource.registration.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `base`: Base tape and resolved heights in calibration mm, scaled once by HeadLayout; absent on retired layout readers. `registration`: One explicit AP rigid registration from local harmonic prior to the common body frame, calibration mm. `curves`: Actual lower-head radius/origin and named-height course, authored before the final mass.
