# src/production/IAutoMovieModelPartPoints.ts#IAutoMovieModelPartPoints.IResult

## @evidence contracts/development/design.md#principled-representation

Every point is in model metres after part and attached-bone rest placement; complete coordinate triples are read in source order and trailing partial triples are ignored.

## @evidence contracts/development/design.md#minimal-and-owned-surface

autoMovieModelPartPoints prepares per-part and combined vertices for subject description; the map is keyed by the original model part objects, not their ids.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

parts and all deliberately share point objects while owning their new collections; mutating a point through either view changes the other view, but not the input mesh coordinates.

## @evidence contracts/development/common.md#meaningful-documentation

Model-frame vertex collections sharing one set of transformed point objects. Every point is in model metres after part and attached-bone rest placement; complete coordinate triples are read in source order and trailing partial triples are ignored.
