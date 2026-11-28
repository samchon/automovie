# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.realizeGeometry

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc names the three recipe kinds, the mesh ownership of each, the processing result, the default display behavior and the conditions for requesting complete atlas processing or receiving an exception.

## @evidence contracts/development/implementation.md#principled-implementation

The dispatcher selects the owner from the recipe's discriminator. Mesh recipes return their input. Primitive recipes share the direct tessellator's finite positive dimension check before reporting completion. Atlas recipes return their owner's mesh and diagnostics, with an exception for incomplete output only when the caller requests complete processing.

## @evidence contracts/development/implementation.md#efficient-algorithms

The mesh arm reads a reference. Each other recipe invokes its producer once. Atlas verification uses the completion flag already returned by its owner. The caller owns the recipe result and each generated buffer.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.tessellate

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies dimension units and admission, the local frame and winding, the lattice, ownership of returned arrays and the limit of extreme finite arithmetic.

## @evidence contracts/development/implementation.md#principled-implementation

The shared primitive extent classifier admits the same finite and strictly positive named dimensions as model validation. The tessellator applies the selected shape recipe in local metres. Sphere latitude and longitude sample trigonometric unit normals, scaled by the radius and translated along the axis for a capsule. Cone and cylinder side normals derive from the slant of the radius profile. Repeated corners give separate normals where face orientation changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most three authored dimensions are checked before the mesh is allocated. Each recipe emits its fixed vertex and index population in one call, without retaining state. The output arrays belong to the caller.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.tessellateToMesh

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the primitive units, shared admission rule, array ownership and the UV and skin fields of the result.

## @evidence contracts/development/implementation.md#principled-implementation

The adapter invokes the same primitive producer and carries its vertices, normals and indices into the mesh without a coordinate or winding change. Its UV and skin fields are null because the recipe provides neither mapping.

## @evidence contracts/development/implementation.md#efficient-algorithms

The adapter calls the tessellator once and attaches its arrays without traversing or copying them. The result and its arrays belong to the caller.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.pointInPlanarRing

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the finite common frame, implicit ring closure, winding and off-edge requirement. Boundary membership belongs to the caller because architecture and compound region admission apply different rules.

## @evidence contracts/development/implementation.md#principled-implementation

The half-open row comparison finds edges that straddle the positive X ray and counts any crossing at a shared vertex once. For an upward edge the exact chart orientation is positive when its crossing lies ahead of the query, and downward edges reverse the sign. Toggling parity therefore counts the crossings without constructing an X coordinate that could overflow.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass reads the ring edges. Horizontal and off-row edges never call the orientation owner. The sign owner invokes its exact fallback only when rounding or range leaves the sign unresolved. This classifier retains no input or state beyond the call.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.createMeshDepthSampler

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc describes the cyclic plane axes, local metre units, finite-domain refusals, misses, immutable snapshot and axial envelope.

## @evidence contracts/development/implementation.md#principled-implementation

Index admission validates triangle structure and each coordinate, then stores the finite projection and signed doubled area. Changing winding reverses both numerator and area in the barycentric ratio. Zero projection area contributes no surface sample. A read validates both coordinates before testing bounds, and checks finite weights and depth before taking extrema.

## @evidence contracts/development/implementation.md#efficient-algorithms

One position pass validates the source mesh and one triangle pass copies its projection. The fixed 32 by 32 grid places references by projected bounds, with at most 1024 references per triangle. Each read visits only its bin or returns at the bounds. The closure owns its copied projections and bins until released.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.fitSubdivisionRegions

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies requested levels, metre-valued constraints, empty-region behavior, shared-boundary ownership, returned residual and refusal conditions.

## @evidence contracts/development/implementation.md#principled-implementation

Whole-number admission prevents fractional or NaN depths from selecting a different refinement. Finite original coordinates and UVs enter the shared cage owner. Each local constraint belongs to the region's source vertices. Four adjacent rings cover two refinement steps and limit support. The owner maps local controls to the joined level by exact subdivision identities, composes only solved deltas, and verifies finite coordinates, UVs and residual before transfer.

## @evidence contracts/development/implementation.md#efficient-algorithms

