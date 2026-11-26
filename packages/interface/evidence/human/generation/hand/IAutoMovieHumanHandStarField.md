# src/human/generation/hand/IAutoMovieHumanHandStarField.ts#IAutoMovieHumanHandStarField

## @evidence contracts/development/common.md#meaningful-documentation

A star read at any station: the natural splines, along the hand, of the inner point's `[b, c]`, the half extents and the harmonics of the skin's radius about that point (`AutoMovieHumanArmPrior.IStar`).

## @evidence contracts/development/design.md#principled-representation `stations`: Stations `a` along the hand the series were read at, increasing, mm of the form. `splines`: One natural spline per series column, over the stations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHandStar.star. Read by AutoMovieHumanHandStar.starPoint, AutoMovieHumanHandStar.wholeSkin, AutoMovieHumanHandStar.palmSkin. Also types AutoMovieHumanHandForm.whole, AutoMovieHumanHandForm.palm.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `stations`, `splines`; callers supply the complete record.
