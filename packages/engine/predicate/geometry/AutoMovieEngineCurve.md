# src/geometry/AutoMovieEngineCurve.ts#AutoMovieEngineCurve.bicubicAtlasPlan64

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states millimetre input and tolerance, safe work limits and coefficient addresses, requested output flags, boundary tables and the distinction between an arithmetic omission and coarse retention.

## @evidence contracts/development/implementation.md#principled-implementation

Planning admits names, safe numeric work limits, Boolean flags and exact registry addresses before constructing canonical boundary coefficients. The shared bicubic bound takes maxima over the second-partial Bernstein control differences. The pure factors 6 and mixed factor 9 come from the cubic degrees. The Taylor weights 1/8, 1/4 and 1/8 describe a unit parameter cell. A nonfinite estimate refuses that cell before refinement or coarse retention. The explicit coarse policy can keep a finite over-tolerance leaf at the same budget.

## @evidence contracts/development/implementation.md#efficient-algorithms

The planner constructs the boundary ownership once and estimates each processed cell on its own restricted coefficients. Each split adds one allocated slot. The declared safe cap bounds the slots and the sparse leaf output. Pending cells and coefficient work belong to the call.

# src/geometry/AutoMovieEngineCurve.ts#AutoMovieEngineCurve.planLocalHermite64

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states millimetre units, source ownership, interval timing, work limits, the first index default and the separate reasons for retaining no leaves.

## @evidence contracts/development/implementation.md#principled-implementation

The owner prepares the selected physical station interpolation from continuous normalized courses and applies the same analytic bicubic estimate as atlas planning. An interval accepts only finite under-tolerance leaves. A nonfinite estimate reaches its arithmetic refusal before subdivision. An exceeded leaf count discards that interval with a resource refusal. The original field remains available for other intervals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Station preparation happens once and the returned plan creates cells for the requested interval. The pending and retained leaf counts share its safe cap. Local stacks and unresolved cells are released on return. The result retains the prepared field and its immutable source arrays for as long as its caller keeps the planner.

# src/geometry/AutoMovieEngineCurve.ts#AutoMovieEngineCurve.tessellateContourPath64

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states the saved station and ordinal domain, triangle order, metre positions, square-millimetre areas, omission counts, incidence qualifications and pair-level failure.

## @evidence contracts/development/implementation.md#principled-implementation

The owner admits finite XZ coordinates at each declared finite Y station and checks the exact signed sum of consecutive XZ cross products. The sign proves winding even when the projected area cannot round to a positive finite magnitude. Complete P and Q walks advance each saved vertex ordinal exactly once from their admitted starts. Half of each retained cross magnitude in square metres becomes square millimetres by multiplication by 500000. Unrepresentable or collapsed faces increment the omission count. A pair sum outside finite range throws before publication. Retained faces supply the topology and accumulated normals, with unresolved normals reported as zero.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ring validation visits each vertex and retains two dyadic-product terms per edge for that ring's sign. Registered rings share the output position buffer and physical identity table. Completeness checks scan each declared walk. Emission then walks the same steps with a fixed number of lookups and arithmetic operations per step. Each ring's sign scratch and the call's topology maps are released on completion or failure. Only the mesh, construction rings, pair reports and diagnostics escape.

# src/geometry/AutoMovieEngineCurve.ts#AutoMovieEngineCurve.generateSupportCurve64

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the millimetre coefficients and outputs, turn partition, convexity estimate, analytic perimeter and numerical refusal conditions.

## @evidence contracts/development/implementation.md#principled-implementation

Admitting a safe integer before applying the bit test prevents truncated partitions. For X = h n + h' t, differentiating gives X' = (h + h'') t. The constant Fourier term integrates to 2π times its amplitude, and the first harmonic translates without changing curvature or the fourth-derivative bound. Higher-harmonic amplitudes contribute to the radius remainder and Hermite majorant, with small dimensionless factors applied before multiplication. Publication requires finite measures and Bézier controls.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most seventeen coefficients are copied. The curvature scan doubles from 16 through at most 4096 samples, stopping at its first positive estimate. Each requested span reads one endpoint and tangent at each end. Retained storage is linear in the declared span count.

