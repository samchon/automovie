# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.assertImageChart

## @evidence contracts/development/common.md#meaningful-documentation

The calibration check accepts a supplied finite orthographic chart and returns a row-coordinate assertion in the same millimetre frame.

## @evidence contracts/development/implementation.md#principled-implementation

The pixel pitch, principal point and dimensions determine four metric edges. A round-off bound tied to chart scale rejects offsets that erase adjacent pixel increments. The row guard maps physical coordinates back to integer centres and cell edges and permits eight-connected support, including diagonal adjacency.

## @evidence contracts/development/implementation.md#efficient-algorithms

The method prepares pitch and pixel-axis constants once and keeps only one view chart in its synchronous row checker. Each row check is constant work and compares at most one predecessor.

# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.analyzeMultiBoundarySurface

## @evidence contracts/development/common.md#meaningful-documentation

The chart contract identifies admitted oriented triangles, boundary cycles, ordered incidence and total area in square millimetres.

## @evidence contracts/development/implementation.md#principled-implementation

Each safe integer triangle address must resolve before reading a position. The Engine cross product of the face edges gives oriented normal and twice the area, with finite nonzero area required. Edge groups and vertex links decide orientability and determine boundary cycles of one connected surface. Area is summed only while representable.

## @evidence contracts/development/implementation.md#efficient-algorithms

One face traversal builds incidence and accumulates area. Subsequent graph traversals reuse those rows for connectivity, link checks and cycle discovery. Space is proportional to the face, edge and vertex population and is transferred as the measured topology.

# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.bindSavedSectionCuts

## @evidence contracts/development/common.md#meaningful-documentation

Bind one fresh physical section cut to the complete saved raw contour population. Match original contour ordinals, closure and source face addresses. Saved curve names and publication indices remain caller-attested. A mismatch returns `refused`; an admitted result returns `bound` with current exact support.

## @evidence contracts/development/implementation.md#principled-implementation

Reconcile the complete raw and saved populations by original ordinal. Compare closure and broad or exact source incidence at each paired contour, then bind the current exact cut-emitting faces even when the saved record retained a broader witness. The slab-only and resume paths share this owner.

## @evidence contracts/development/implementation.md#efficient-algorithms

Index each raw and saved ordinal once. Reuse measured contour faces instead of reading or replaying saved cubic coefficients.

# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.collectContourFaceSupport

## @evidence contracts/development/common.md#meaningful-documentation

Collect broad original-face support for a sampled cut contour. Union incident faces at sampled source vertices and crossed edges. The result can include a face that touched only an endpoint.

## @evidence contracts/development/implementation.md#principled-implementation

Use the original vertex and edge incidence registries for each contour node. The source-slab fixture demonstrates that broad endpoint-star evidence includes a touching face whose triangle never emitted a cut segment.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scan contour nodes and reuse their incidence maps. Return a set of original face IDs rather than copying source triangles.

# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.extractMeshSections

## @evidence contracts/development/common.md#meaningful-documentation

Extract cubic contour observations from a registered source mesh in millimetres at automatic stations and critical brackets. An optional section limit keeps a sorted prefix and reports the omitted coverage. A lineage callback receives copied source face addresses, including local failures and isolated contacts. Progress or lineage failure propagates.

## @evidence contracts/development/implementation.md#principled-implementation

Build one scalar sweep and original incidence, then use the same heights for automatic critical classification and exact-cut interpolation. Every observed contour passes through the shared section owner. The production recovery host and lineage tests check identity-preserving observed sections.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepare source heights and cut admission once. Reuse candidate ranges per station, and record the original work population when a requested prefix stops extraction.

# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.observeOrderedCuts

## @evidence contracts/development/common.md#meaningful-documentation

Reobserve named saved section planes in the original registered millimetre frame. Supply byte-verified source and artifact identities, source selection and original face mapping. The result records fresh raw cuts and bound source lineage. Mismatched identity, frame, incidence or saved populations throw.

## @evidence contracts/development/implementation.md#principled-implementation

Verify the declared identities and physical frame, prepare the source index, recut each requested saved plane and run its complete saved-cut binder. This acquisition path neither interprets nor refits stored cubic values.

## @evidence contracts/development/implementation.md#efficient-algorithms

Build one source fit-independent admission and one scalar index. Reuse the original incidence for all requested cuts, and return only the named metadata and measured geometry required by later fit binding.

# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.observeSection

## @evidence contracts/development/common.md#meaningful-documentation

Observe every contour on one fixed registered millimetre plane. A collection name can prefix curve identities. The optional lineage observer receives original supporting face addresses after local fitting, even for refused contours. Observer exceptions propagate.

## @evidence contracts/development/implementation.md#principled-implementation

Classify each supplied raw contour, derive its source-facing orientation, fit admitted closed or open paths and keep diagnostics for rejected measurements. Both fixed section observation and contour resume use this implementation. The closed tetrahedron cut keeps three original side faces.

## @evidence contracts/development/implementation.md#efficient-algorithms

Process each contour once and transfer only its admitted curve/report and distinct broad or exact support. Source arrays remain private during fitting.

# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.observeSourceSlabs

## @evidence contracts/development/common.md#meaningful-documentation

Attach measured source components to observed section port identities. Use complete retained cuts and requested registered millimetre bounds. Actual segment and contact provenance establishes port support. Missing sections or missing required exact evidence throw.

## @evidence contracts/development/implementation.md#principled-implementation

