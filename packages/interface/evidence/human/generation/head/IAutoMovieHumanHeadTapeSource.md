# src/human/generation/head/IAutoMovieHumanHeadTapeSource.ts#IAutoMovieHumanHeadTapeSource.IPlane

## @evidence contracts/development/design.md#principled-representation

Actual original phase0/pi points determine Y=a+bX. `a`: Superior-axis intercept, mm. `b`: Front-higher sagittal slope, dimensionless. `front`: Actual phase0 anterior anchor, world mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The plane stores physical source bounds and two scalar coefficients. Returned by AutoMovieHumanHeadTapeSource.plane. Read by AutoMovieHumanHeadTapeSource.at, AutoMovieHumanHeadTapeSource.course, AutoMovieHumanHeadTapeSource.measure. Also types AutoMovieHumanHeadTape.plane, AutoMovieHumanHeadTapeBrow.plane.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

These are generating-source anchors, not camera coordinates or reference-fit points. Required fields are `a`, `b`, `front`, `back`, `range`; callers supply the complete record.

## @evidence contracts/development/common.md#meaningful-documentation

a is mm, b is dimensionless and range is increasing physical station mm. Specified sagittally inclined plane and actual anterior/posterior anchors.

# src/human/generation/head/IAutoMovieHumanHeadTapeSource.ts#IAutoMovieHumanHeadTapeSource.IReader

## @evidence contracts/development/design.md#principled-representation

Keeps generating supports, fullness and actual frame owner together. `part`: Identical original mass, calibration mm. `source`: Its admitted signed scalar and fullness owners.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two references supply the original reader. Returned by AutoMovieHumanHeadTapeSource.of. Read by AutoMovieHumanHeadTape.maximum, AutoMovieHumanHeadTapeBrow.maximum, AutoMovieHumanHeadTapeSource.plane. Also types AutoMovieHumanHeadTape.reader.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No retained principal section or mesh replaces the original definition. Required fields are `part`, `source`; callers supply the complete record.

## @evidence contracts/development/common.md#meaningful-documentation

Source station and world coordinates use calibration mm. Same actual mass and admitted complete original scalar family.

# src/human/generation/head/IAutoMovieHumanHeadTapeSource.ts#IAutoMovieHumanHeadTapeSource.IReading

## @evidence contracts/development/design.md#principled-representation

The derivative differentiates the same implicit plane/source intersection as the point. `station`: Actual physical source station, mm. `point`: Original world point, mm. `derivative`: Total world derivative along the plane course, mm per radian.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Point, station and one tangent expose the course independently of integration. Returned by AutoMovieHumanHeadTapeSource.at, AutoMovieHumanHeadTapeSource.course.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing source/frame derivatives are never zero-filled. Required fields are `station`, `point`, `derivative`; callers supply the complete record.

## @evidence contracts/development/common.md#meaningful-documentation

Point/station use mm and derivative uses mm per radian. Actual world point and derivative per radian of its source polar phase.

# src/human/generation/head/IAutoMovieHumanHeadTapeSource.ts#IAutoMovieHumanHeadTapeSource.MeasureResult

## @evidence contracts/development/common.md#meaningful-documentation

Integrate the actual source spans with the shared engine rule.

## @evidence contracts/development/design.md#principled-representation

Integrate the actual source spans with the shared engine rule. IAutoMovieCurveLengthMeasurement64 retains the referenced owner's constraints and mutability.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadTapeSource.MeasureResult is the canonical exchange used by AutoMovieHumanHeadTapeSource.measure.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadTapeSource.measure for integrate the actual source spans with the shared engine rule.
