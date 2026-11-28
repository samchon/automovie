# src/geometry/AutoMovieRecoveryGeometry.ts#AutoMovieRecoveryGeometry.cross

## @evidence contracts/development/common.md#meaningful-documentation

Return the right-handed cross product of two vectors in the same Cartesian frame. Reversing the argument order reverses the direction.

## @evidence contracts/development/implementation.md#principled-implementation

The Recovery operation forwards the oriented three-component determinant to Engine's solid-vector owner. Unit axes give `x × y = z`, and the non-axis fixture independently gives (−3, 6, −3).

## @evidence contracts/development/implementation.md#efficient-algorithms

Read six input components and construct one owned three-component tuple.

# src/geometry/AutoMovieRecoveryGeometry.ts#AutoMovieRecoveryGeometry.dist

## @evidence contracts/development/common.md#meaningful-documentation

Measure Euclidean distance between two points in the same frame. The result uses their coordinate units.

## @evidence contracts/development/implementation.md#principled-implementation

Use the norm of the difference. The fixture supplies a displacement of (3, 4, 0), whose length is five regardless of input order.

## @evidence contracts/development/implementation.md#efficient-algorithms

A fixed set of coordinate differences and one Euclidean norm suffice.

# src/geometry/AutoMovieRecoveryGeometry.ts#AutoMovieRecoveryGeometry.dot

## @evidence contracts/development/common.md#meaningful-documentation

Return the Euclidean inner product of two vectors in the same frame.

## @evidence contracts/development/implementation.md#principled-implementation

Engine's solid-vector product sums the three paired components. The fixture's component products sum to 32, and perpendicular unit axes yield zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compute three products and add them without allocating a result vector.

# src/geometry/AutoMovieRecoveryGeometry.ts#AutoMovieRecoveryGeometry.len

## @evidence contracts/development/common.md#meaningful-documentation

Measure the Euclidean magnitude in the vector's coordinate units.

## @evidence contracts/development/implementation.md#principled-implementation

Engine's solid-vector owner takes the norm of the three components. The fixture's 3-4-12 vector gives magnitude 13.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fixed-size norm evaluation reads the supplied tuple.

# src/geometry/AutoMovieRecoveryGeometry.ts#AutoMovieRecoveryGeometry.mul

## @evidence contracts/development/common.md#meaningful-documentation

Scale a Cartesian vector by the supplied multiplier. Return a new tuple in its original frame.

## @evidence contracts/development/implementation.md#principled-implementation

The Engine owner multiplies each component by the same scalar. The authored mixed-sign vector gives (2, −4, 6) at scale two and zero at scale zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compute three products into one owned tuple.

# src/geometry/AutoMovieRecoveryGeometry.ts#AutoMovieRecoveryGeometry.norm

## @evidence contracts/development/common.md#meaningful-documentation

Normalize a nonzero Cartesian vector to a unit direction. A zero vector returns zero.

## @evidence contracts/development/implementation.md#principled-implementation

Measure the Euclidean magnitude and divide each component by it. The authored length-five vector normalizes to (0, 0.6, 0.8).

## @evidence contracts/development/implementation.md#efficient-algorithms

One magnitude calculation is shared by all three output components.

# src/geometry/AutoMovieRecoveryGeometry.ts#AutoMovieRecoveryGeometry.signedArea

## @evidence contracts/development/common.md#meaningful-documentation

Measure a polygon's signed area in its planar coordinate units squared. Counterclockwise order is positive. A contour with fewer than three vertices has zero area.

## @evidence contracts/development/implementation.md#principled-implementation

The Engine planar-area owner shifts coordinates to a common contour vertex before accumulating oriented area. The tests check unit squares at offsets up to 1e12 and the independent area-six 3-4 triangle.

## @evidence contracts/development/implementation.md#efficient-algorithms

One traversal accumulates the signed terms without copying a translated polygon.

# src/geometry/AutoMovieRecoveryGeometry.ts#AutoMovieRecoveryGeometry.sub

## @evidence contracts/development/common.md#meaningful-documentation

Subtract the second Cartesian tuple from the first. Both use the same frame and units.

## @evidence contracts/development/implementation.md#principled-implementation

Engine subtracts components at equal indices. The fixture's two points yield the ordered displacement (3, 4, 0).

## @evidence contracts/development/implementation.md#efficient-algorithms

Compute three differences and allocate one result tuple.

# src/geometry/AutoMovieRecoveryGeometry.ts#AutoMovieRecoveryGeometry.to2

## @evidence contracts/development/common.md#meaningful-documentation

Project a point onto a cutting plane's `u` and `v` directions from its origin. Return physical coordinates in the point's units.