The same scalar chart drives region clipping and PL topology. Map actual cut-emitting original faces to the selected component and retain its raw-node, alias and halfedge evidence. In the two-peak fixture one lower and two upper loops bind to the same component, and a face that merely touches an endpoint does not supply a port.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse observed cuts across requested pairs. Create fresh slab evidence only for the requested interval and copy the output lineage registries from its current source.

# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.observeSourceTerminals

## @evidence contracts/development/common.md#meaningful-documentation

Observe distal extrema and critical brackets from the original faces supporting a supplied closed loop. Positions and levels are millimetres. Report finite extremum ties and qualified tips separately. A source maximum without a finite outward bound throws.

## @evidence contracts/development/implementation.md#principled-implementation

Seed a bounded open half-space with the actual loop support. Attach source vertex-face probes through the same open slab graph and qualify extrema only in the linked component. The distal tetrahedron supplies its true apex, while the open tube keeps unsupported tied extrema.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepare one slab graph and height interval index, then reuse them across source-terminal seeds. Recover measured vertices and brackets from original source addresses rather than constructing caps.

# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.prepareChartLeafBoundary

## @evidence contracts/development/common.md#meaningful-documentation

Prepare fixed outer-collar coefficients from the declared fitted boundary cubics. Use the registry's normalized UV interval addresses and millimetre controls. An exterior leaf edge must stay inside one native boundary span. Conflicting corner values or coefficient owners throw.

## @evidence contracts/development/implementation.md#principled-implementation

Find the selected side and containing cubic span, then restrict the original net to its local interval. Boundary endpoints use one canonical evaluation by UV key, and the same control ID requires the same physical value. `fitChartLeaf` consumes the returned registry with free controls still unset.

## @evidence contracts/development/implementation.md#efficient-algorithms

Visit exterior master intervals and reuse their canonical endpoint values. Interior controls stay null, leaving only admitted fixed points in the returned array.

# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.prepareCriticalBrackets

## @evidence contracts/development/common.md#meaningful-documentation

Replace eligible critical sweep levels with neighboring brackets. Levels and step use millimetres. Return the selected brackets and source vertices that remain unsupported. Flat or unresolved local topology retains a diagnostic.

## @evidence contracts/development/implementation.md#principled-implementation

Choose the smaller of one hundredth of the step and one quarter of the gap to either adjacent height. The independently authored level 1.5 gives bounds 1.49 and 1.51 and distinguishes a simple critical from a plateau.

## @evidence contracts/development/implementation.md#efficient-algorithms

Use the existing sorted height relationships and update the level set with two bracket endpoints. Retain diagnostics only for the measured unsupported links.

# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.prepareDiskBoundary

## @evidence contracts/development/common.md#meaningful-documentation

Choose a stable starting occurrence on an oriented private disk boundary and measure its four physical perimeter quarters. Positions and measured offsets use millimetres. Use the supplied corner threshold in degrees and preserve the boundary's coherent direction.

## @evidence contracts/development/implementation.md#principled-implementation

Rank cyclic occurrence keys without reversing the observed direction. Accumulate measured chord lengths in exact dyadic units before selecting quarter positions, keeping the numeric measure separate from source topology. A square places the quarters at its four existing corners.

## @evidence contracts/development/implementation.md#efficient-algorithms

Reuse ranked cyclic positions and cumulative chord lengths instead of testing every full rotation. The caller inserts only missing quarter positions.

# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.prepareImageSupports

## @evidence contracts/development/common.md#meaningful-documentation

Prepare a common row domain for admitted calibrated silhouette supports. Keep each supplied measured row inside the common millimetre interval. A view's missing stations interpolate only within its measured domain. Reject invalid views, a deficient shared interval or an exceeded row budget.

## @evidence contracts/development/implementation.md#principled-implementation

Intersect the views' admitted row ranges and merge their actual row coordinates. Interpolate between measured neighbors for other views, keeping original support bounds at existing stations. Profile fitting uses that common physical row chart before scalar fitting.

## @evidence contracts/development/implementation.md#efficient-algorithms

Merge unique stations within the shared interval under the requested row cap. Reuse each view's ordered observations and keep raster storage outside the support result.

# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.prepareMeshIncidence

## @evidence contracts/development/common.md#meaningful-documentation

Prepare source vertex aliases and face incidence for an indexed observed mesh. With coordinate aliases disabled, original vertex addresses stay independent. Enable them only to join exactly equal positions. Return original-face edge and vertex support.

## @evidence contracts/development/implementation.md#principled-implementation

Map each original point to its canonical key, then build edge and vertex incidence from the original triangle order. The fixture duplicates vertex zero as vertex three and verifies all three shared edges and face memberships with aliases enabled.

## @evidence contracts/development/implementation.md#efficient-algorithms

Hash exact coordinate keys only when requested. Build incidence in one triangle traversal and retain original face IDs for later section and slab queries.

# src/geometry/AutoMovieRecoveryShape.ts#AutoMovieRecoveryShape.refineChartBoundaryChords

## @evidence contracts/development/common.md#meaningful-documentation

Split private map chords whose fixed endpoints lie on the same side of the unit square. Insert one free map vertex at each source-PL midpoint in millimetres. Keep both incident orientations and the original observed boundary paths. Invalid incidence or a nonrepresentable subdivision throws.

## @evidence contracts/development/implementation.md#principled-implementation

Under Dirichlet boundary data the chord has zero transverse extent. Split its two source triangles at their common physical midpoint so the added free vertex can attain a distinct interior chart position. Chart batch passes the refined vertices, triangles and retained physical keys to fitting.

## @evidence contracts/development/implementation.md#efficient-algorithms

Process only affected chords and their two incident triangles. Keep the original boundary paths and unaffected observations rather than resampling the mesh.
