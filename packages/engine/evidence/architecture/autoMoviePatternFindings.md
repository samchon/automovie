# src/architecture/autoMoviePatternFindings.ts#autoMoviePatternFindings

## @evidence contracts/development/implementation.md#principled-implementation

Combines adjacent centre buckets with separating-axis projection gaps over clipped convex outlines; grain directions compare modulo 180 degrees. The ideal convex SAT overlap theorem requires nondegenerate geometry and finite intermediate arithmetic, which extreme finite coordinates alone do not guarantee. No Euclidean-distance narrow-phase filter is performed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split from the pattern run so laying and judging are separate responsibilities: the run produces placements and this reads only them and the declared limits.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Names no zone, module or material. Declared limits plus fixed length/coverage comparison slack apply to every placement; that slack is an acceptance policy, not a proved bound on arbitrary binary64 error.

## @evidence contracts/development/common.md#meaningful-documentation

States finding thresholds/order, the centre-bucket candidate rule, sorted partners, edge-normal measurement and its difference from Euclidean neighbourhoods, plus the generated-geometry and arithmetic premises.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) bucket construction plus candidate gathering and sum(k_i log k_i) partner sorting. Each judged pair with Vi/Vj vertices costs O((Vi + Vj)²), projecting both outlines for every edge normal. Dense buckets can produce N² pairs; outline sizes and candidate density have no fixed small bound.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Judges one run's placements per call; the bucket grid is built once per call and serves every piece.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Buckets and the largest per-piece partner set/sorted array use O(N) local storage, released on return. Returned findings can use O(N²) records; the caller owns them, with no silent truncation cap.
