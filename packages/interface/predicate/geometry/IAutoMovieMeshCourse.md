# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IPlane

## @evidence contracts/development/common.md#meaningful-documentation

A cross-section frame with an explicit station label in millimetres.

## @evidence contracts/development/design.md#principled-representation

The course cutter uses the supplied origin and U/V directions, with the cross product V ? U facing along the course.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A plane borrows the shared loft frame that already owns chart coordinates. The additional station label supports cross-section comparisons.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IPlane.station

## @evidence contracts/development/common.md#meaningful-documentation

An authored millimetre station label. Course comparisons interpolate by these labels, and each plane's origin independently locates the cut.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IQuarter

## @evidence contracts/development/common.md#meaningful-documentation

Signed conic shoulder ratio and its millimetre distance scale, read from a closed section loop.

## @evidence contracts/development/design.md#principled-representation

The reader takes the outermost crossing on the radial segment and preserves a negative ratio when the crossing lies between the origin and the guide chord.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ratio and reach carry measured shape and scale. A conic caller decides whether the ratio falls in its required interval.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IQuarter.rho

## @evidence contracts/development/common.md#meaningful-documentation

Signed radial crossing parameter with 0 at the guide chord midpoint and 1 at its box corner. An absent crossing gives null.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IQuarter.reach

## @evidence contracts/development/common.md#meaningful-documentation

Millimetre distance from the guide chord midpoint to its box corner. Multiplying the ratio by this value produces its signed physical displacement.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IPiece

## @evidence contracts/development/common.md#meaningful-documentation

Two conic candidate intervals separated at a measured shoulder crossing of the source polyline.

## @evidence contracts/development/design.md#principled-representation

The splitter keeps the actual crossed polyline segment, derives its forward tangent, then searches first and second sub-arcs separately.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result carries the observed split and the two candidate readings. The caller retains source guides and arcs.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IPiece.split

## @evidence contracts/development/common.md#meaningful-documentation

Outermost measured shoulder crossing in chart millimetres. A missed segment gives null.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IPiece.angle

## @evidence contracts/development/common.md#meaningful-documentation

Forward direction of the crossed polyline edge in radians from +U toward +V. It is null when the split is absent.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IPiece.shoulders

## @evidence contracts/development/common.md#meaningful-documentation

First-arc then second-arc conic ratios. Either may be null when that sub-arc has no admitted shoulder crossing.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IPiece.reach

## @evidence contracts/development/common.md#meaningful-documentation

First-arc then second-arc distance scales in millimetres. A sub-arc can have a finite scale and no crossing ratio.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IFeature

## @evidence contracts/development/common.md#meaningful-documentation

One facing crest or notch of a polygonal loop in a support direction.

## @evidence contracts/development/design.md#principled-representation

The course reader reports support extrema in four facing directions, ordered by phase within each direction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The support direction lives in the containing reading slot. The feature carries its own point, support and classification.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IFeature.kind

## @evidence contracts/development/common.md#meaningful-documentation

Crest marks a support maximum. Notch marks a support minimum facing the same direction.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IFeature.point

## @evidence contracts/development/common.md#meaningful-documentation

Measured polygon vertex in chart millimetres.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IFeature.value

## @evidence contracts/development/common.md#meaningful-documentation

Projection of the chart point onto the given unit support direction, in millimetres.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IReading

## @evidence contracts/development/common.md#meaningful-documentation

Four support limits, axial contact offsets, facing features and shoulder readings of a closed loop holding the chart origin.

## @evidence contracts/development/design.md#principled-representation

The course reader measures supports on existing loop vertices and quarter ratios on the polygonal edges between them.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This record describes one loop. The caller retains its station, loop geometry and comparisons with neighbouring planes.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IReading.extents

## @evidence contracts/development/common.md#meaningful-documentation

Coordinates of the maximum U, minimum U, maximum V and minimum V vertices in that order, in millimetres.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IReading.touch

## @evidence contracts/development/common.md#meaningful-documentation

Perpendicular coordinate of each selected extent vertex, in millimetres. The first loop vertex wins an exact tie.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IReading.features

## @evidence contracts/development/common.md#meaningful-documentation

Facing feature lists for +U, ?U, +V and ?V, with each list ordered by increasing phase from ??.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.IReading.quarters

## @evidence contracts/development/common.md#meaningful-documentation

Conic shoulder readings from the successive axis-guide pairs +U/+V, +V/?U, ?U/?V and ?V/+U.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.ISection

## @evidence contracts/development/common.md#meaningful-documentation

Course-plane section with a selected enclosing loop and independent cut and cross-station qualifications.

## @evidence contracts/development/design.md#principled-representation

The cutter chooses the first area-ordered outer loop holding chart origin and lifts its points to the supplied plane for Newell measurements.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result borrows its authored plane and owns the generated loop and diagnostics. Missing holding geometry is represented by nulls.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.ISection.plane

## @evidence contracts/development/common.md#meaningful-documentation

The original input plane in caller order. Its station label and coordinate tuples remain shared with the caller.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.ISection.pieces

## @evidence contracts/development/common.md#meaningful-documentation

Count of admitted closed outer envelopes after bridge processing, including bodies that miss chart origin.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.ISection.loop

## @evidence contracts/development/common.md#meaningful-documentation

First outer contour holding chart origin, in chart millimetres, or null if no contour holds it.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.ISection.reading

## @evidence contracts/development/common.md#meaningful-documentation

Extents, touches, features and quarters of the holding loop. Null means no holding loop.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.ISection.normal

## @evidence contracts/development/common.md#meaningful-documentation

Unit Newell normal in the input mesh frame. It is null when no loop exists or the Newell vector has zero length.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.ISection.centroid

## @evidence contracts/development/common.md#meaningful-documentation

Area centroid of the lifted holding loop in input-frame millimetres. It may be null for missing or degenerate area.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.ISection.area

## @evidence contracts/development/common.md#meaningful-documentation

Half the lifted Newell vector's length, in square millimetres. A missing holding loop gives null.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.ISection.reach

## @evidence contracts/development/common.md#meaningful-documentation

Largest radial distance of a holding-loop vertex from the course point, in millimetres. It is null for a missing loop.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.ISection.flags

## @evidence contracts/development/common.md#meaningful-documentation

Original slice diagnostics for open, bridged or unclosed chains.

# src/geometry/IAutoMovieMeshCourse.ts#IAutoMovieMeshCourse.ISection.checks

## @evidence contracts/development/common.md#meaningful-documentation

Interior-plane jumps of the selected loop's extents or measured shoulder displacements from a line between adjacent station labels.
