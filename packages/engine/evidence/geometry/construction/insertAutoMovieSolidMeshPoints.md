# src/geometry/construction/insertAutoMovieSolidMeshPoints.ts#insertAutoMovieSolidMeshPoints

## @evidence contracts/development/implementation.md#principled-implementation

Lawson's and Guibas and Stolfi's incremental insertion step: exact orientation signs locate the point, and the containing triangle splits into three, or the two beside an unconstrained diagonal into four. Location and publication share the inserted point's own cover, because exact signs agree only on one set of represented coordinates and a period shift rounds; each new triangle's orientation is a nonzero location sign there, and a strict cavity can expand only across unconstrained sides while keeping original point occurrences. A thin exact split whose cavity reaches an authority uses its constraint region for membership.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One index-only insertion between boundary ear triangulation and legalization; region membership belongs to the planner, flips to legalization, grid evaluation and boundary subdivision to their own owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Constructs, moves, welds or drops no point, flips or removes no source constraint, changes no period and compares no sign against a tolerance; a point on a constraint, a vertex or an unshared boundary, a nonmanifold location or a half-period split returns a named failure, never a partial result.

## @evidence contracts/development/common.md#meaningful-documentation

States the two split cases, why a thin triangle is valid, where its membership comes from, the one cover every sign and published triangle is read in and every refusal with its diagnostic.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each of M inserted points scans the T current triangles once to locate itself and writes a new array of T + 2 triangles: O(M(T+M)) time. A thin fan can additionally traverse its triangle adjacency, bounded by the current triangle population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses original points, constraint keys and located corners. Only a thin fan builds the cavity's edge map, and no source is evaluated again.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Working triangles and identity sets take O(V+T+M) storage; input arrays, maps and the membership callback are borrowed for the call, and every returned triangle triple is caller-owned.
