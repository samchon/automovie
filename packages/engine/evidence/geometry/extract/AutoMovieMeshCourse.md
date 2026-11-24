# src/geometry/extract/AutoMovieMeshCourse.ts#AutoMovieMeshCourse

## @evidence contracts/development/common.md#meaningful-documentation

States the per-station plane convention, the readings, their units and null meanings, the climb, split and feature rules and the jump rule.

## @evidence contracts/development/design.md#principled-representation

The namespace groups a course's section reading: planes by station, holding loops in their own chart millimetres, and readings whose absence is null rather than a default; the axis-line quarters follow the four-quarter view section's guide convention and the split pieces the given guides of the touch/split view section.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Its consumers are `AutoMovieHumanF1Trace` and the operator tests; the plane cut stays with `AutoMovieMeshExtract`, the guides' correspondence from section to section with its caller, and the course's own geometry (its turn regularity) with the axis that owns it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No member serves only a test or one part; the reading is the same for every part's course.

# src/geometry/extract/AutoMovieMeshCourse.ts#AutoMovieMeshCourse.cut

## @evidence contracts/development/common.md#meaningful-documentation

States inputs, units, the per-plane cut and the jump rule.

## @evidence contracts/development/implementation.md#principled-implementation

Exact plane cut per station; jumps as deviations from the neighbours' station-linear interpolation, so unequal steps keep their meaning.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cutting with loop reading, then the family's jump pass over the same sections.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing loop and a refused shoulder are reported, never repaired; no point is dropped from a loop.

## @evidence contracts/development/implementation.md#efficient-algorithms

A course with multiple planes prepares one O(T + V) mesh index for its T triangles and V vertices, then clips only the triangles in boxes that can cross each plane. Loop readings are O(points) per station and jumps are O(S) across S stations.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All planes share one triangle and edge layout. Each cut is read once for all its section measurements.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The prepared geometry and section reader are local to the call. The returned sections retain their measurements and points.

# src/geometry/extract/AutoMovieMeshCourse.ts#AutoMovieMeshCourse.read

## @evidence contracts/development/common.md#meaningful-documentation

States the guide convention, the crossing segment, the feature walk and the signed result.

## @evidence contracts/development/implementation.md#principled-implementation

Conic lofting's shoulder (Liming 1944): with the guides on the axis lines at the four extents, as `AutoMovieViewSection` touches its box, M is the chord midpoint and A the corner, so the segment from the origin through M to A is `M + t (A - M)` for t in [-1, 1]; the loop's outermost crossing there gives rho = t. For the rational quadratic quarter of middle weight w that crossing is `w / (1 + w)` (Farin, "Rational quadratic circles are parametrized by chord length", 2006; Shene's derivation of `|MX| / |MP1|`), the engine's `w = rho / (1 - rho)`: a circle quarter has `w = sqrt(2) / 2` and `rho = sqrt(2) - 1`, a parabola `w = 1` and `rho = 0.5`. Features: a hysteresis walk of the support `h = p . d` once around the loop from its global maximum keeps the alternating maxima and minima that differ by at least the tolerance (the zigzag of extrema with persistence at least the tolerance), and each keeps the direction its outward normal faces.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass for the extents, one walk per direction, one segment intersection per quarter.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No clamp and no fallback value: a concave quarter reads rho <= 0, a loop missing the segment reads null, and no feature is smoothed or merged.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) for N loop points per quarter and per direction.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading coordinates no requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; returns fresh tuples.

# src/geometry/extract/AutoMovieMeshCourse.ts#AutoMovieMeshCourse.ascend

## @evidence contracts/development/common.md#meaningful-documentation

States the walk, its stopping rule and the tie between the two sides.

## @evidence contracts/development/implementation.md#principled-implementation

Hill climbing on the loop's own support with the features' persistence, so a guide followed from section to section keeps its own hill rather than the global maximum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One walk per side, then the higher best.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No point is skipped, smoothed or dropped; each side stops at most once around the loop.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading coordinates no requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/geometry/extract/AutoMovieMeshCourse.ts#AutoMovieMeshCourse.pieces

## @evidence contracts/development/common.md#meaningful-documentation

States the arcs, the guides' tangents, the corner, the split and piece readings and their nulls.

## @evidence contracts/development/implementation.md#principled-implementation

Each guide stands at its loop point, tangent along its support line in increasing phase; quarter q is the loop's own arc from guide q to guide q + 1 in increasing phase (by the loop's winding), and only that arc's segments are crossed. The shoulder construction on the guides with A the support lines' corner gives the arc's shoulder point S, which splits it (#3158); the polyline's tangent at S is the crossed edge's own direction, and that edge is divided at S between the two sub-arcs. Each piece is the conic on its two ends and tangent lines (`AutoMovieViewChain`: A where they meet, ahead of both ends), its shoulder the outermost crossing of its own M->A by its own sub-arc.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Per quarter: its arc, one split crossing, then two piece readings on the two sub-arcs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No crossing of another arc stands in, and no clamp or fallback: an arc missing its segment or an unmet tangent pair reads null.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) per quarter.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading coordinates no requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; returns fresh tuples.

# src/geometry/extract/AutoMovieMeshCourse.ts#AutoMovieMeshCourse.shoulder

## @evidence contracts/development/common.md#meaningful-documentation

States the order and directions of the measured contacts, the two units, and the partial result when the arc misses the chord-to-corner ray.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the same tangent intersection and measured M-to-A crossing as the split quarter.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

After checking both contacts exist, form consecutive segments and delegate the intersection and crossing to the shared piece reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the supplied measured contacts and tangents without replacing a failed conic.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear work in the ordered arc size for segment construction and the crossing scan.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure arc reading has no shared requests across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Segment pairs are temporary. Only the two scalar readings are returned.

# src/geometry/extract/AutoMovieMeshCourse.ts#AutoMovieMeshCourse.newell

## @evidence contracts/development/common.md#meaningful-documentation

States the components' meaning, the planar consequence and the orientation.

## @evidence contracts/development/implementation.md#principled-implementation

Newell's sums of `(y_i - y_j)(z_i + z_j)` and their cyclic forms, the doubled projected areas (Tampieri, "Newell's Method for Computing the Plane Equation of a Polygon", Graphics Gems III, 1992); the exact plane cuts read here are planar.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over consecutive pairs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A degenerate polygon returns the zero vector rather than an invented normal.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading coordinates no requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/geometry/extract/AutoMovieMeshCourse.ts#AutoMovieMeshCourse.centroid

## @evidence contracts/development/common.md#meaningful-documentation

States the plane premise and the null case.

## @evidence contracts/development/implementation.md#principled-implementation

A fan of triangles from the first vertex, each weighted by its signed area along the unit Newell vector, so concave polygons and either winding give the area centroid.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One Newell pass, one fan pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No vertex mean or origin stands in for a missing area centroid.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading coordinates no requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
