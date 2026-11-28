# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IControls

## @evidence contracts/development/common.md#meaningful-documentation

Numeric admission and work caps for open convex support-loft realization.

## @evidence contracts/development/design.md#principled-representation

The public controls check finite positive tolerance, a direction sine strictly between zero and one, and safe integer budgets with zero allowed for events.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Controls can be shared with Recovery. The actual recipe and physical identity belong to the realization input.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IControls.tolerance

## @evidence contracts/development/common.md#meaningful-documentation

Finite positive metre limit for ruled-face interpolation within the numerical event partition.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IControls.maxPlanes

## @evidence contracts/development/common.md#meaningful-documentation

Positive safe-integer maximum of supplied support planes. The realizer also requires at least three planes.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IControls.maxEvents

## @evidence contracts/development/common.md#meaningful-documentation

Nonnegative safe-integer cap on retained feasible interior event stations. Zero is supported.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IControls.maxCells

## @evidence contracts/development/common.md#meaningful-documentation

Positive safe-integer cap on ruled-face planning cells.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IControls.maxVertices

## @evidence contracts/development/common.md#meaningful-documentation

Positive safe-integer cap on emitted render vertices, checked before transferring the lateral mesh.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IControls.minimumDirectionSine

## @evidence contracts/development/common.md#meaningful-documentation

Finite minimum absolute direction determinant in (0, 1) for unit plane normals.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Authored adjacent cubic support spans, numerical controls and physical identity domain.

## @evidence contracts/development/design.md#principled-representation

The realizer plans sections from fixed oriented XZ half-planes and preserves exact shared span endpoints while isolating numerical boundary events.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The request combines one compact recipe with its execution limits and generated physical domain. Output buffers are computed independently.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IInput.loft

## @evidence contracts/development/common.md#meaningful-documentation

Metre-valued cubic offsets over ordered adjacent Y spans, with enclosing unit XZ directions and exact shared endpoint coefficients.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IInput.topologyDomain

## @evidence contracts/development/common.md#meaningful-documentation

Nonblank physical namespace for the generated loft instance. Stored physical vertex sources retain the supplied string.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Open lateral mesh, construction polylines and diagnostic receipts for one numerical support loft.

## @evidence contracts/development/design.md#principled-representation

The emitter generates the ruled surface with analytic normals and physical source identity. It records collapsed faces and repeated-boundary disagreement independently of the face interpolation tolerance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Geometry and diagnostics are returned separately within the result. The caller retains the source recipe and chooses how to consume each receipt.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IResult.mesh

## @evidence contracts/development/common.md#meaningful-documentation

Open lateral mesh in local metres with analytic unit normals. End caps and interior fill are absent.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IResult.construction

## @evidence contracts/development/common.md#meaningful-documentation

Sampled section and boundary polylines. Different lines may share the same coordinate tuples at canonical stations.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IResult.maximumBoundaryDefectMeters

## @evidence contracts/development/common.md#meaningful-documentation

Largest measured distance between evaluations of the same canonical boundary vertex, in metres.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IResult.omittedCollapsedTriangles

## @evidence contracts/development/common.md#meaningful-documentation

Count of proposed triangles omitted when two corners share a physical source identity.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IResult.events

## @evidence contracts/development/common.md#meaningful-documentation

Retained feasible interior event stations across the spans, excluding endpoints.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IResult.intervals

## @evidence contracts/development/common.md#meaningful-documentation

Total adjacent event-station intervals across all authored polynomial spans.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IResult.faceChordBoundMeters

## @evidence contracts/development/common.md#meaningful-documentation

Requested interpolation limit in metres within the numerical partition. Event isolation, boundary roundoff and source fit have separate qualifications.

# src/geometry/IAutoMovieRealizeConvexSupportLoft.ts#IAutoMovieRealizeConvexSupportLoft.IResult.eventQualification

## @evidence contracts/development/common.md#meaningful-documentation

Fixed marker for binary64 numerical event root and incidence classification.
