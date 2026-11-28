# src/geometry/IAutoMovieCreateSupportSectionQuery.ts#IAutoMovieCreateSupportSectionQuery.IInput

## @evidence contracts/development/common.md#meaningful-documentation

Fixed oriented unit half-plane directions and minimum determinant magnitude for reusable section queries.

## @evidence contracts/development/design.md#principled-representation

Preparation copies directions and enumerates nonparallel pairs once. A query may reuse a previously proved cyclic active edge seed after checking the current inequalities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The input supplies fixed constraints and an angular reliability threshold. Per-query offsets and fresh corner results remain separate.

# src/geometry/IAutoMovieCreateSupportSectionQuery.ts#IAutoMovieCreateSupportSectionQuery.IInput.normals

## @evidence contracts/development/common.md#meaningful-documentation

Ordered dense finite unit XZ normals surrounding a bounded chart. Preparation copies them. Supply a bounded plane population.

# src/geometry/IAutoMovieCreateSupportSectionQuery.ts#IAutoMovieCreateSupportSectionQuery.IInput.minimumDirectionSine

## @evidence contracts/development/common.md#meaningful-documentation

Finite threshold strictly between zero and one. A feasible nonparallel tight pair with smaller absolute determinant refuses.

# src/geometry/IAutoMovieCreateSupportSectionQuery.ts#IAutoMovieCreateSupportSectionQuery.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Synchronous fixed-normal query taking one finite metre offset per normal and returning a new counterclockwise polygon.

## @evidence contracts/development/design.md#principled-representation

The query computes feasible intersections for current offsets and may use the previous successful active edge order as a rechecked combinatorial seed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The closure retains fixed direction data and one seed. It returns owned vertices independently of previous offsets and results.