The source cage is refined twice once. The owner builds face adjacency once and visits at most four support rings per named region. Its fit runs on that crop, and additional requested levels refine the entire joined output. The owner releases crop scratch and retains only the final level and scalar largest residual.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.integrateRadialField

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the dense finite input, powers, unit conventions, empty and degenerate cases, convexity premise and arithmetic refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Only powers 2 and 3 enter their matching radial polynomials. Equal radii make the strongest field a nearest-site partition. A site that cannot reach the plane cannot win a positive field. Green's theorem reduces the integral to edges. Common scaling of the edge-circle quadratic preserves its roots at large and small unit scales. Four Gauss-Legendre nodes integrate the interior degree-six polynomial in real arithmetic, and the exterior radial flux uses the signed angle. Finite checks guard clipping, projection and the returned sums.

## @evidence contracts/development/implementation.md#efficient-algorithms

Input admission and original area each make one pass. Among at most 512 contributing sites, each nearest-site cell clips against the other sites and sends its surviving edges to fixed-node quadrature. The original footprint area is computed once. Cell arrays and admission scratch are released on completion or failure.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.admitSubdivisionCage

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states finite metre and UV storage, safe ordinals, manifold and crease conditions and separate parameter treatment of quads and other polygons.

## @evidence contracts/development/implementation.md#principled-implementation

The owner copies finite positions and UVs. Indexed loops include sparse slots. Every corner and crease endpoint names an actual vertex, and each UV corner names one UV owned by its vertex. The topology builder enforces edge incidence and connected fans. Level-zero parameters retain polygon identity for the refiner.

## @evidence contracts/development/implementation.md#efficient-algorithms

The copy, bounded scalar checks and topology passes visit the authored coordinates, face corners, creases and UVs. The duplicate check scans the current face; topology and UV ownership maps retain only observed identities. The returned arrays belong to the level.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.subdivideSurface

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the whole level cap, support for nonquad cages, crease and UV rules, output units and limits of representable evaluation.

## @evidence contracts/development/implementation.md#principled-implementation

Shared cage admission establishes finite coordinates and valid topology. A safe integer depth fixes the number of four-way refinements after the initial corner split. Catmull-Clark masks construct the generating level and the shared evaluator gives limit positions and normals. The published numeric buffers must remain finite.

## @evidence contracts/development/implementation.md#efficient-algorithms

Whole-level admission precedes topology allocation. The initial corner count and the cap of six bound final quad growth to 1024 per original corner. Each refinement replaces its prior working level, and the limit evaluator reads the final topology before transferring the returned surface.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.fitSubdivisionDomain

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc describes the quad crop, finite metre input, anchors and limit targets, source-face selection, collar behavior and returned solve and refusal information.

## @evidence contracts/development/implementation.md#principled-implementation

The shared cage owner checks finite storage and topology. Control coordinates and limit targets fill exact source-vertex slots, while region faces are admitted before stencil construction. Two Catmull-Clark refinements supply the hierarchical basis. Anchor and limit rows impose distinct equalities. The solve refuses incomplete or nonfinite residuals and validates generating and coarse coordinates before transfer.

## @evidence contracts/development/implementation.md#efficient-algorithms

Refinement maps and the constraint structure are built once on the crop, then each coordinate uses that row structure with its own target values. Work follows the local topology and its two refinements. The caller receives the completed level and scalar solve receipts.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.createMeshRayCaster

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc covers copied geometry, ranges and units, normalized finite directions, original exclusions, tie attribution, misses and arithmetic refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Safe indices and finite positions admit a mesh snapshot. Dividing a direction by its largest magnitude before normalizing a subnormal or overflowing norm preserves direction. The slab test only prunes nodes outside the current travel interval. Finite trial determinants, weights and distances follow Möller–Trumbore, with the existing near-parallel cutoff. A qualifying equal hit selects the lowest original ordinal.

## @evidence contracts/development/implementation.md#efficient-algorithms

One hierarchy build copies the edge and box tables and orders triangle leaves. Each query validates its three coordinates and given exclusions before the walk. The retained traversal stack and tables are shared by the three reads; leaf arithmetic allocates only a successful hit record.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.createSignedMeshQuery

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the two modes and default, finite mesh and reading coordinates, signed feature interpretation, rim output and failure conditions.

## @evidence contracts/development/implementation.md#principled-implementation

