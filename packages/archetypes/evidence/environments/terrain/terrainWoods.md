# src/environments/terrain/terrainWoods.ts#terrainWoods

## @evidence contracts/development/implementation.md#principled-implementation

Jittered grid sampling (Cook 1986, ACM Transactions on Graphics 5(1)) with cells of side `1.5 * spacing` and a centred jitter square of side `0.5 * spacing` guarantees that sites in adjacent cells are at least `spacing` apart along the separating axis, and farther cells farther, so no pairwise rejection pass is needed. Each site reads its cell's own Philox block from the counter stream of `deriveAutoMovieSeed(seed, "woods", name)`: two words jitter it, one chooses its species by cumulative weight and one orders it, so a site depends only on the seed, the recipe and its cell, and removing one site by exclusion moves no other. The clearance radius is the largest drawn trunk radius among the weighted prototypes times the scale, so every planted species clears. Heights come from the accepted terrain rule through `surfaceHeightAt`, and the set's anchor has Y zero, so a transform's Y is the world height at its site. Limits: jitter spends 32-bit words, so the jitter grid is quantized at about `spacing / 2^33`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The terrain module owns the accepted height rule and `prepareTerrainGrades` the protected-area query; this function owns only site generation, admission, species choice and the instance record. `createTree` draws the prototypes and the engine's `instanceSlot` regenerates every slot from the explicit transforms, so placement, scale and prototype selection stay with their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The spacing, outline, count, species and scale come from the recipe; the 100,000 tree bound is the instance set's slot bound and the 1,000,000 cell bound mirrors the terrain lattice's sample budget. No site is retried or nudged: a rejected site is simply absent. A count above the accepted sites is refused with the number that fit, and malformed outlines, spacings, counts, scales and weights are refused by the wood's id.

## @evidence contracts/development/common.md#meaningful-documentation

States the sampling rule and its spacing guarantee, the admission tests, the stream layout of each cell, the seeded order and count, the height source and the refusals.

## @evidence contracts/development/implementation.md#efficient-algorithms

Time is O(cells x (outline vertices + protected features)) for the admission scan plus O(sites log sites) for the seeded sort; the scan must visit every cell of the outline's bounding box because each cell holds one candidate. Space is O(accepted sites). The grid bound refuses a scan beyond 1,000,000 cells before any is visited.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One prototype model per weighted species serves every slot of its wood, and the instance set references it rather than copying geometry. Each wood derives its own stream from its name, so adding or removing a wood does not change another's sites.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller owns the returned models and instance sets; the function retains nothing and acquires no handle or task. The accepted-site list is bounded by the cell bound and released on return.