# src/geometry/AutoMovieEngineCurve.ts#AutoMovieEngineCurve.assertCurve64

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies complete finite coefficient and cache storage, whole degrees, phase widths, supported oval coordinates and refusal.

## @evidence contracts/development/implementation.md#principled-implementation

A dense pass admits every supplied coefficient and safe degree before evaluation. Positive finite weights allow represented rational control quotients. An optional cache must match finite quotients within the existing binary64 relative allowance, with an explicit refusal if a nonzero quotient underflows. Cumulative phase addition requires a strictly increasing represented boundary. Ovals validate axis length and mutual orthogonality.

## @evidence contracts/development/implementation.md#efficient-algorithms

The check reads each authored coefficient and optional cache element once, and scans the phase intervals without retaining a table. Ovals require fixed-size arithmetic. No coefficient is written or retained.

# src/geometry/AutoMovieEngineCurve.ts#AutoMovieEngineCurve.evaluateBernstein64

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc identifies the closed finite parameter, units, independent hybrid Y polynomial, owned triples and arithmetic refusal.

## @evidence contracts/development/implementation.md#principled-implementation

De Casteljau evaluates the admitted coefficient field and its degree-scaled consecutive differences. A nonfinite intermediate retries that scalar calculation after common scaling, which preserves the represented polynomial and derivative. The positive rational denominator gives the quotient rule. Large homogeneous products fall back to denominator ratios, while unresolved quotient or product underflow still refuses. A finite reported point and local derivative are required.

## @evidence contracts/development/implementation.md#efficient-algorithms

The ordinary path maps each coefficient lane and uses call-local triangular interpolation work. Scaling runs only for a lane whose intermediate result is nonfinite. The function retains only the two output triples and borrows supplied coefficients.

# src/geometry/AutoMovieEngineCurve.ts#AutoMovieEngineCurve.evaluateCurve64

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states phase admission, seam and endpoint rules, millimetre positions and derivative units.

## @evidence contracts/development/implementation.md#principled-implementation

Finite phase admission precedes chart selection. Existing whole-curve admission supplies dense coefficients and strictly increasing phase widths. A piece's local derivative is divided by its width by the chain rule and checked for overflow and unresolved underflow. Ovals differentiate the angle 2π times phase and require finite emitted values.

## @evidence contracts/development/implementation.md#efficient-algorithms

The curve scan validates its coefficient field once and constructs the cumulative phase array once. The read evaluates one selected piece, or fixed analytic arithmetic on an oval. Only its point and tangent escape.

# src/geometry/AutoMovieEngineCurve.ts#AutoMovieEngineCurve.measureCurveLength64

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc states strict endpoint and interior reads, finite chart and derivative storage, panel bounds, millimetre outputs and callback error behavior.

## @evidence contracts/development/implementation.md#principled-implementation

The owner admits whole panel counts and finite representable chart widths. The shared eight-node kernel observes complete finite XYZ samples and finite speed at the two requested endpoints and all interior nodes. Collapsed nodes and unrepresentable contributions are reported separately. Multiplying speed by its parameter weight gives millimetres, and the finite difference is the distance between the two numerical observations.

## @evidence contracts/development/implementation.md#efficient-algorithms

At each piece the strict path reads two endpoints and then eight nodes per panel at K and 2K. It uses scalar sums and flags and retains neither the callback nor its sampled values. The legacy cubic call omits endpoint observations and still uses the same interior arithmetic.

# src/geometry/AutoMovieEngineCurve.ts#AutoMovieEngineCurve.prepareBicubicAtlasBoundary64

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc specifies exact control addresses, directed canonical intervals, coefficient aliasing, local conflict disposition and the lifetime of borrowed controls.

## @evidence contracts/development/implementation.md#principled-implementation

Canonical declarations admit four in-range safe integer coefficients before evaluating their restricted cubic. The exact phase owner admits distinct finite unit-interval endpoints. Matching full edge tuples propagate an explicit restriction and preserve separate legacy normal fans. Alias classes compare computed positions and record disagreements for incident patch omission.

## @evidence contracts/development/implementation.md#efficient-algorithms

The owner indexes registry addresses and edge tuples with maps, restricts each explicit curve once for its constraints, and compresses alias paths when looking up roots. Returned position closures cache by canonical phase and borrow the immutable control registry.

