# src/human/generation/IAutoMovieHumanEyelid.ts#IAutoMovieHumanEyelid.ILid

## @evidence contracts/development/common.md#meaningful-documentation

Evaluated margin of one eye.

## @evidence contracts/development/design.md#principled-representation `name`: Aperture name, e.g. `globe`: Seated globe. `samples`: Samples at uniform phases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanEyelid.create. Read by AutoMovieHumanEyelidSurface.loop. Also types AutoMovieHumanBodyApertures.lid.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `globe`, `samples`, `medial`, `lateral`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanEyelid.ts#IAutoMovieHumanEyelid.IGlobe

## @evidence contracts/development/common.md#meaningful-documentation

Seated globe frame in calibration mm.

## @evidence contracts/development/design.md#principled-representation `centre`: Centre of the scleral ellipsoid. `forward`: Unit gaze direction, the aperture's `forward`. `up`: Unit up, orthogonal to `forward`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanEyelid.seat. Read by AutoMovieHumanEyelid.surface, AutoMovieHumanEyelidProfile.generate. Also types AutoMovieHumanEyelid.globe.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `centre`, `forward`, `up`, `lateral`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanEyelid.ts#IAutoMovieHumanEyelid.ISample

## @evidence contracts/development/common.md#meaningful-documentation

One margin sample.

## @evidence contracts/development/design.md#principled-representation `phase`: Phase of the aperture series, radians. `contact`: Posterior lid edge, on the globe where the globe lies behind it. `anterior`: Anterior lid edge, the lash line.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanEyelidProfile.generate. Also types AutoMovieHumanEyelid.samples, AutoMovieHumanEyelidSurface.sample.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `phase`, `contact`, `anterior`, `outward`, `tangent`, `rho`, `upper`, `corner`, `position`, `thickness`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanEyelid.ts#IAutoMovieHumanEyelid.IRule

## @evidence contracts/development/common.md#meaningful-documentation

Lid rule constants in mm.

## @evidence contracts/development/design.md#principled-representation `band`: Projected width of rebuilt lid skin outside the contact line, millimetres. `upper`: Upper-lid margin depth along the line of sight, millimetres. `lower`: Lower-lid margin depth along the line of sight, millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanEyelid.IRule is the canonical exchange used by AutoMovieHumanEyelid.rule.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `band`, `upper`, `lower`, `offset`, `taper`, `merge`, `gap`, `clearance`; callers supply the complete record.
