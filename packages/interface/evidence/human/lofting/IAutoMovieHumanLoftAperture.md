# src/human/lofting/IAutoMovieHumanLoftAperture.ts#IAutoMovieHumanLoftAperture

## @evidence contracts/development/common.md#meaningful-documentation

One skin opening in world millimetres; see {@link AutoMovieHumanLoftAperture}.

## @evidence contracts/development/design.md#principled-representation `name`: Name, e.g. `order`: Highest harmonic of each coordinate series. `coefficients`: Coefficients of x, y and z in turn, each `[a0, a1, b1, ..., aK, bK]`, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadEyeMargin.margin, AutoMovieHumanMouth.aperture. Read by AutoMovieHumanAperturePocket.loop, AutoMovieHumanApertureSeam.drawn, AutoMovieHumanBodyApertures.prepare. Also types AutoMovieHumanHeadAnchors.margin.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `pocket`: Depth of the closed pocket behind an opening with no globe, such as a nostril, mm: the margin is pushed this far back along `forward` and closed. `base`: Chain whose skin the opening lies on. `seam`: The line a slit opening closes on at rest.