Finite positions admit the snapshot before exact-coordinate welding. A closed surface pairs every edge and an open sheet can carry a uniquely directed rim. The nearest face or segment and its pseudonormal give signed distance. Finite query inputs and bounded squared extents prevent an invalid traversal, and the owner qualifies a finite hit before saving it as the next seed.

## @evidence contracts/development/implementation.md#efficient-algorithms

The owner builds index, incidence and pseudonormal records once. A query starts from the prior winner when available, then skips boxes farther than the running best. Leaf arithmetic reuses its working result, and the caller receives new point and normal arrays.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.createMeshSeparationQuery

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc describes source and Float32 modes, same-frame metres, finite clearance and integer budget, whole-feature proof, zero threshold and both result reads.

## @evidence contracts/development/implementation.md#principled-implementation

Finite original coordinates are admitted before the snapshot. Float32 additionally requires its represented triples to remain finite. The clearance and whole nonnegative budget are checked before any deduction. Projected box bounds prove some subtrees; the rest use convex bounds or the declared attachment contact proof. Zero uses the smallest positive distance for strict separation while preserving attachment handling.

## @evidence contracts/development/implementation.md#efficient-algorithms

One immutable measured hierarchy shares original triangle identities across both reads. The traversal spends the caller's budget before counted work. The decision read stops at the first failed bound, and the measure uses the same proof for the rest. Only the bounded result survives each call.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.markMeshClearance

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states weight and address requirements, finite metre gaps and endpoints, order, sign and anchor behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Each position uses three admitted packed XYZ vertices and their supplied weights. Keeping the weights preserves affine extrapolation. The measurement's front-minus-back convention gives the back endpoint by subtracting the gap on the selected axis. The flag derives from the same gap. Invalid or unrepresentable points throw before any marks are returned.

## @evidence contracts/development/implementation.md#efficient-algorithms

The owner reads only the three referenced vertices of each witness. Its linear pass constructs one pair of points and one mark per witness. All emitted point arrays belong to their marks, and no front mesh is retained.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.evaluateSubdivisionLevel

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the quad-only level, how a polygonal source reaches it, the existing buffer identities and the returned limit surface.

## @evidence contracts/development/implementation.md#principled-implementation

Each pair of adjacent face offsets must differ by four before limit computation. The returned flat face-index array can then be grouped into quads. A completed first polygon refinement already meets the requirement, and an original quad level remains valid. Limit evaluation follows the admitted level without further subdividing it.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass visits face offsets before limit evaluation. The adapter reuses existing generating position, UV and face buffers. It creates one parameter record for each represented vertex and transfers the calculated limit and normal buffers to the caller.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.admitBicubicAtlas

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc defines metre input with finite millimetre conversion, safe work limits, original registry addresses, incident patch loss and independent source-fit qualification.

## @evidence contracts/development/implementation.md#principled-implementation

Admission checks the global tolerance conversion, budget policy and safe capacities up front. Dense coefficient slots must carry finite model coordinates with finite millimetre products. Safe integer addresses select declared coefficients. A malformed coefficient or authority loses only its incident patch occurrences, and each binding has two distinct finite endpoints in the unit interval. Source-fit residuals are finite nonnegative measurements or null, and invalid metadata leaves structural selection intact.

## @evidence contracts/development/implementation.md#efficient-algorithms

The owner scans coefficient, chart, authority and binding registries once per stage. A set deduplicates the selected original coefficient addresses before any tessellation. Returned arrays own the selected addresses and borrow the retained boundary declarations.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.createEllipticLoftAtlas

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states finite metre profile and endpoint admission, physical station and angular direction, producer budget limits, and the later realization minimum.

## @evidence contracts/development/implementation.md#principled-implementation

Each axial profile has four finite coefficients and positive radii. Shared exact interval endpoints and matching profile values permit one shared row. The producer copies authored lower and upper stations directly and uses a bounded convex combination if an interior affine difference overflows. Every published angular coefficient is finite in metres. The radial approximation uses the maximum admissible radius and retains a positive bound if its product rounds to zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Validation and emission each make a pass through the spans. Four axial rows and twelve angular controls per row keep coefficient work constant per span. Shared rows are emitted once. A map interns boundary identities before returning owned atlas arrays.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.realizeBicubicAtlas64

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states output options, model-to-kernel units, partial display, independent qualifications and the limits of retained chart and coefficient data.

