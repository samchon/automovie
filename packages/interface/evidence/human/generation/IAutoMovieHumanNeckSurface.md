# src/human/generation/IAutoMovieHumanNeckSurface.ts#IAutoMovieHumanNeckSurface.ISection

## @evidence contracts/development/design.md#principled-representation

Owner and material station identify the source; sampled points preserve its frame and lift independently of scalar measurements. `chain`: Source chain owning this course. `stationMm`: Continuous material address in calibration millimetres, not world Y. `requestedHeight`: Requested world centre height in metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One record carries the source address, display geometry and independently measured metrics required by the polygon consumer. Returned by AutoMovieHumanNeckSurfaceSampling.section. Also types AutoMovieHumanNeckSurface.lower, AutoMovieHumanNeckSurface.sections.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The record separates requested height, actual centre and measured source perimeter instead of asserting that the display polygon meets a target. Required fields are `chain`, `stationMm`, `requestedHeight`, `centre`, `frame`, `points`, `sourcePhases`, `displayCoordinates`, `circumference`, `breadth`, `depth`; callers supply the complete record.

## @evidence contracts/development/common.md#meaningful-documentation

Every field states its ownership, units or sampling meaning, including the millimetre material address. One actual source course, sampled at the common display phases.

# src/human/generation/IAutoMovieHumanNeckSurface.ts#IAutoMovieHumanNeckSurface.IOutput

## @evidence contracts/development/design.md#principled-representation

Per-course phases retain source addresses while projected-polygon coordinates define display joins; requested height, achieved centre height and public circumference retain separate meanings. `units`: Physical output units; only stationMm retains the source chart's mm. `bandDefinition`: Public neck length defines a display band, not an anatomical jaw boundary. `phases`: Source sample phases in radians; their numbers do not assert cross-chart material correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result contains only neck and head geometry and metadata consumed by the existing polygon display. Returned by AutoMovieHumanNeckSurface.derive. Also types AutoMovieHumanSkeleton.neckSurface.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Public circumference is optional metadata and never replaces source measurements or points. `publicTargetCircumference`: Public neck circumference input in metres, never used to resize points.

## @evidence contracts/development/common.md#meaningful-documentation

The fields distinguish physical units, source chart units, phase order and display conventions. Prepared neutral neck exterior; no full calibration is retained.
