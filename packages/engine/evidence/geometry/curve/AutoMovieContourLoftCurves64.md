# src/geometry/curve/AutoMovieContourLoftCurves64.ts#AutoMovieContourLoftCurves64.curve

## @evidence contracts/development/implementation.md#principled-implementation

Cyclic chord accumulation preserves a closed polygon in its supplied millimetre frame.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns the named curve operation and composes only the shared vector and Bernstein owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.

## @evidence contracts/development/common.md#meaningful-documentation

States the curve chart, boundary meaning or degeneracy relevant to this operation.

## @evidence contracts/development/implementation.md#efficient-algorithms

One linear pass over N points uses N+1 cumulative values.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure local curve operation owns no cross-request cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local scratch expires on return; only the declared result transfers to the caller.

# src/geometry/curve/AutoMovieContourLoftCurves64.ts#AutoMovieContourLoftCurves64.at

## @evidence contracts/development/implementation.md#principled-implementation

Binary search selects one cyclic arclength interval and interpolates its two endpoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns the named curve operation and composes only the shared vector and Bernstein owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.

## @evidence contracts/development/common.md#meaningful-documentation

States the curve chart, boundary meaning or degeneracy relevant to this operation.

## @evidence contracts/development/implementation.md#efficient-algorithms

The interval search is O(log N) with constant-size vector output.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure local curve operation owns no cross-request cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local scratch expires on return; only the declared result transfers to the caller.

# src/geometry/curve/AutoMovieContourLoftCurves64.ts#AutoMovieContourLoftCurves64.sample

## @evidence contracts/development/implementation.md#principled-implementation

Equal normalized arclength phases call the same polygon evaluator.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns the named curve operation and composes only the shared vector and Bernstein owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.

## @evidence contracts/development/common.md#meaningful-documentation

States the curve chart, boundary meaning or degeneracy relevant to this operation.

## @evidence contracts/development/implementation.md#efficient-algorithms

M samples require O(M log N) interval queries and O(M) output vectors.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure local curve operation owns no cross-request cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local scratch expires on return; only the declared result transfers to the caller.

# src/geometry/curve/AutoMovieContourLoftCurves64.ts#AutoMovieContourLoftCurves64.centroid

## @evidence contracts/development/implementation.md#principled-implementation

Component sums divided by the supplied sample count define their arithmetic centre.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns the named curve operation and composes only the shared vector and Bernstein owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.

## @evidence contracts/development/common.md#meaningful-documentation

States the curve chart, boundary meaning or degeneracy relevant to this operation.

## @evidence contracts/development/implementation.md#efficient-algorithms

One O(N) traversal creates only a three-component accumulator.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure local curve operation owns no cross-request cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local scratch expires on return; only the declared result transfers to the caller.

# src/geometry/curve/AutoMovieContourLoftCurves64.ts#AutoMovieContourLoftCurves64.controls

## @evidence contracts/development/implementation.md#principled-implementation

Original controls and the exact recorded left/right half path reproduce the restriction's subdivision arithmetic; an explicitly supplied child net is reused.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

All leaf consumers resolve one coefficient authority through this accessor.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampled fit, source mesh or new coefficient definition replaces the saved cubic.

## @evidence contracts/development/common.md#meaningful-documentation

States lazy ownership and the retained arithmetic path.

## @evidence contracts/development/implementation.md#efficient-algorithms

A previously unmaterialized leaf takes O(depth) constant-degree splits, with depth at most thirty for original sampling.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Contacted leaves cache their resolved net; ordinary leaves retain only the original span reference and half-path metadata.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only contacted leaf nets remain materialized in the invocation; immutable caller controls are never mutated.

# src/geometry/curve/AutoMovieContourLoftCurves64.ts#AutoMovieContourLoftCurves64.partition

## @evidence contracts/development/implementation.md#principled-implementation

Exact De Casteljau children retain their source phases and controls; nonconstant zero-chord restrictions split even under a coarse physical tolerance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Initial tessellation and later geometric interaction refinement use the same adaptive owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No minimum population, changed tolerance, fitted child or positional snap supplies a restriction.

## @evidence contracts/development/common.md#meaningful-documentation

Separates exact-restriction ancestry from additional adaptive work; compressed half-path addresses retain their thirty-level representation limit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant-degree tests visit K retained leaves. Adaptive half subdivision stops at depth thirty; deeper explicit restrictions can only be retained when their current physical bound already passes.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each restriction is evaluated once by this recursive partition.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returned child nets transfer to the caller; recursive scratch expires on return.

# src/geometry/curve/AutoMovieContourLoftCurves64.ts#AutoMovieContourLoftCurves64.hasArea

## @evidence contracts/development/implementation.md#principled-implementation

A nonzero chord and a nonzero cross product establish affine rank at least two under binary64 arithmetic; nonfinite arithmetic rejects rather than certifies a rank.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One linear rank check is shared by cubic boundary representation and downstream tile admission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No coordinate merge, distance epsilon or sample population floor establishes area.

## @evidence contracts/development/common.md#meaningful-documentation

States affine-rank meaning and numerical scope; this does not establish simple-curve embedding or nonzero signed area.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two linear scans use constant extra vector storage for N points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This pure per-boundary query retains no cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Only a boolean escapes; vector scratch expires on return.

# src/geometry/curve/AutoMovieContourLoftCurves64.ts#AutoMovieContourLoftCurves64.tessellate

## @evidence contracts/development/implementation.md#principled-implementation

C0-closed coefficients are split by Bernstein subdivision until control-hull chord error meets tolerance. Exact constant leaf intervals are quotiented from the cyclic trace; a wholly constant source retains one diagnostic knot. A nonconstant zero-chord leaf must split; a rank-one closed graph is refined at a source leaf carrying omitted transverse extent. Collinear sources remain rank deficient for local diagnostics.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns the named curve operation and composes only the shared vector and Bernstein owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Exact source subdivision supplies every new knot with its inherited phase. No minimum sampling density, tolerance change, artificial point, coordinate weld or source coefficient change repairs a collapsed cyclic polygon.

## @evidence contracts/development/common.md#meaningful-documentation

States the curve chart, boundary meaning or degeneracy relevant to this operation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each cubic subproblem has constant degree; K retained leaves use O(K) storage and at most 30 recursive levels. R topology refinements inspect O(RK) leaf data and use the same adaptive chord test on exact children.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure local curve operation owns no cross-request cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local scratch expires on return; only the declared result transfers to the caller.

# src/geometry/curve/AutoMovieContourLoftCurves64.ts#AutoMovieContourLoftCurves64.exterior

## @evidence contracts/development/implementation.md#principled-implementation

The farthest sampled-boundary point from its arclength centre avoids an ambiguous doubled branch slit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This helper owns the named curve operation and composes only the shared vector and Bernstein owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No anatomy, source surface topology, copied normal field or coordinate rescaling enters this operation.

## @evidence contracts/development/common.md#meaningful-documentation

States the curve chart, boundary meaning or degeneracy relevant to this operation.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sixty-four logarithmic arclength queries and one O(N) scan choose the seam.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure local curve operation owns no cross-request cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Local scratch expires on return; only the declared result transfers to the caller.