## @evidence contracts/development/implementation.md#principled-implementation

Retention flags are checked before allocation or model admission. The realizer forwards the exact admitted patch subset and remaps its sorted original coefficient IDs to one millimetre registry. Local structure diagnostics remain attached. A budget-limited result keeps prior complete chunks and compacts unused vertices while preserving triangle ordinals, primitive ranges and optional per-corner chart values.

## @evidence contracts/development/implementation.md#efficient-algorithms

Only admitted controls are converted. Streaming retains geometry and optional telemetry requested by the caller. Optional coefficient copies are collected only for retained patch triangles. The final compaction removes unreferenced vertices once.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.refineSubdivisionStencils

## @evidence contracts/development/common.md#meaningful-documentation

The contract describes the input basis, row ownership and shared output order with point refinement.

## @evidence contracts/development/implementation.md#principled-implementation

Face rows average incident source rows. Edge rows blend endpoint and face contributions through the same sharpness rule as point refinement. The fan mask supplies vertex weights in the topology's fan order, so applying the result to a source field gives the affine refinement of that field.

## @evidence contracts/development/implementation.md#efficient-algorithms

The owner merges only nonzero-weight stencil contributions into per-row maps. Work follows the traversed sparse supports, without allocating a full source-by-output matrix.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.subdivisionBendingRows

## @evidence contracts/development/common.md#meaningful-documentation

The contract specifies the render diagonal, the frozen discrete metric, row ownership and degenerate cases.

## @evidence contracts/development/implementation.md#principled-implementation

Each triangle contributes half a cotangent to its opposite edge's two stiffness rows and one third of its area to each vertex. Row scaling by the inverse square root of mass and the common mean squared row energy preserves the zero residual of constants. The owner requires positive area, positive vertex mass and positive normalizing energy.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each quad contributes two fixed-size triangle calculations. Sparse maps store only incident coefficients, and the two normalization passes visit the stored terms.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.buildSubdivisionTopology

## @evidence contracts/development/common.md#meaningful-documentation

The contract identifies the polygon-row premise, stable edge numbering, fan order, sharpness and ownership.

## @evidence contracts/development/implementation.md#principled-implementation

An unordered vertex pair keys each edge while its first traversal retains orientation. A second traversal must be opposite and a third refuses. Counting and grouping incident corners makes the entering-edge walk compare its visits to the complete fan. A mismatch diagnoses the disconnected vertex.

## @evidence contracts/development/implementation.md#efficient-algorithms

One edge map and indexed corner tables serve the construction. Every valid corner and fan entry takes a bounded number of visits, with row arrays reused in the result.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.refineSubdivisionLevel

## @evidence contracts/development/common.md#meaningful-documentation

The contract defines child ordering, chart subdivision, edge sharpness and optional UV behavior.

## @evidence contracts/development/implementation.md#principled-implementation

The child topology follows the same parent-corner order as the transferred parameters. Parent vertex and edge IDs pick the split-edge sharpness; face-interior edges are smooth. A nonquad cage chooses a separate corner chart, while refined faces keep their existing chart identities.

## @evidence contracts/development/implementation.md#efficient-algorithms

One point refinement supplies all child positions and masks. One pass visits the parent corners to emit four child indices and parameter samples each, and optional UV refinement reuses the computed vertex masks.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.refineSubdivisionPoints

## @evidence contracts/development/common.md#meaningful-documentation

The contract identifies packed coordinate layout, stable output order, the three refinement rules and returned masks.

## @evidence contracts/development/implementation.md#principled-implementation

The owner first accumulates face averages, then combines them with edge endpoints according to edge smoothness. Boundary and fully sharp edges use the midpoint. Vertex masks combine the centre, fan neighbours and the already computed adjacent face points.

## @evidence contracts/development/implementation.md#efficient-algorithms

One packed position buffer holds all new points and face averages are reused by incident edges and vertices. Work scales with the traversed topology relations. Each computed vertex mask is returned for callers that refine related attributes.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.stepSubdivisionRing

## @evidence contracts/development/common.md#meaningful-documentation

The contract specifies the local input layout, child ordering and the sharpness values used now and subsequently.

## @evidence contracts/development/implementation.md#principled-implementation

The child diagonals are the four-point face averages. Each smooth edge can use its adjacent averages, while a fully sharp edge uses its endpoint midpoint. Applying the same vertex mask as whole-level refinement keeps the centre consistent with its surrounding topology.

