# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Result

## @evidence contracts/development/common.md#meaningful-documentation

The output distinguishes ordinary transport and its reversal from unsupported components and orientation warnings.

## @evidence contracts/development/design.md#principled-representation

A pair requires one arc per boundary, a unique component and two distinct simple source-boundary paths. Endpoint correspondence along those paths sets its direction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Graph queries address only the supplied arc arrays. The continuation observer translates those indices into saved curve ordinals.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Result.pairs

## @evidence contracts/development/common.md#meaningful-documentation

The query appends pairs only after proving the two endpoint paths. It sorts by before then after input ordinal.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Result.unresolved

## @evidence contracts/development/common.md#meaningful-documentation

The query preserves both incident populations, including groups with an empty before or after side.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Result.diagnostics

## @evidence contracts/development/common.md#meaningful-documentation

The query publishes winding conflicts independently of its ability to trace ordinary endpoint transport.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Source

## @evidence contracts/development/common.md#meaningful-documentation

The source uses registered vertex and triangle order. Every canonical alias must agree with its representative in position and scalar height.

## @evidence contracts/development/design.md#principled-representation

Canonical edge and face incidence identify physical source boundaries. Scalar height decides which part of that incidence reaches the open interval.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The source owns its borrowed arrays and original IDs. A prepared query reuses source incidence and emits local findings without altering the mesh.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Source.vertices

## @evidence contracts/development/common.md#meaningful-documentation

Aliased vertices must have the same Cartesian coordinates as their idempotent representative.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Source.triangles

## @evidence contracts/development/common.md#meaningful-documentation

Original triangle order remains the address space for candidate faces, support and winding observations.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Source.canon

## @evidence contracts/development/common.md#meaningful-documentation

Each alias must map to an in-range representative that maps to itself.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Source.heights

## @evidence contracts/development/common.md#meaningful-documentation

The prepared clipped-slab graph requires finite values and validates equality over each canonical alias.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Query

## @evidence contracts/development/common.md#meaningful-documentation

Each query supplies exact scalar bounds, positional arc arrays on both boundary cuts, defect face sets and the candidate face population.

## @evidence contracts/development/design.md#principled-representation

Boundary arc endpoints and face sets connect saved arcs to the clipped source sheet's topology. Candidate faces bound which source incidence enters that query.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The query borrows prepared source arrays. Local arc arrays own their ordinals and each defect cites actual source faces.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Query.beforeMm

## @evidence contracts/development/common.md#meaningful-documentation

It defines the lower cut and must lie strictly before afterMm.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Query.afterMm

## @evidence contracts/development/common.md#meaningful-documentation

It defines the later cut and must exceed beforeMm.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Query.before

## @evidence contracts/development/common.md#meaningful-documentation

Qualified and unresolved result entries address this array directly.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Query.after

## @evidence contracts/development/common.md#meaningful-documentation

The boundary path pairing can reverse an upper arc relative to its original endpoint order.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Query.defects

## @evidence contracts/development/common.md#meaningful-documentation

The query passes supplied defects and measured invalid local incidence to the clipped-sheet component test.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Query.candidates

## @evidence contracts/development/common.md#meaningful-documentation

The continuation observer gets these face IDs from the scalar index for the same lower and upper station.

# src/recovery/IAutoMovieRecoveryOpenSlabGraph.ts#IAutoMovieRecoveryOpenSlabGraph.Prepare

## @evidence contracts/development/common.md#meaningful-documentation

Preparation separates reusable immutable source indexing from source-local arc and defect queries.

## @evidence contracts/development/design.md#principled-representation

Reuse the closed-sheet connectivity admission, then trace physical boundary components and compare endpoint path identities.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Preparation borrows source coordinates and incidence. Each query owns its pairs, open groups and separate winding findings.
