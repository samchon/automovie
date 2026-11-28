# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.routeDistanceSquared

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc defines metre inputs, a square-metre result, the nearest interior or endpoint witness, coincident endpoints, the empty or one-point Infinity sentinel and representability premises.

## @evidence contracts/development/implementation.md#principled-implementation

Each route span projects the point onto its direction and clamps the parameter to [0, 1]. A zero-length span uses its endpoint. Squared residual components give a candidate distance, and their minimum is the route result. Infinity initializes the empty candidate set.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass visits the consecutive route pairs and maintains a scalar minimum. The caller's squared-radius tests can compare the result directly without a square root or a built segment index.

# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.routeLength

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the three-dimensional centre-line measure in metres, zero for a route with fewer than two points, and the representability constraints.

## @evidence contracts/development/implementation.md#principled-implementation

Each pair of consecutive points contributes the hypot of its coordinate differences. The sum measures the piecewise-linear route, counts a coincident pair as zero and starts at zero when the route has no spans.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over adjacent points accumulates the length. The computation retains a scalar running total and borrows the authored route.

# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.lowerServiceNetwork

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies both admission gates, world metre geometry, stable IDs, resolution default and floor, and the returned models and set pieces.

## @evidence contracts/development/implementation.md#principled-implementation

The owner admits side count, network and wet zones before allocation and throws the first reported defect. Each route selects a section plane across its first leg and sweeps a radius-scaled regular polygon. A shared network/segment ID ties the returned mesh and its origin-positioned set piece.

## @evidence contracts/development/implementation.md#efficient-algorithms

Admission runs once for the network and once for wet zones. Each segment builds one polygon and sweep. The mesh cost grows with side count and route span count, and the caller owns the generated records.

# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.lowerWetZoneDrainage

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the typed input premise, zone and port selection, lattice frame, flow units, sill, time range, output order and observed refusals.

## @evidence contracts/development/implementation.md#principled-implementation

The zone fixes the relevant logical room. Floor of each selected node's origin-relative X and Z offsets over cell size resolves its cell. Inlet and waste-port demands become flow rates and drains read their cell bed. Derived IDs combine zone and port before checking the authored source or drain list.

## @evidence contracts/development/implementation.md#efficient-algorithms

One system map supports the port scan, and each named drain is found in the node list. IDs are checked against the corresponding authored flow array. The returned domain shares its grid, bed and original entry records and allocates two new flow arrays.

# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.serviceAnalysisSupport

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the data needed for geometric checks, the whole-pair clash exception, discipline reporting and the separate validation operation.

## @evidence contracts/development/implementation.md#principled-implementation

Volume and cited-face availability decide the conditional geometry rows. Fixed rows describe supported structural checks, including the span-box clash rule's full shared-node exemption. First-seen disciplines add unsupported performance rows because capacity consumes declared demand.

## @evidence contracts/development/implementation.md#efficient-algorithms

The report inspects systems and spaces once and stops looking for a missing face at the first such sleeve. Each visited sleeve performs a boundary lookup by ID. It builds only capability rows.

# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.serviceEnvelopeObstructions

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the world-space units, strict endpoint comparisons, interior flat-box case, declaration order and absent-envelope behavior.

## @evidence contracts/development/implementation.md#principled-implementation

Each node's local maintenance box is translated to world metres. On every axis, each minimum must lie below the opposite maximum. Interior flat boxes can satisfy this rule, while exterior contact fails one comparison.

## @evidence contracts/development/implementation.md#efficient-algorithms

One scan tests each node once. Translated boxes are local temporaries and only matching IDs are returned.

# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.serviceMaintenanceBounds

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the local and world frames, translation source and null meaning.

## @evidence contracts/development/implementation.md#principled-implementation

The node provides position and axis-aligned local limits. Adding the same offset to both endpoints preserves the box's extent and alignment.

## @evidence contracts/development/implementation.md#efficient-algorithms

The operation takes constant work and returns a fresh pair of corners when an envelope is present.

# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.serviceNetworkSchematic

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies the plan frame, world route lengths, demand and reach basis, declaration order and unknown-system or orphan endpoint behavior.

## @evidence contracts/development/implementation.md#principled-implementation

