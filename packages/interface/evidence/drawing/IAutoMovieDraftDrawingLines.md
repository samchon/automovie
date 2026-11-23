# src/drawing/IAutoMovieDraftDrawingLines.ts#IAutoMovieDraftDrawingLines

## @evidence contracts/development/design.md#principled-representation

IProps joins validated world geometry with a page-metre frame; IResult separates canonical strokes from unresolved model counts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

deriveAutoMovieDrawing supplies a shared index/filter and receives linework plus the count needed to report its geometry gap.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The contracts preserve missing-geometry information and distinguish depth classification from occlusion without introducing renderer state.

## @evidence contracts/development/common.md#meaningful-documentation

Inputs document callback/validation duties and results document rounding, identity and exact count scope.

# src/drawing/IAutoMovieDraftDrawingLines.ts#IAutoMovieDraftDrawingLines.IProps

## @evidence contracts/development/design.md#principled-representation

World geometry is projected onto an orthonormal page frame in metres; cut/depth classification uses the view's metre bands. Matching frame, cut flag and design index are caller premises not encoded by this record.

## @evidence contracts/development/design.md#minimal-and-owned-surface

deriveAutoMovieDrawing shares one design index across linework, openings and dimensions; the predicate supplies only kind/space selection without introducing viewer state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unresolved external geometry is counted, and depth roles do not claim occlusion. The callback is synchronous selection data rather than a renderer dependency.

## @evidence contracts/development/common.md#meaningful-documentation

States validation ownership, projection units, filtering, cache lifetime and the callback's call/exception behavior.

# src/drawing/IAutoMovieDraftDrawingLines.ts#IAutoMovieDraftDrawingLines.IResult

## @evidence contracts/development/design.md#principled-representation

Canonical line records preserve owner/role identity and page geometry; the nonnegative integer counter describes omitted model lookups rather than geometric invisibility.

## @evidence contracts/development/design.md#minimal-and-owned-surface

deriveAutoMovieDrawing places lines in the drawing and turns unresolvedModels into the external-model-geometry gap; both fields are produced in the same walk.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Missing model geometry is exposed explicitly instead of replaced by a box or silently treated as an empty successful drawing.

## @evidence contracts/development/common.md#meaningful-documentation

Gives ordering, grid units, deduplication identity, empty-output meaning and exact unresolved-count scope.
