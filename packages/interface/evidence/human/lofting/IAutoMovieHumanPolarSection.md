# src/human/lofting/IAutoMovieHumanPolarSection.ts#IAutoMovieHumanPolarSection.ISection

## @evidence contracts/development/common.md#meaningful-documentation

Polar measures of one closed polygon.

## @evidence contracts/development/design.md#principled-representation `centre`: Area centroid `[x, z]`, mm. `radius`: Radius of the circle of the same area, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanPolarSection.measure. Also types AutoMovieHumanLegLaw.ankleSection, AutoMovieHumanLegLaw.crotchSection.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `centre`, `radius`; callers supply the complete record.

# src/human/lofting/IAutoMovieHumanPolarSection.ts#IAutoMovieHumanPolarSection.MeasurePolygon

## @evidence contracts/development/common.md#meaningful-documentation

Area centroid and equivalent radius of a closed polygon `[x, z]`.

## @evidence contracts/development/design.md#principled-representation

Area centroid and equivalent radius of a closed polygon `[x, z]`. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanPolarSection.MeasurePolygon is the canonical exchange used by AutoMovieHumanPolarSection.measure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanPolarSection.measure for area centroid and equivalent radius of a closed polygon `[x, z]`.

# src/human/lofting/IAutoMovieHumanPolarSection.ts#IAutoMovieHumanPolarSection.RadiusPolygon

## @evidence contracts/development/common.md#meaningful-documentation

Farthest crossing of a ray from a point with a closed polygon.

## @evidence contracts/development/design.md#principled-representation

Farthest crossing of a ray from a point with a closed polygon. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanPolarSection.RadiusPolygon is the canonical exchange used by AutoMovieHumanPolarSection.radius.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanPolarSection.radius for farthest crossing of a ray from a point with a closed polygon.

# src/human/lofting/IAutoMovieHumanPolarSection.ts#IAutoMovieHumanPolarSection.RadiusOrigin

## @evidence contracts/development/common.md#meaningful-documentation

Farthest crossing of a ray from a point with a closed polygon.

## @evidence contracts/development/design.md#principled-representation

Farthest crossing of a ray from a point with a closed polygon. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanPolarSection.RadiusOrigin is the canonical exchange used by AutoMovieHumanPolarSection.radius.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanPolarSection.radius for farthest crossing of a ray from a point with a closed polygon.