The selected system filters nodes and segments. Port ownership maps endpoints to node IDs and preserves an unresolved port ID. Separate route length, reach and load operations supply the physical measures independently of plan projection.

## @evidence contracts/development/implementation.md#efficient-algorithms

The method indexes port owners and projects only selected nodes and route points. Reach and load each use one separate query, and lengths are computed once per emitted edge for the subsequent total.

# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.serviceSegmentBounds

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the world metre box, radius padding, singleton and empty cases, and the span query used for clashes.

## @evidence contracts/development/implementation.md#principled-implementation

Coordinate minima and maxima of a linear span occur at its endpoints. The extrema over all route points enclose the centre line, and radius padding encloses the route's full extents.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass over route points maintains two extrema and returns one box.

# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.serviceSegmentClashes

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies conservative span boxes, contact convention, skipped runs, the full shared-node exemption and ordering.

## @evidence contracts/development/implementation.md#principled-implementation

One span array represents each measurable route, retaining tight bounds across bends. Endpoint ownership reveals shared-node pairs. Strict overlap on each axis reports a remaining pair whenever any two span boxes overlap. Diagonal spans use conservative boxes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Port ownership and span boxes are prepared once per query. Pair iteration short-circuits on the first overlapping span, and worst-case work grows with the products of compared span counts.

# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.serviceSegmentSpanBounds

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies metre units, ordered per-span padding, the conservative diagonal case and the empty result.

## @evidence contracts/development/implementation.md#principled-implementation

Each distinct or coincident pair gives componentwise minima and maxima. Expanding by the radius bounds the occupied span and keeps turns separate for clearance checks.

## @evidence contracts/development/implementation.md#efficient-algorithms

One pass emits exactly one box per consecutive pair. It retains only the output boxes and the current point pair.

# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.serviceSystemLoad

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc gives the declared demand unit, port direction by flow mode and the zero-demand and bidirectional cases.

## @evidence contracts/development/implementation.md#principled-implementation

The system's flow selects the facing direction. Only matching system IDs and that direction enter the sum, so a drainage exhaust and a supply inlet count from opposite ends.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each node and its ports are read once. Per-node filtering retains the eligible ports for its local reduction.

# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.serviceSystemReach

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies directions, device-state default, declaration ordering and distinct missing-system and missing-root outcomes.

## @evidence contracts/development/implementation.md#principled-implementation

The chosen system's runs build forward and backward adjacency keyed by port owners. A visited set prevents cycles, and the operating flag cuts expansion at a zero-opening node. Filtering authored nodes after traversal restores declaration order.

## @evidence contracts/development/implementation.md#efficient-algorithms

The walk prepares adjacency once and visits each reachable node once. The array-backed queue shifts one entry per visit, so queue maintenance can grow with frontier size. Reached IDs and indices are local to the query.

# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.validateServiceNetwork

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies typed inputs, checked structure, geometry basis, full shared-node exception and the separately owned wet-zone gate.

## @evidence contracts/development/implementation.md#principled-implementation

IDs and references join each node, port, route and sleeve to the declared environment. Port direction and demand support capacity and reach checks. Route vertices supply space crossing witnesses, and sleeves with faces are tested in those authored frames. Interference uses conservative span and maintenance boxes.

## @evidence contracts/development/implementation.md#efficient-algorithms

The gate builds reference maps for its scans. Capacity and root reach visit declared system records, while conservative pair comparison can dominate for many long runs. It retains findings for the returned validation.

# src/service/AutoMovieEngineService.ts#AutoMovieEngineService.validateWetZones

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states finite numeric bounds, tanked obligations, grade handovers, drain rules and the source of the slope value.

## @evidence contracts/development/implementation.md#principled-implementation

Lookup maps resolve space, boundary and node references. Grades order handovers, and wet or immersed zones require each bounding membrane and a waste drain. A malformed scalar is reported at its own field. A slope that passed scalar admission but is zero receives the separate tanked fall finding.

## @evidence contracts/development/implementation.md#efficient-algorithms

One initial index pass supports resolved citations. Each zone filters its bounding faces and scans its declared membranes, thresholds and drains. The check retains only local indexes and findings.
