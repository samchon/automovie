# src/geometry/extract/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IPlane

## @evidence contracts/development/common.md#meaningful-documentation

States the units, the orthonormal premise and the normal's orientation.

## @evidence contracts/development/design.md#principled-representation

A course plane is a station with an origin and two chart axes; the normal is derived, so it cannot disagree with them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A course cut extends the shared loft section frame with its station label; the same millimetre origin and u/v convention serve both producers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Orthonormality remains a producer premise, not re-checked; the station is only a label for ordering and interpolation, not assumed to be arclength.

# src/geometry/extract/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IQuarter

## @evidence contracts/development/common.md#meaningful-documentation

States rho's definition, its admissible range and its millimetre scale.

## @evidence contracts/development/design.md#principled-representation

The measured share and the corner reach that turns a share into millimetres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the trace's reduction and its diagnostics.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null is kept for a loop that never meets the segment instead of a default value.

# src/geometry/extract/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IPiece

## @evidence contracts/development/common.md#meaningful-documentation

States the guides, the arc, the split point, its tangent reading, the two pieces and every null meaning.

## @evidence contracts/development/design.md#principled-representation

The loop's own arc between two guide points (each tangent along its support line) split at that arc's shoulder point, each piece a conic on its two ends and tangent lines with its own shoulder read on its own sub-arc (#3158).

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the trace's split runs and receipt.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing crossing or an unmet tangent pair stays null; nothing is clamped.

# src/geometry/extract/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IFeature

## @evidence contracts/development/common.md#meaningful-documentation

States the two kinds, the point's chart and the value's meaning.

## @evidence contracts/development/design.md#principled-representation

A crest (a local maximum of the support, the loop convex there) or a notch (a local minimum facing the same way, the loop concave there), with its point and support value.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the trace's receipt and its feature lines.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Only features standing out by the walk's tolerance are reported; nothing is smoothed or merged, and no loop point is dropped.

# src/geometry/extract/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IReading

## @evidence contracts/development/common.md#meaningful-documentation

States the extents' order and signs, the touch offsets' meaning, the features' order and the quarter order.

## @evidence contracts/development/design.md#principled-representation

The four-quarter view section's own inputs (four support lines and four shoulders) plus the touch offsets and the features that report what those inputs leave out.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each member is read by the trace or its receipt.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values are the loop's own; nothing is admitted or refused here.

# src/geometry/extract/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.ISection

## @evidence contracts/development/common.md#meaningful-documentation

States every member's unit and frame and exactly when each is null.

## @evidence contracts/development/design.md#principled-representation

The cut's own flags beside the holding loop and its in-plane readings; `loop`, `reading`, `area` and `reach` are null together when no loop holds the course point, and `normal` and `centroid` are also null for a zero-area loop, where neither exists.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each member feeds the trace, its diagnostics or its receipt.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No loop reading is defaulted to zero; the nulls are the producer's guarantee, documented rather than encoded as a union because the trace reads them through one guard.