## @evidence contracts/development/implementation.md#efficient-algorithms

The owner computes only the local one-ring. Each neighbour and diagonal is visited a bounded number of times, and the returned packed arrays are new.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.subdivisionRingEigenbasis

## @evidence contracts/development/common.md#meaningful-documentation

The contract describes the stationary rule premise, computed limit and tangent outputs, and tangent normalization expectations.

## @evidence contracts/development/implementation.md#principled-implementation

Refining each basis ring builds the local linear operator. The constant-preserving operator gives a limit mask under left power iteration. Each tangent iterate is projected into zero-sum masks, and the second is made orthogonal to the first so the two directions remain separate.

## @evidence contracts/development/implementation.md#efficient-algorithms

The dense operator covers one local ring only. The work is bounded by 512 iterations over that ring's matrix. Only three evaluated vectors survive the temporary matrix and masks.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.subdivisionVertexMask

## @evidence contracts/development/common.md#meaningful-documentation

The contract specifies fan-ordered output, sharpness cases and the fractional transition rule.

## @evidence contracts/development/implementation.md#principled-implementation

The smooth case gives centre weight (n−2)/n and edge and face weights 1/n², for the admitted smooth fan. The crease assigns its two neighbour weights only to positive-sharpness edges. The corner carries the centre. A change of rule after decay interpolates these affine masks.

## @evidence contracts/development/implementation.md#efficient-algorithms

The owner visits one fan's sharpness values and creates one mask for the unchanged rule. It compares and blends a second mask only when the rule changes.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.boundConvexSeparation

## @evidence contracts/development/common.md#meaningful-documentation

The contract identifies represented convex features, metre units, early stopping, work accounting and the meaning of zero.

## @evidence contracts/development/implementation.md#principled-implementation

Approximate normals and segment witnesses propose directions only. The projection owner admits both runs' finite XYZ coordinates and encloses both hulls along the stored direction, so a positive outward-enclosed gap divided by an upper norm proves a lower bound along each candidate. The maximum of those bounds stays conservative.

## @evidence contracts/development/implementation.md#efficient-algorithms

The resident triangle's face direction is tried first. An adequate projection returns before further candidate enumeration. Without an early exit, work follows the normal triples and Cartesian product of segment pairs. The scalar result retains no inputs.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.boundMeshQueryPoint

## @evidence contracts/development/common.md#meaningful-documentation

The contract states who admits the coordinates, squared units and the distinct complete and pruning results.

## @evidence contracts/development/implementation.md#principled-implementation

For each axis the point's excess outside the interval is nonnegative. Squared excesses add in XYZ order, so a partial sum greater than the running limit is already enough to prune. Strict greater-than keeps ties in the search.

## @evidence contracts/development/implementation.md#efficient-algorithms

The box test uses scalar reads and no per-query allocation. Early pruning may skip later bounds and products.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.boundProjectionSeparation

## @evidence contracts/development/common.md#meaningful-documentation

The contract specifies the represented hulls, proof direction, metre result and zero disposition.

## @evidence contracts/development/implementation.md#principled-implementation

The owner checks every XYZ coordinate of each run, origin and direction before handling the zero-direction sentinel or inactive axes. The convex hull projects between its vertex extrema. Outward lower and upper endpoints enclose each vertex projection. Rounding the positive gap down and dividing by an upper norm enclosure preserves a lower bound on Euclidean distance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Projection and extremum passes scale with the two vertex runs. The temporary intervals and their origin are local, and the result is scalar.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.boundTriangleAttachmentContact

## @evidence contracts/development/common.md#meaningful-documentation

The contract states the caller's root registration, metre frame, cap scope and unresolved proof cases.

## @evidence contracts/development/implementation.md#principled-implementation

The rounded support normal supplies a direction for enclosing the slab. If the fan's two non-root corners are strictly above its top, the total non-root barycentric weight of any contact is bounded by the root deficit divided by deficit plus corner gap. An upper 1-norm of either root-to-corner offset turns that fraction into a conservative cap.

## @evidence contracts/development/implementation.md#efficient-algorithms

The proof examines six vertices and three axes. Its fixed-size temporary intervals are released, and the result retains only proof and distance values.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.buildMeshQueryHierarchy