## @evidence contracts/development/implementation.md#principled-implementation

Project the origin-relative displacement onto both supplied axes. The fixture checks (2, −1, 5) projected onto negative y and positive x, which gives (1, 2).

## @evidence contracts/development/implementation.md#efficient-algorithms

Compute the displacement once and reuse it for the two dot products.

# src/geometry/AutoMovieRecoveryGeometry.ts#AutoMovieRecoveryGeometry.cutExact

## @evidence contracts/development/common.md#meaningful-documentation

Intersect indexed triangles with a physical plane using binary64 cut predicates. An optional supplied scalar chart determines signs and edge fractions from height minus level. Keep isolated tangent contacts as one-point open contours and split at graph junctions. An optional filter receives original face IDs.

## @evidence contracts/development/implementation.md#principled-implementation

Usually compute heights from the plane normal. When a supplied chart exists, reuse its unchanged heights so classification and cut fractions agree with its scalar topology. Coplanar patch boundary extraction and maximal degree-two tracing separate open, closed and isolated contacts. The fixed-section fixtures include two isolated apex contacts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepare one scalar source and query it once. Tracing visits each emitted graph edge once, and the same computed crossing is reused by its incident faces.

# src/geometry/AutoMovieRecoveryGeometry.ts#AutoMovieRecoveryGeometry.prepareCutExact

## @evidence contracts/development/common.md#meaningful-documentation

Prepare reusable triangle cut queries. Keep source positions, incidence and scalar heights unchanged while querying. Omit candidates to scan every face. An explicit strictly increasing candidate list must include all faces covering the level, including exact endpoints. Both provenance switches default false. Enable them to retain exact emitting faces or ordered edge ancestry.

## @evidence contracts/development/implementation.md#principled-implementation

Use the scalar level for intersection while the physical plane supplies the chart. Keep original face IDs in filtering and provenance. The source-slab test distinguishes an exact emitting face from a merely touching endpoint-star face. That distinction is used to bind actual source ports.

## @evidence contracts/development/implementation.md#efficient-algorithms

Validate chart ownership once. Each sweep query visits its permitted candidates and emits only the requested source provenance.

# src/geometry/AutoMovieRecoveryGeometry.ts#AutoMovieRecoveryGeometry.critical

## @evidence contracts/development/common.md#meaningful-documentation

Classify critical vertices of a piecewise-linear height function. The default `legacy-link-cycle-v1` qualifies a single cycle. Select `boundary-regular-path-v1` to also recognize a qualifying regular boundary fan. Equal heights are ordered by original vertex identity and physical levels stay unchanged.

## @evidence contracts/development/implementation.md#principled-implementation

Compare lower and upper link components at each original vertex. A boundary fan needs a simple path, valid face/radial incidence, strict untied heights and opposite end signs. The critical bracket consumer retains unresolved topology and uses the original scalar values.

## @evidence contracts/development/implementation.md#efficient-algorithms

Build source link incidence once for the chosen policy. Classify each local link without perturbing or recomputing physical coordinates.

# src/geometry/AutoMovieRecoveryGeometry.ts#AutoMovieRecoveryGeometry.planeFrame

## @evidence contracts/development/common.md#meaningful-documentation

Borrow the finite Cartesian origin and build a right-handed unit frame. The normal sets `n` and `v` follows the projected reference. Nonfinite coordinates, a zero normal or physical projected reference length below 1e-6 throw.

## @evidence contracts/development/implementation.md#principled-implementation

The reference crossed with the unit normal gives the transverse axis and has the physical norm of the planar projection. Normalize it to obtain `u`, then cross `n` with `u` for `v`. With normal (0, 0, 2) and reference (1, 0, 1), this gives positive x for `v` and negative y for `u`.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use fixed three-component cross products. Rescale an extreme finite reference only when the initial cross has an unrepresentable component. The supplied origin stays borrowed.

# src/geometry/AutoMovieRecoveryGeometry.ts#AutoMovieRecoveryGeometry.sourceOrientation

## @evidence contracts/development/common.md#meaningful-documentation

Prepare a supporting-face orientation witness for classifying section contours. Supply the registered material-side sign when known. Omit it to infer orientation from the source's signed volume. Zero inferred volume throws.

## @evidence contracts/development/implementation.md#principled-implementation

Reuse the declared sign where provided, which also supports open or independently oriented source shells. The orientation witness combines it with the actual cut support to distinguish outer and cavity contours. The fixed-section owner supplies this witness before fitting loops.

## @evidence contracts/development/implementation.md#efficient-algorithms

Measure the aggregate source orientation once when inference is required. Each contour can query the prepared witness using its supporting faces.
