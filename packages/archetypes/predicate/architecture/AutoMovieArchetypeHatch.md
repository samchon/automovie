# src/architecture/AutoMovieArchetypeHatch.ts#AutoMovieArchetypeHatch.create

## @evidence contracts/development/common.md#meaningful-documentation

States the roof opening size, fixed curb, moving cover and default mass.

## @evidence contracts/development/implementation.md#principled-implementation

The curb defines one fixed aperture. One hinge carries the steel cover, and the push site stays on its underside during travel.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reads one mass and builds the fixed curb panels, one cover and three contact frames directly.

# src/architecture/AutoMovieArchetypeHatch.ts#AutoMovieArchetypeHatch.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the recorded mass interval and its units.

# src/architecture/AutoMovieArchetypeHatch.ts#AutoMovieArchetypeHatch.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Names the stable scene ID default.

# src/architecture/AutoMovieArchetypeHatch.ts#AutoMovieArchetypeHatch.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

States the unit of the only drawn dimension.

# src/architecture/AutoMovieArchetypeHatch.ts#AutoMovieArchetypeHatch.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the moving cover and fixed opening sites.

## @evidence contracts/development/design.md#principled-representation

The hinge on one edge carries the cover whose underside push moves with it, while the opening remains at curb height.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three names cover the moving body, the push contact and the fixed route.

# src/architecture/AutoMovieArchetypeHatch.ts#AutoMovieArchetypeHatch.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the whole mass as the measured setting.

## @evidence contracts/development/design.md#principled-representation

Opening and cover geometry follow fixed dimensions, and the chosen mass records the complete prop weight.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One numeric key is sufficient to expose the actual draw.

# src/architecture/AutoMovieArchetypeHatch.ts#AutoMovieArchetypeHatch.IParams

## @evidence contracts/development/common.md#meaningful-documentation

Names scene identity and admitted mass.

## @evidence contracts/development/design.md#principled-representation

The size remains defined by the stock body and the mass is validated against the recorded band.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only ID and mass are authorable in the actual hatch factory.
