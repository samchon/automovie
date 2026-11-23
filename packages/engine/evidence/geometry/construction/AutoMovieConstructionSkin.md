# src/geometry/construction/AutoMovieConstructionSkin.ts#AutoMovieConstructionSkin.close

## @evidence contracts/development/implementation.md#principled-implementation

Maps original chain surfaces by identity and consumes draw's complete endpoint record. An owned original tip is evaluated and recorded at its actual source station, separately from physical2; old datum-only poles retain their existing fan behavior.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Cap selection stays at the chain/body boundary while SolidMesh owns vertex insertion and orientation-aware triangle emission.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Skips non-chain faces, generic planar rims with end null and ends without a pole. Does not infer this face's station from a foreign owner's coordinates or cap a partial periodic endpoint rejected by draw.

## @evidence contracts/development/common.md#meaningful-documentation

States body mutation, open-cycle provenance and pole-only closure. Owned tips require surface Point0 and use its chart station; datum-only legacy fans do not acquire a new source replay claim.

## @evidence contracts/development/implementation.md#efficient-algorithms

Chain-map construction and boundary-fan work are linear in their inputs; each mapped face additionally scans up to R existing mesh owners, so F such faces can pay O(FR) lookup work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One surface-to-chain map serves all faces; existing ring vertices are reused by fans rather than copied as a second boundary.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The local map and fan arrays die after the call; the body retains emitted apex vertices/triangles and any newly registered surface owner for its own lifetime.

# src/geometry/construction/AutoMovieConstructionSkin.ts#AutoMovieConstructionSkin.mesh

## @evidence contracts/development/implementation.md#principled-implementation

Divides world positions by the shared mm-per-metre scale and copies indices/chart coordinates while projecting owner records to their names.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One output adapter owns physical unit conversion without changing chart units or rebuilding triangles.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the emitted topology/winding and clips coordinate copying to the position-derived vertex count; it does not repair geometry or certify a closed skin.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes metre positions from unchanged owner-chart coordinates and names the returned owner labels.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear O(V+T+F) copying for V vertices, T triangles and F owners allocates the required detached output arrays.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the already drawn body arrays once rather than retessellating; owner closures are replaced by names because this output requires labels only.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns fresh position/index/coordinate/name arrays sized by this mesh; the adapter retains neither body nor surface closures globally.
