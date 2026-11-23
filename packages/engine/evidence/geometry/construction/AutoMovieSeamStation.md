# src/geometry/construction/AutoMovieSeamStation.ts#AutoMovieSeamStation.curvatures

## @evidence contracts/development/implementation.md#principled-implementation

Thomas elimination solves each component's natural-cubic curvature system with zero endpoint second derivatives; matching finite rows and strictly increasing well-scaled stations are caller premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same station system is traversed componentwise into one station-by-component output table.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not merge knots, regularize a zero gap or validate row widths; fewer than three stations receive the natural zero-curvature table.

## @evidence contracts/development/common.md#meaningful-documentation

States the natural boundary condition, increasing-station premise and output indexing.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(LW) time and output for L stations and W components, plus O(L) gap/elimination scratch, avoid a dense solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares one gap array across columns and reuses scratch arrays, but recalculates the modified upper coefficients per column; no shared factorization is claimed.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the new L-by-W curvature table escapes; gap and two elimination arrays die with the call.

# src/geometry/construction/AutoMovieSeamStation.ts#AutoMovieSeamStation.slopes

## @evidence contracts/development/implementation.md#principled-implementation

Evaluates the natural cubic's endpoint derivative from secant and adjacent curvatures, using the right interval except at the final station.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One table mapping handles all stations/components and accepts already solved curvatures.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses supplied M as given or solves it once by default; no slope clipping or finite-difference replacement hides an inconsistent table.

## @evidence contracts/development/common.md#meaningful-documentation

Gives the final-station interval convention and provenance of the curvature argument.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(LW) derivative work/output; omitting M additionally pays one O(LW) curvature solve and its temporary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Callers continuous and the coefficient/plane branches pass their existing curvature table, avoiding its second solve; default M owns the one required preparation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new slope table without retaining inputs; a default curvature table becomes unreachable after this synchronous call.

# src/geometry/construction/AutoMovieSeamStation.ts#AutoMovieSeamStation.copy

## @evidence contracts/development/implementation.md#principled-implementation

The station chain rule multiplies first derivatives by factor and second derivatives by factor squared; factors 1/-1 express the declared continuation orientations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One explicit record copies section and plane data into the neighbour's boundary representation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Throws for absent owner curvatures/frame slopes; frame curvatures and valid factor are additional caller premises, not independently checked or synthesized.

## @evidence contracts/development/common.md#meaningful-documentation

Explains orientation sign, required boundary jets and the horizontal fallback for an absent geometric frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(W) section-copy work and fixed nine-component plane work allocate only the returned record's arrays and local flattening intermediates.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Takes the owner's actual boundary values and jets rather than re-solving a neighbour-local estimate.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned arrays own their copied numbers, without retaining the owner layer; transient flattened arrays remain call-local.

# src/geometry/construction/AutoMovieSeamStation.ts#AutoMovieSeamStation.continuous

## @evidence contracts/development/implementation.md#principled-implementation

Admits station spacing, preserves explicit coefficient and actual-frame sources, and solves natural-cubic ordinary fields; kept/mixed-source boundaries retain their published endpoint jets rather than being globally resplined.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One coordinator owns spacing, field preparation and selective layer replacement while curvatures/slopes own the tridiagonal mathematics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects kept layers without coefficient curvatures and nonfinite new coefficient jets; lifted/framed field widths and remaining jet completeness are producer premises, not silently repaired.

## @evidence contracts/development/common.md#meaningful-documentation

States unchanged principal values, kept-layer identity, optional field behavior and the new layer-table return.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ordinary solves cost O(LW); native compatibility solves are skipped. Explicit bindings are validated per bracket before edits, and changed endpoints additionally pay SectionConnect.finish's layer/law/binding and preparation costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Wholly source-owned coefficient/frame tables skip redundant natural solves; ordinary slopes reuse their curvature solve, lift prepares once and kept layer objects remain shared.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned chain owns new derivative arrays and shares kept layers/other chain fields; temporary station, value and solver tables are not retained by the module.

# src/geometry/construction/AutoMovieSeamStation.ts#AutoMovieSeamStation.flat

## @evidence contracts/development/implementation.md#principled-implementation

Concatenation preserves all nine components and their declared origin/u/v order.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conversion exposes the component layout used by the station solver.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not normalize derivative axes or reinterpret their units.

## @evidence contracts/development/common.md#meaningful-documentation

States flattening order and that derivative-valued records use the same conversion.

## @evidence contracts/development/implementation.md#efficient-algorithms

Copies nine components in constant work and storage.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A fixed record conversion owns no coordinated preparation or cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The fresh array owns its numbers without retaining the input tuples.

# src/geometry/construction/AutoMovieSeamStation.ts#AutoMovieSeamStation.unflat

## @evidence contracts/development/implementation.md#principled-implementation

Groups the fixed nine-component station layout into the original three triples.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This is the direct inverse layout conversion of flat, without a second frame representation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Assumes nine supplied entries and preserves their values; no normalization or finite-value admission changes derivative fields.

## @evidence contracts/development/common.md#meaningful-documentation

Names array order and the unnormalized-axis ownership convention.

## @evidence contracts/development/implementation.md#efficient-algorithms

Nine reads and three fixed triples take constant work and space.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This representation conversion coordinates no repeated solve or cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned record owns its three tuples and retains no input array.
