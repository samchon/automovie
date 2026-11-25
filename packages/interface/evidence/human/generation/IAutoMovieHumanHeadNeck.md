# src/human/generation/IAutoMovieHumanHeadNeck.ts#IAutoMovieHumanHeadNeck

## @evidence contracts/development/common.md#meaningful-documentation

Retained neck placement and the active lower-head generating sources.

## @evidence contracts/development/design.md#principled-representation `level`: Section mean height, distinct from the adopted posterior C7 point, calibration mm. `x`: Centre ahead of the origin. `radius`: Circle-equivalent scale G/(2*pi); this alone does not close a noncircular head-mass section's actual tape.

`normalBandUpper` retains the upper datum from the shared generating neck. The named height is available before the angle and posterior support are derived, so their inverse projection does not need to reconstruct its binary64 coordinate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHeadLandmarks.layout, AutoMovieHumanHeadNeckScalars.axis. Also types AutoMovieHumanNeckSource.registration.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `base`: Base tape and resolved heights in calibration mm, scaled once by HeadLayout. `registration`: Rigid AP registration from the local section frame to the common body frame. `curves`: Actual lower-head radius, origin and named-height course authored before assembling the mass.