## @evidence contracts/development/common.md#meaningful-documentation

The contract specifies entry bounds, deterministic ordering, leaf capacity and observable input ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The min/max union encloses a subtree's entries. The widest represented extent selects the split axis, then median partitioning keeps both populations balanced. Leaves keep the same entry objects and the root sorts its input when it splits.

## @evidence contracts/development/implementation.md#efficient-algorithms

Up to twelve entries are handled directly. Larger nodes sort and partition only their own population. The tree's final leaves retain the entries once; the temporary branch slices are local to construction.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.collectSpatialQueryCandidates

## @evidence contracts/development/common.md#meaningful-documentation

The contract distinguishes overlap and shared-cell populations, states the cell width and defines stable ordering and record ownership.

## @evidence contracts/development/implementation.md#principled-implementation

A subtree can be discarded if its chosen coordinate intervals miss the subject's. The same comparison on entries gives the precise candidate population. Each first shared coordinate is the greater of the two low cell indices. Lexicographic cell comparison and ordinal tie-breaking are independent of tree traversal order.

## @evidence contracts/development/implementation.md#efficient-algorithms

The walk examines only boxes surviving hierarchy pruning, computes cell indices by division and floor, and sorts only the retained entries. Coordinate extent adds no grid-iteration work.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.featureEdgeDistance

## @evidence contracts/development/common.md#meaningful-documentation

The contract explains the table premise, capped per-sign values and the visibility limit of a full row.

## @evidence contracts/development/implementation.md#principled-implementation

The query reads the measured row and reduces nearest segment distance separately for convex and concave signs. Initializing each result to the table reach makes all reductions capped, including a row with no edge of that sign.

## @evidence contracts/development/implementation.md#efficient-algorithms

The measured table limits each row to sixteen edges. A single scan processes those segments and returns two scalars without copying the table.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.measureFeatureEdges

## @evidence contracts/development/common.md#meaningful-documentation

The contract states mesh and reach premises, welding identity, the feature test and truncation order.

## @evidence contracts/development/implementation.md#principled-implementation

A positive finite reach, complete triples, finite positions and safe in-range indices admit the indexed buffers. Direct indexed reads also accept typed arrays. Welded endpoint pairs collect incident faces. Boundary and nonmanifold edges are excluded from feature classification. The face-normal dot threshold selects the dihedral and the other face's centroid side gives its sign. Segment-to-triangle distance ranks candidate features for every triangle, including features beyond its own sides.

## @evidence contracts/development/implementation.md#efficient-algorithms

Maps index positions and edge incidence. The measurement compares each feature with each triangle and sorts that triangle's in-reach candidates, keeping only sixteen indices per returned row.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.measureMeshClearance

## @evidence contracts/development/common.md#meaningful-documentation

The contract defines directional depth, common units, gaps, original ordinals and the full witness callback.

## @evidence contracts/development/implementation.md#principled-implementation

Projected triangle clipping supplies the polygon where both affine depth fields are defined. Their difference is affine, so a minimum occurs at an overlap vertex. Barycentric weights recover each depth and give the caller an independently usable witness. Including touching boxes keeps isolated edge and point overlap eligible.

## @evidence contracts/development/implementation.md#efficient-algorithms

The back mesh is indexed by projected bounds before clipping. Disjoint branches are skipped, the reducer holds one minimum per front triangle, and callbacks receive witnesses without building a global witness list.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.refitMeshQueryHierarchy

## @evidence contracts/development/common.md#meaningful-documentation

The contract identifies callback responsibility, precise part of the hierarchy preserved, fresh ownership and degenerate entries.

## @evidence contracts/development/implementation.md#principled-implementation

Replacing in leaf order preserves the previous population and identity layout. Leaf boxes enclose their new entries, and parent unions enclose both children. Former box positions do not constrain a moved entry.

## @evidence contracts/development/implementation.md#efficient-algorithms

The owner calls replace once per original entry and visits every node once. Refit needs no sorting and retains no cached prior world placement.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.selectTriangleRegion

## @evidence contracts/development/common.md#meaningful-documentation

The contract gives the oriented loop premise, topology-only output and the specific loop and manifold refusal classes.

## @evidence contracts/development/implementation.md#principled-implementation

