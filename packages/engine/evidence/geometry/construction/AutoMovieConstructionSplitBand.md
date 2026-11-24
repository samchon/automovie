# src/geometry/construction/AutoMovieConstructionSplitBand.ts#AutoMovieConstructionSplitBand

## @evidence contracts/development/common.md#meaningful-documentation

States the clock, both ribbons, the crease, the correspondence and its admission.

## @evidence contracts/development/design.md#principled-representation

Represents One band of a split (`IAutoMovieConstructionSplit`): the join strip between a child's loop on the host's end and the child's rail, published as a two-layer chain (`AutoMovieSolidBlendChain.strip`): companion namespace of 13 members (`IAutoMovieConstructionSplitBand.ISide`, `IAutoMovieConstructionSplitBand.IInput`, `IAutoMovieConstructionSplitBand.IBand`, `IAutoMovieConstructionSplitBand.IStrip`, `create`, `refine`, ...); units and frames named in its text: radians, degrees, degree, second. It has no optional member, so no absent-value state combines with another.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the module that declares `AutoMovieConstructionSplitBand` in packages/engine/src/geometry/construction/AutoMovieConstructionSplitBand.ts; its surface is the 13 members listed and the text shows 7 other files naming it, mostly packages/engine (3), packages/human (2), test (2), so no member is declared for a presumed future need.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Scanning the declaration finds a use of `any`, a use of `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows. The widening above is the remaining shortcut and is not justified here.

# src/geometry/construction/AutoMovieConstructionSplitBand.ts#AutoMovieConstructionSplitBand.railAt

## @evidence contracts/development/implementation.md#principled-implementation

Reads the side's own rail curve, or its one station, so every reader of the child's rail takes the same station at a phase.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The curve is the caller's; nothing is clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States both cases and the units.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time beyond the curve's own reading.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reader coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/geometry/construction/AutoMovieConstructionSplitBand.ts#AutoMovieConstructionSplitBand.create

## @evidence contracts/development/implementation.md#principled-implementation

Each column's ribbons are the sides' own 2-jets (or the declared ruling and crease chord) scaled to the column chord, as the join blend scales its ribbons.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Loop, correspondence, columns, then the shared strip.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses collapsed or nonfinite columns and a strip without orientation or surface.

## @evidence contracts/development/common.md#meaningful-documentation

States the refusals in its result.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in columns apart from the correspondence's fixed-depth bisections.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The arc jets serve both the loop and the scale.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary columns are released; the result is caller-owned.

# src/geometry/construction/AutoMovieConstructionSplitBand.ts#AutoMovieConstructionSplitBand.fan

## @evidence contracts/development/implementation.md#principled-implementation

The two-way band's ribbons applied stretch by stretch, so every seam is ruled and every fork turned alike, and the shared strip builder (`strip`) does the rest.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Columns, ribbons, then the shared strip.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a loop that does not start on an arc, a column count that does not add up, a degenerate tangent plane and a seam whose plane holds the direction toward the band.

## @evidence contracts/development/common.md#meaningful-documentation

States the loop, the ribbons, the corner and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in columns apart from the strip's correspondence.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each column's host jet serves its point and its ribbon.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary columns are released; the result is caller-owned.

# src/geometry/construction/AutoMovieConstructionSplitBand.ts#AutoMovieConstructionSplitBand.strip

## @evidence contracts/development/implementation.md#principled-implementation

Matches the child's rail to the loop by angle about the rail's centroid, pairs each loop ribbon with the child's own 2-jet at its rail (or the crease's chord arrival), scales both by the monotone factor and publishes the join's strip chain.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The caller supplies only its loop and its start ribbons; correspondence, scale and publication are shared.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a nonmonotone correspondence, collapsed or nonfinite columns and a strip without orientation or surface; a column whose ribbon points back against its chord is kept unaltered and named in `scale.backward`, never patched.

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the steps and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in columns apart from the correspondence's bisections and each column's scale search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each column's child jet serves its chord, its ribbon and its scale.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Temporary columns are released; the result is caller-owned.

# src/geometry/construction/AutoMovieConstructionSplitBand.ts#AutoMovieConstructionSplitBand.profiled

## @evidence contracts/development/implementation.md#principled-implementation

The piecewise quintic Hermite through the plain strip's rails and the displaced cross sections, so the profiled strip less the plain strip is the profile's displacement alone, zero with its cross 2-jet at both rails.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One chain build from the plain strip's stored columns and one section pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses a chain without span, orientation or surface; nothing is refitted.

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the displacement's direction and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

One jet of each surface per column and profile share, then the chain's O(n) interpolations per layer.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The plain strip's scaled columns are reused as the rail layers.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a caller-owned chain and surface; retains nothing else.

# src/geometry/construction/AutoMovieConstructionSplitBand.ts#AutoMovieConstructionSplitBand.weight

## @evidence contracts/development/implementation.md#principled-implementation

The quintic smoothstep has zero first and second derivatives at both ends, so the weighted ribbons stay C2 along the loop.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One periodic distance and one polynomial.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The window is authored; no geometry decides it.

## @evidence contracts/development/common.md#meaningful-documentation

States the window, the fall law and the absent case.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure scalar function coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/geometry/construction/AutoMovieConstructionSplitBand.ts#AutoMovieConstructionSplitBand.largest

## @evidence contracts/development/implementation.md#principled-implementation

Searches the Bezier-hull monotonicity condition (`monotone`) along the scale; the found value holds it, though the holding set need not be an interval, so a larger holding scale may exist.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Halving then bisection, one predicate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance on the condition; a scale that fails is never returned.

## @evidence contracts/development/common.md#meaningful-documentation

States the search, its bound and its null case.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most about 30 halvings and 40 bisection steps, each six control points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure numeric search coordinates no work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/geometry/construction/AutoMovieConstructionSplitBand.ts#AutoMovieConstructionSplitBand.cornerOf

## @evidence contracts/development/common.md#meaningful-documentation

Names the clock width corresponding to one physical reach and the nonoverlap condition for two fork turns.

## @evidence contracts/development/implementation.md#principled-implementation

Maps the fraction of seam length occupied by the physical reach to the same fraction of the seam clock. Each fork receives at most half the clock.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One scalar conversion serves both fork ends.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The caller supplies a positive seam length and an admitted reach. The half-clock limit follows from the two ends sharing one span.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses a fixed number of scalar operations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A synchronous scalar operation over its supplied inputs prepares no shared work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only the scalar result leaves this synchronous operation.
