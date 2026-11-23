# src/index.ts#buildAutoMovieInspectionMarks

## @evidence contracts/development/common.md#meaningful-documentation

States how each shape is drawn, the colour and placement rules, when coordinates are reread and the one thing that may not change, and every refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Coordinates are in the anchor's local frame, so the drawn object takes the anchor's world matrix and the coordinates themselves are never transformed. An arrow head is drawn as four lines from the tip back a quarter of the arrow's length and out half of that on two perpendicular axes, a drawing convention that reads as a direction from any view.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admission and counting per set, one fill of colours, one fill of positions shared by build and update, then the overlay record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A malformed mark is refused instead of drawn short, and no kind or path changes how a mark is drawn.

## @evidence contracts/development/implementation.md#efficient-algorithms

Building and each update are linear in the drawn vertices; every set is at most two draw calls whatever the number of marks and colours.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The line and point objects come from the shared factories and placement from `followAutoMovieInspectionSource`; the buffers built once are rewritten in place on every update.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The overlay owns its group, geometries and materials and releases them in `dispose`; it borrows the anchors and the marks' coordinate arrays.