Complete nonnegative safe integer identities admit both runs, including a check on sparse slots. The winding of each directed boundary edge selects its inward incident triangle. A flood follows mesh adjacency with the loop's undirected edges as barriers. Exactly one selected incidence per barrier verifies separation, and any unexpected boundary opening refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

One edge map retains up to two incident uses per undirected edge. The flood visits each selected triangle once and sorts only the output ordinals.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.createMeshWindingQuery

## @evidence contracts/development/common.md#meaningful-documentation

The contract states snapshot and query units, signed winding, boundary classification and the inside convention for admitted points.

## @evidence contracts/development/implementation.md#principled-implementation

Finite mesh positions are checked before snapshotting. The query requires three finite coordinates, sums signed solid angles using atan2 and checks surface membership in the same walk. An unrepresentable winding refuses before publication. Triangles with doubled area at or below 1e−12 square metres are skipped. Surface membership prevents a singular on-triangle angle from being treated as interior.

## @evidence contracts/development/implementation.md#efficient-algorithms

The snapshot packs retained corners and unnormalized normals in one typed array. A query walks those records with scalar temporaries and returns only winding and two flags.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.transformMesh

## @evidence contracts/development/common.md#meaningful-documentation

The contract specifies finite placement, metre coordinates, inverse normals, mirror winding, shading/physical ownership and the metric chart premise.

## @evidence contracts/development/implementation.md#principled-implementation

Each vertex applies scale, quaternion rotation and translation, then checks the completed coordinates. The quaternion has a finite near-unit norm and every scale component is finite and nonzero. Inverse normal ratios outside the ordinary range are aligned by their binary exponents before rotating and normalizing, so direction can survive an intermediate magnitude outside binary64. An odd reflection reverses triangle indices. Physical aliases are admitted in both placements.

## @evidence contracts/development/implementation.md#efficient-algorithms

The placement reads each coordinate row and index triplet once. Extreme normal recovery runs for that row only. Returned attribute arrays are owned, and preserved source labels are copied once.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.inspectMeshTopology

## @evidence contracts/development/common.md#meaningful-documentation

The contract specifies finite metre positions, grid and physical incidence, collapsed ordinals, signed volume and the empty result.

## @evidence contracts/development/implementation.md#principled-implementation

The owner reads complete positions and the shared admitted triangle and physical identity tables before classifying edge counts. The triangle sum uses stored coordinates in origin-tetrahedron order. If a direct product or sum overflows, an exact dyadic accumulation sums the original products before dividing by six and rounding the signed result to binary64. An unrepresentable final volume refuses.

## @evidence contracts/development/implementation.md#efficient-algorithms

The ordinary path uses one edge-count map and a direct scalar sum. Only a nonfinite intermediate causes a second pass through the same index run. That pass holds one integer accumulator and the nine coordinate decompositions of the current triangle.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.measureMeshDefects

## @evidence contracts/development/common.md#meaningful-documentation

The contract gives indexed and nonindexed buffer shapes, finite weld and sliver rules, true infinite collinear aspect and deterministic defect order.

## @evidence contracts/development/implementation.md#principled-implementation

A safe in-range address must admit before reading a welded cell. Each finite rounded axis coordinate enters the packed lattice; finite capacities keep edge keys exact. Ordered uses distinguish single, same-direction pair and nonmanifold edges. Extreme edges use a common power-of-two rescale before computing squared lengths and cross products, preserving the dimensionless aspect through intermediate overflow or underflow.

## @evidence contracts/development/implementation.md#efficient-algorithms

The incidence census and ordered publication each read the triangle stream once. Compact cell and edge ordinals keep the weld maps and typed work tables proportional to the measured buffers. Optional aspect work runs only for a triangle on three distinct cells.

# src/geometry/AutoMovieEngineGeometry.ts#AutoMovieEngineGeometry.placeSurfaceFrame

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc defines dense finite offsets, target ownership and units, rigid reconstruction, refusal and the scope of the placement.

## @evidence contracts/development/implementation.md#principled-implementation

The owner admits all three offset records before deriving the normalized target basis. Each coordinate combines its original local components through the orthonormal axes and the target origin. Each product and partial sum must remain finite before the completed triple can escape.

## @evidence contracts/development/implementation.md#efficient-algorithms

The operation checks three rows and fixed-length dot combinations. It borrows the offsets, computes one basis and returns only the new points.
