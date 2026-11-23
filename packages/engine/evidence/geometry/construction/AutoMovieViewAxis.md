# src/geometry/construction/AutoMovieViewAxis.ts#AutoMovieViewAxis.straight

## @evidence contracts/development/implementation.md#principled-implementation

Moves the origin affinely along v-cross-u with fixed supplied chart directions and their exact zero derivatives.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Value and jet callbacks share one affine frame reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Supplied directions are caller-admitted; no fitted plane replaces them.

## @evidence contracts/development/common.md#meaningful-documentation

States mm station/origin and fixed chart directions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic and fixed output storage per read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Computes the normal once for all queries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The immutable input vectors live with the axis; returned vectors are fresh.

# src/geometry/construction/AutoMovieViewAxis.ts#AutoMovieViewAxis.horizontal

## @evidence contracts/development/implementation.md#principled-implementation

Specializes the straight owner to world height with u=+X and v=+Z.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates value and derivative ownership to straight.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the documented world frame without a source-dependent replacement.

## @evidence contracts/development/common.md#meaningful-documentation

States horizontal plane directions and station meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant builder and straight-query work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One prepared straight axis serves every station.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the returned fixed-size axis closure is retained.

# src/geometry/construction/AutoMovieViewAxis.ts#AutoMovieViewAxis.level

## @evidence contracts/development/implementation.md#principled-implementation

Natural scalar offsets define (x(s),s,z(s)); analytic derivatives preserve fixed world-level planes.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two prepared source splines serve one value/jet pair.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps actual knot interpolation and explicit end-tangent extension without sampled plane fitting.

## @evidence contracts/development/common.md#meaningful-documentation

States increasing mm station/offset knots and exterior tangent behavior.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear knot preparation; queries scan the two prepared natural sources.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Both callbacks share the two curvature preparations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The axis owns its two prepared knot-sized splines; query outputs are local.

# src/geometry/construction/AutoMovieViewAxis.ts#AutoMovieViewAxis.jointed

## @evidence contracts/development/implementation.md#principled-implementation

Transports a frame through quintic-angle turns parameterized by arclength; exact parallel segments have no turn or setback, while atan2 of normalized cross magnitude and dot retains representable small nonzero angles that acos(dot) can lose.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Uses one admitted course for frames and published straight runs.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A nonzero turn requires positive half arclength; exact zero turns consume no length and near-parallel turns are not thresholded away.

## @evidence contracts/development/common.md#meaningful-documentation

States arclength, initial frame, turn law, setback and explicit admission failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

Course preparation is linear in centres with fixed quadrature per nonzero turn; a frame query walks preceding turns and repeats fixed quadrature for each nonzero one, including completed turns.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Prepares each turn's angle, axis and full setback once for all frame queries.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned axis owns its finite course arrays; frame query vectors are local and no global cache retains an axis.

# src/geometry/construction/AutoMovieViewAxis.ts#AutoMovieViewAxis.runs

## @evidence contracts/development/implementation.md#principled-implementation

The runs come from the same course the axis frames are read from (its turns' set-backs and arclengths), so a station placed by a run is the station `jointed` reads at that point.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One run per segment from the same centres and half lengths `jointed` takes.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An inadmissible course returns its rule exactly as `jointed` does.

## @evidence contracts/development/common.md#meaningful-documentation

States the runs, the station formula and the failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

One course build: a fixed Gauss-Legendre quadrature per turn and a linear pass over the segments.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the course builder with `jointed` instead of repeating the set-back integral.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns the runs; the course is released with the call.

# src/geometry/construction/AutoMovieViewAxis.ts#AutoMovieViewAxis.minimal

## @evidence contracts/development/implementation.md#principled-implementation

Applies Wang et al.'s double-reflection RMF to the natural component splines and their analytic tangents, with scale-safe direction/reflection arithmetic. The caller supplies increasing finite knots, a regular nonzero tangent, a usable initial normal projection and a finite positive step. This numerical transported frame is not an exact frame-jet API or a repair of inadmissible curves.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three prepared coordinate splines and one initial projected direction define station-local frame queries; no second curve or transport registry is introduced.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Uses the original two Householder reflections rather than a fitted frame or world-axis substitution; exceptional norm scaling preserves the same reflection plane, and only an exactly zero chord retains the prior direction.

## @evidence contracts/development/common.md#meaningful-documentation

States natural station interpolation, initial projection, step, tangent extension, caller premises and the numerical frame-value limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares three natural splines in linear knot work; each query marches ceil(abs(station-first)/step) steps and performs constant component-spline reads per step. Independent queries repeat this march, so distant stations or tiny steps can be expensive.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

All queries share the prepared component splines and initial projected up; each independently reconstructs its transport from the first knot, without assuming another query's trajectory is equivalent.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned axis retains three knot-sized splines and fixed initial vectors. A query holds fixed-size working vectors while allocating transient vectors per step; it retains no station cache or external resource after returning.

# src/geometry/construction/AutoMovieViewAxis.ts#AutoMovieViewAxis.normal

## @evidence contracts/development/implementation.md#principled-implementation

Uses the declared chart orientation v-cross-u.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared vector cross product returns the direction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not normalize a malformed frame into an admitted one.

## @evidence contracts/development/common.md#meaningful-documentation

States orientation and unit-length premise.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed triple arithmetic takes constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure vector reading coordinates no requests.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh triple and retains nothing.
