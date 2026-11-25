# src/human/generation/IAutoMovieHumanBackProfile.ts#IAutoMovieHumanBackProfile.IShape

## @evidence contracts/development/common.md#meaningful-documentation

One sex's back shape, the survey's means; angles in degrees, length in mm.

## @evidence contracts/development/design.md#principled-representation `kyphosis`: Kyphosis angle: between the surface tangents at C7 and at the thoracolumbar inflection. `lordosis`: Lordosis angle: between the tangents at the thoracolumbar inflection and at the PSIS level. `thoracicBending`: Thoracic bending angle: the chord C7 to the kyphosis apex from the vertical.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanBackProfile.SHAPE, AutoMovieHumanBackProfile.shape.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `kyphosis`, `lordosis`, `thoracicBending`, `trunkLength`, `stature`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBackProfile.ts#IAutoMovieHumanBackProfile.IKnot

## @evidence contracts/development/common.md#meaningful-documentation

One knot of the back line: a height, its forward place and the place's first and second derivatives in height.

## @evidence contracts/development/design.md#principled-representation `name`: The knot's anatomical name. `y`: Height above the floor, mm. `x`: Forward place relative to cervicale's, mm (negative behind it).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanBackProfile.knots.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `y`, `x`, `slope`, `curvature`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBackProfile.ts#IAutoMovieHumanBackProfile.IProfile

## @evidence contracts/development/common.md#meaningful-documentation

A person's back line.

## @evidence contracts/development/design.md#principled-representation `knots`: The five knots, from cervicale down. `radii`: The thoracic and lumbar arcs' radii, mm. `at`: The forward place at a height relative to cervicale's, with its first and second derivatives in height; above cervicale it holds cervicale's tangent, below the PSIS level it runs on along that level's tangent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanBackProfile.of. Also types AutoMovieHumanTrunkLaws.profile.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `knots`, `radii`, `at`; callers supply the complete record.

# src/human/generation/IAutoMovieHumanBackProfile.ts#IAutoMovieHumanBackProfile.IColumn

## @evidence contracts/development/common.md#meaningful-documentation

The thoracic and lumbar columns' lengths, mm: Gray 1918's 28 cm and 18 cm of a 71 cm male column; only their ratio is read.

## @evidence contracts/development/design.md#principled-representation `thoracic`: Reference thoracic column length, millimetres; only its ratio to lumbar length enters the curve. `lumbar`: Reference lumbar column length, millimetres; only its ratio to thoracic length enters the curve.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanBackProfile.IColumn is the canonical exchange used by AutoMovieHumanBackProfile.COLUMN.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `thoracic`, `lumbar`; callers supply the complete record.