# src/geometry/AutoMovieEngineCurve.ts#AutoMovieEngineCurve.tessellateBicubicAtlas64

## @evidence contracts/development/common.md#meaningful-documentation

The JSDoc describes millimetre work input, shared identity and independent normals, local arithmetic diagnostics and policy refusal before the first chunk.

## @evidence contracts/development/implementation.md#principled-implementation

The iterator prepares and validates the plan before emitting any chunk. Safe integer registry addresses select actual coefficient slots, exact canonical parameters preserve declared alias identities, and optional publication flags are Boolean. A local nonfinite estimate leaves its chart unprocessed with a diagnostic and independent finite charts can emit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation runs once. A cell budget limits retained leaves and the per-chunk cap limits new vertex indices. The generator streams owned vertex suffixes and accumulates optional snapshots only when selected by the caller.

# src/geometry/AutoMovieEngineCurve.ts#AutoMovieEngineCurve.assertCurveBoundary64

## @evidence contracts/development/common.md#meaningful-documentation

The contract states exact identity and phase correspondence, physical units and the layout of the first-variation field.

## @evidence contracts/development/implementation.md#principled-implementation

The owner first admits the complete cubic section and checks its name, closed turn clock and longitudinal unit. Dense derivative spans must match the section span count, with four finite XYZ controls each. The finite axis uses the same vector predicate.

## @evidence contracts/development/implementation.md#efficient-algorithms

The section and its matching derivative slots are read without evaluation or copies. Each vector has fixed dimension, and admission retains no authored buffers.

# src/geometry/AutoMovieEngineCurve.ts#AutoMovieEngineCurve.measureCubicCurveLength64

## @evidence contracts/development/common.md#meaningful-documentation

The contract describes the cubic input, interior sampling, default panel count, millimetre result and observed difference.

## @evidence contracts/development/implementation.md#principled-implementation

The cubic derivative follows directly from its three consecutive control differences in local parameter. Integrating its Euclidean norm over each unit span gives physical length independently of the external phase clock. The finer eight-point quadrature has twice as many panels as the coarse pass. A safe integer count in the authored range admits both walks, and both sums must be finite before the observed difference is published.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each one-panel span uses 8 coarse and 16 fine callbacks. The shared quadrature keeps fixed coefficient and node tables and accumulates two lengths without retaining a sampled curve.

# src/geometry/AutoMovieEngineCurve.ts#AutoMovieEngineCurve.tessellateContourStrip64

## @evidence contracts/development/common.md#meaningful-documentation

The contract describes fixed seam selection, the candidate score, sheet identity, display versus qualification and optional work timing.

## @evidence contracts/development/implementation.md#principled-implementation

An area-weighted monotone path advances one contour at a time and chooses the resulting tile. Candidate incidence tests verify boundary uses, oriented edges and vertex links. Failed constraints branch by excluding involved steps. If qualified search ends unresolved, the finite first candidate stays displayable with explicit omissions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Triangle areas are cached in one contour-size grid. Each constrained solve uses a fixed flag count per grid cell, and a priority heap orders conflict branches. The owner measures elapsed time only when requested.

# src/geometry/AutoMovieEngineCurve.ts#AutoMovieEngineCurve.tessellateParametricAtlas64

## @evidence contracts/development/common.md#meaningful-documentation

The contract states integer lattice counts, physical units, directed restrictions, callback-local omission, shared finite conflicts and normal qualification.

## @evidence contracts/development/implementation.md#principled-implementation

Whole lattice counts and directed finite restrictions admit the policy before callbacks. Each chart stages its exact phase requests and then its finite named boundary samples and local inverse values before publishing them to the corresponding shared registry. A request supplied only by failed boundary plans contributes neither a canonical sample nor a vertex-budget estimate. Finite canonical disagreements still reject their incident charts. Emission checks complete finite chart jets and rolls back the failed chart's indices, attribute buffers, new physical IDs and counters while keeping previously admitted charts and available work.

## @evidence contracts/development/implementation.md#efficient-algorithms

Canonical schedules are sorted once per authority. One chart stages requests or samples at a time, and each retained chart reuses local vertex IDs under the same vertex estimate. Error recovery truncates appended buffers and deletes only the failed chart's new physical keys. Previously retained geometry stays in place.
