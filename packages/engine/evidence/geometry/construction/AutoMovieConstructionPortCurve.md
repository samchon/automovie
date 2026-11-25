# src/geometry/construction/AutoMovieConstructionPortCurve.ts#AutoMovieConstructionPortCurve.chart

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original ellipse-ray share and inward vector formulas in their original arithmetic order; shape derivatives are not asserted.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One clock and two column maps replace the same PortRealize block.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Caller admission retains count/loop validity; this extraction adds no clamp, inverse or geometry correction.

## @evidence contracts/development/common.md#meaningful-documentation

Stations/directions along station use mm and phase components radians per normalized radial variable.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(count) arithmetic and retained address/direction pairs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure chart pass has no cross-call work to retain.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Both returned arrays belong to the caller; no surface, cache or process is retained.

# src/geometry/construction/AutoMovieConstructionPortCurve.ts#AutoMovieConstructionPortCurve.curve

## @evidence contracts/development/implementation.md#principled-implementation

The node's ellipse with its per-column shares joined by the periodic cubic, the same law the curved rail uses for its distances; the columns keep their existing addresses, which this curve interpolates to rounding.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One share field and closed-form readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a share field whose controls reach zero instead of clamping it; no sampled inverse.

## @evidence contracts/development/common.md#meaningful-documentation

States the polar form, the foot and the inside test.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(count) to prepare, constant per reading.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One share field serves every reader.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the share field and the column arrays.

# src/geometry/construction/AutoMovieConstructionPortCurve.ts#AutoMovieConstructionPortCurve.correspondence

## @evidence contracts/development/implementation.md#principled-implementation

Delegates to the verbatim extracted angle/length correspondence; original Newell, arclength and48-step inverse arithmetic is unchanged.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One closed selection serves the real strip and original root calibration.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not accept a nonmonotone angle graph, fabricate missing surface data or fit a new physical cut.

## @evidence contracts/development/common.md#meaningful-documentation

Surface/loop points use mm; output phases use the original unwrapped radians and direction.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preserves the existing8n surface samples,48 angle bisections and bounded arclength matching work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both consumers share this sole formula owner; each call retains only its own original reading.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary ring arrays are released at return and only phases or the original refusal survive.
