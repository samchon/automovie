# src/nature/irregularRockForm.ts#irregularRockForm

## @evidence contracts/development/implementation.md#principled-implementation

A Fibonacci lattice spreads the 64 corner directions over the sphere in equal-area latitude bands a golden angle apart (González 2010, Mathematical Geosciences 42), and each direction is scaled by `r (1 + 0.3 n(d))`, `n` the engine's three-octave fractal noise read at the unit direction, so neighbouring corners move together and every reach stays within `[0.7 r, 1.3 r]`, never through the centre. Corners below a fifth of the raw height are raised onto that plane, which becomes the one flat base facet at `y = 0`. Turning about +Y by minus the plan angle of the farthest plan pair maps that pair's offset onto X, and no pair's X difference exceeds its plan distance, so the X extent is the largest horizontal extent; centring the plan box and scaling uniformly to `diameter` keeps the shape and the base at `y = 0`. The cell holds only the hull's corners, because a convex collider admits no interior point. `top` is the hull's highest corner, and `side` is where the +Z ray at half that height from the centroid's plan position leaves the hull: the least `(offset - n · start) / n.z` over the faces facing +Z. Limits: the hull drops every concavity of the displaced corners, and of two equally distant farthest pairs the first found sets the turn.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass per step: cast the corners, cut the base, turn, centre and scale, then build the hull and read the cell, the top and the side from that same hull. The noise belongs to the engine's `createAutoMovieFractalNoise3`, the hull to `physicalHullFaces` and the cell's admission to `AutoMovieArchetypeConvexCell.of`; `createRock` owns the seed, the diameter band and the mass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The corner count, displacement, base cut and noise octaves and roughness are named construction constants no act reads; the diameter comes from the caller's drawn band. Nothing is keyed on a seed, a kind or a test. The half-height ray refusal is a defect guard: a convex stone resting on its base always contains that start point.

## @evidence contracts/development/common.md#meaningful-documentation

States the construction step by step with its citation, the named construction constants, the frame and size the result keeps, the loss of concavities, the returned contacts and the one defect refusal.

## @evidence contracts/development/implementation.md#efficient-algorithms

The fixed corner count N = 64 drives the cost: 64 three-octave noise samples, an O(N²) plan-pair search of 2,016 pairs, one hull and one scan of its faces for the ray. Space is O(N).

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call builds one independent form from its seed and diameter.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing beyond the returned cell and points, and acquires no handle or task.
