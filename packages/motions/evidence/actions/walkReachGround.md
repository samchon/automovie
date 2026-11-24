# src/actions/walkReachGround.ts#walkReachGround

## @evidence contracts/development/common.md#meaningful-documentation

States frames, units, claim replacement, rocker onset, the tilted pelvis and both returned stances.

## @evidence contracts/development/implementation.md#principled-implementation

Solves the smooth maximum's fixed point by a bracketed root with every taking foot's whole claim, once for each set of fading feet kept or left out, and runs between those lowerings by the feet's weights (multilinear), so the lowering is continuous in a weight: a weight inside the fixed point is ill-posed where a stance trades heel rise for lowering at a slope of one. Only stances whose claims read their ankles participate in trial placement, and deferred endpoints fit at that same final root when read.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Moved from `walkReach`, which keeps the pelvis's turn (`walkReach.pelvis`) its callers give it; the given pelvis and fixed weights precede trial placement, the scalar root solve and final endpoint completion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the claim of a whole stance, the bracket expansion, the root tolerance and the foot ranges; a weight of one or none gives the single lowering it gave before, and inactive stances only skip trials whose residual cannot read them.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one root solve when no foot is fading, two with one fading foot and four with both. A fixed lowering is returned directly when no stance in the current mask depends on it, or a tested bracket endpoint already satisfies it. Each root trial fits only the participating bearing stances. Body-only short-reach preparation is lazy behind an unnamed bearing claim. Inactive final endpoints fit only if read. A bearing stance reuses a reading at the same lowering within the solve.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Stance weights and claim ownership remain fixed within one ground solve, so its root solves and their trials share them and the prepared stance readers without sharing across input postures.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned ground result owns two endpoint records and one deferred final-fit callback until the query releases it; no time history or global cache is retained.
