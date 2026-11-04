# Performance read of the body's construction tree

Written 2026-11-04 by reading the code only; nothing was run. It covers the path one f1 whole figure takes since the body lane became one construction tree on the engine (6c95c21b6). The figure went from 400 to 450 s up to about 600 s. Every cost below is an estimate from the code, there to be confirmed or refuted by measurement, and it names the standard technique the code departs from.

## The path and its counts

`AutoMovieHumanShapeStages.shape` → `AutoMovieHumanBodyLaw.calibrate` → today's whole old body (`AutoMovieHumanEventJoin.reconcile(...)`, kept as `legacy`) → `AutoMovieHumanBodyLaneInterim.of` → `AutoMovieHumanBodyLane.create` → `AutoMovieHumanTrunkBuild.create` (two passes) and every part's `AutoMovieHumanSiteViewPart.create` → `AutoMovieHumanBodyTree.realize` → `realizeAutoMovieConstruction` → back in the shape stages `AutoMovieHumanBodySurface.generate`, which draws the merged skin again (`AutoMovieHumanBodySurfaceSolids.draw`).

The head's construction tree (7f1b5510b) is not on this path. `AutoMovieHumanHeadComposer` and `AutoMovieHumanHeadTree` are called only from `debug/` (`HumanDebugPieceHeadParts`, `HumanDebugViewParts`), so the figure's head still comes from `AutoMovieHumanHeadConstruction`. If the 600 s was timed through the debug view parts, the head tree is included; otherwise it is not.

f1's tree, read from `AutoMovieHumanBodyLane.create`, has these parts:

- 1 trunk at order 256 with 512 samples, about 170 layers at its 3.5 mm gap.
- 4 masses at order 128.
- 2 legs at order 256, about 230 layers.
- 2 arms at order 256.
- 2 feet.
- 20 digits at order 64 with a 1 mm gap.

It has about 30 joins: 4 masses, then per side 5 toes, the leg on its foot, the leg on the trunk, 5 digits and the arm on the trunk.

Each join is left-deep: its host is an atlas of every face built so far.

Work per join, counted in surface jets. One jet is `IAutoMovieSolidSurface.jet` → `AutoMovieLoftJet.at`.

| Step | Where | Jets |
| --- | --- | --- |
| Seed search | `AutoMovieConstructionSeeds.create` | ~20 when the first step meets; up to 60 + 544 per step when the foot fails |
| Trace #1, for the fold width | `realizeAutoMovieConstruction.ts:132` | ~64 × 10 = 650 |
| Fold width | `AutoMovieConstructionWidths.turn` | 128 |
| Trace #2, the same seed and limits | `AutoMovieSolidJoin.ts:161` (via `AutoMovieSolidBody.merge`) | ~650 |
| Columns at the traced points | `AutoMovieSolidJoin.ts:196` | 64 × ~25 = 1,600 |
| Fold check at t ± step | `AutoMovieSolidJoin.ts:215-231` | 128 × ~30 = 3,900 |
| The same 64 columns solved again | `AutoMovieSolidBlendChain.ts:102` | 1,600 |
| Host rail and crossings | `AutoMovieSolidClip.ts:94-113` | 64 + 42 × ~27 = ~1,200 per crossing |
| The same 64 columns a third time | `AutoMovieHumanMergeEntry.of` in `AutoMovieHumanBodyTree.realize` | 1,600 (the working tree already switches this to `MergeEntry.from`, uncommitted) |

Without crossings that is about 10,000 jets per join and 300,000 per figure. About 60% of them land on a station not seen before, which costs O(N) (item 2).

## Unbounded risk: measure this first

Steady-state reading puts the tree's own work at roughly 10 to 25 s (items 2 to 8). That is far below the +150 to 200 s regression. The only mechanism visible in the code that could add that much is a retry cascade in the Newton solves:

- The traces are asked for 1e-6 mm (`AutoMovieHumanBodyLane.ts:244`). That is four orders under the 0.01 mm representation error the same comment states.
- `AutoMovieSolidTraceSolve.solveOn` makes up to 40 Newton steps, each with up to 20 line-search halvings (`AutoMovieSolidTraceSolve.ts:27, 86, 93`).
- A failed solve makes `advance` halve the parameter step up to 24 times (`:30, 206, 227`).
- One traced point in that state costs up to 24 × 40 × 20 × 2, about 38,000 jets. That is 60 times a whole healthy join.
- Rail solves converge to a relative 1e-12 of (chord + |point|), about 1e-9 mm, in up to 40 steps each (`AutoMovieSolidRail.ts:91, 94`). The seed's meet takes 40 steps and the foot 60.

Quadratic convergence makes a tight tolerance cheap when it converges: one extra Newton step from 1e-4 to 1e-8. Near grazing contacts (toes, thumb), on face switches across the atlas (`AutoMovieSolidTraceSolve.solve`), or where rounding of an O(N) combine sits near the threshold, a solve stalls and the whole halving ladder runs.

Measure these counters per join on f1, each against the join's name:

1. A histogram of `solveOn` iterations.
2. Line-search halvings.
3. `advance` halvings.
4. Null solves.
5. Rail `offset` and `section` iterations.
6. Seed `nearest` grids.

The literature's marching methods do not run a ladder like this:

- Patrikalakis and Maekawa, *Shape Interrogation*, §5.8.
- Barnhill and Kersey 1990, *CAGD* 7.
- Bajaj, Hoffmann, Lynch and Hopcroft 1988, *CAGD* 5.
- OpenCASCADE `IntWalk_PWalking`.

They size each step from the curve's curvature for a chordal deviation, `h = sqrt(8 δ / κ)`. The point's second derivative is already carried in `IPoint.second`. They correct with 2 or 3 Newton steps from a second-order predictor, at a tolerance tied to the model tolerance (`Precision::Confusion`), so a halving is rare. **Fix if confirmed:**

- Trace tolerance 1e-4 mm, which is still 100 times under the representation error.
- At most about 8 Newton steps.
- A step from curvature instead of fixed 2π/64 targets.
- Rails converged to 1e-6 mm absolute.

## Ranked inefficiencies

Ranked by expected saving per f1 figure. "Regression" marks work the tree added; "pre-existing" marks work it inherited.

### 1. Today's whole old body is built for a few readers (pre-existing; tens of seconds)

**Where.** `AutoMovieHumanBodyLaw.ts:89-127` builds the full old body: trunk, arms with hands, feet, legs and `AutoMovieHumanEventJoin.reconcile` over every chain.

**What reads it:**

- The head chains after reconcile (`:158`).
- The interim's old arm, `hand.*.1`, digit, toe and foot chains (`AutoMovieHumanBodyLaneInterim.ts:94-98`).
- The rig's `legacy` (`:177`): joint centres, neutral rings at `READS`, the foot surface.

**What it costs.** The old legs (`LegConstruction.add`) and the reconcile serve only the rig's readers. The hands build `AutoMovieHumanBodySurface` meshes `SKIN_ROUNDS` = 2 times per hand key (`AutoMovieHumanHandSkinTargets.ts:41, 84`). The modeler log's lofting rows put the old body's lofting at about 29 s of 178 s, with webs at 7.4 s and the arm law at 4.1 s.

`AutoMovieHumanTrunkSolver.solve` also runs twice on the same inputs: `AutoMovieHumanTrunkConstruction.ts:45` and `AutoMovieHumanBodyLaneInterim.ts:87`.

**Standard.** Compute what is read and nothing else, through a demand-driven dependency graph.

**Fix:**

- Build only the old pieces the interim reads.
- Read the rig's rings and centres from the lane chains, or from the old limbs without legs and reconcile.
- Pass the trunk solution from `TrunkConstruction` to the interim.

This needs the owner's call on retiring `legacy`.

### 2. Every surface jet at a new station costs O(N), not O(1) (regression amplifier; est. 5 to 10 s)

**Where.** `AutoMovieLoftJet.ts:88, 191-227`. A station-cache miss runs `AutoMovieStationHermite.combine` (`AutoMovieStationHermite.ts:119`) over the whole row, three times (value, slope, curvature). That is 3 × 2N = 1,536 entries at N = 256, through `.map` closures that allocate three arrays of 512 doubles. The jet then reads only the 4 controls of one span (`AutoMovieSplineCurve.jet`).

**Who misses.** Every Newton iterate, foot, rail offset, ribbon, seed grid point and trace point moves the station, so the 8-entry exact-match cache (`RECENT`) misses almost always. At N = 256 a miss is about 20 to 25 µs against under 1 µs for the span's arithmetic. The same code allocates for every vector operation: `[...sub(), g]` residuals, 4 × 4 jacobian arrays and `Math.hypot(...r)`. That is GC pressure the modeler log already measured at 25 to 43 s on the old path.

**Lift.** `lift()` (`AutoMovieLoftJet.ts:248-292`) runs on every jet of a lifted chain, including every blend chain (order 64), whether the station hits or not. It allocates `zero` (`:259`), two ends, three combines and `[...x, ...x]` copies (`:281`).

**Standard.** The NURBS Book (Piegl and Tiller) A2.1 FindSpan, A3.5 SurfacePoint and A3.6 SurfaceDerivsAlg1 evaluate only the (p+1)(q+1) nonzero basis functions. That is O(pq) per point whatever the control count. `verb`'s `rationalSurfaceDerivatives` does the same.

**Fix.** On a miss, keep the interval, `u`, `H` and the three weight rows, not the combined rows. At a phase, combine only the 4 span indices j0..j3 of x and z: 3 orders × 8 values = 24 instead of 1,536. Cache the frame rows as now. Do the same in `lift()`, with the zero rows and `[...x, ...x]` hoisted out.

This cuts every kernel cost below (items 4, 6, 7 and the risk above) by a factor of 20 to 60 per jet.

### 3. The engine draws the whole body's skin, and the human side throws it away (regression; est. 3 to 8 s)

**Where.**

- `realizeAutoMovieConstruction.ts:237-247` runs `AutoMovieSolidBody.draw`, `AutoMovieConstructionSkin.close`, `publish` and `AutoMovieConstructionSkin.mesh`, which copies about 1.2M numbers.
- `:100` runs `AutoMovieLoftStations.bisect` (48-probe rings) per face only to give the draw its stations.
- `AutoMovieHumanBodyTree.realize` (`AutoMovieHumanBodyTree.ts:108-120`) reads only `chains`, `joins` and `diagnostics`.

**Then.** The shape stages draw the merged skin again in `AutoMovieHumanBodySurfaceSolids.draw` (`:95, 142, 161`) with the same `AutoMovieSolidMesh.face`. That second draw also puts every host rail on its seed's host face (`:104`), even where the rail crosses onto a blend face, so the engine's body is also the more correct of the two.

**Grid size.** The discarded grid is about 400,000 vertices: trunk 170 × 512, legs 2 × 230 × 256, arms 2 × 170 × 256, digits 20 × 80 × 64. Each vertex gets a full 2-jet plus item 4's classification.

**Fix.** Either:

- Give `realizeAutoMovieConstruction` a `draw: false` prop and skip `:100` and `:237-247` when it is set; or
- Publish `result.body` as `calibration.bodies` and the realized mesh, and drop the human side's merges redraw.

The second option removes one of the two draws for good and fixes the rail-face mismatch.

### 4. Trim classification is O(vertices × loops × loop length) (both draws; est. 2 to 6 s, half of it gone with item 3)

**Where.**

- `AutoMovieSolidMesh.ts:248-256`: every grid vertex runs `AutoMovieSolidMeshLoop.keeps` (`AutoMovieSolidMeshLoop.ts:35-52`) for every loop.
- `keeps` runs `AutoMovieSolidCycle.kept` (`AutoMovieSolidCycle.ts:71`), whose hole branch recomputes `centre(cycle)` at `:74` on every call. That is O(n) parity plus O(n) centre plus O(n) metric distance.
- On the trunk that comes to 87,000 vertices × 8 loops × about 200 steps = 140M iterations. Arms (6 loops each, with the palm's 5 digit holes) add about 100M.

**Same function.**

- `:250` builds three temporary arrays per vertex (`Math.min(...[...].filter().map())`).
- `:270-283` keeps cell edges as template strings in a `Set`, about 1.6M strings, and later splits them.
- `owner()` (`:152`) runs a `findIndex` by name for every trim vertex.

**Standard.** Uv-grid trimming, as in:

- Kumar and Manocha 1995, *Efficient rendering of trimmed NURBS surfaces*, *CAD* 27(7).
- Piegl and Tiller 1998, *Geometry-based triangulation of trimmed NURBS surfaces*, *CAD* 30(1).
- `BRepMesh`'s classifier with `Bnd_Box2d` and an `NCollection_CellFilter`.

Each trim is rasterized onto the grid once, so classification is O(grid + trim length), and distances are tested only for cells the trim passes near.

**Fix:**

- Per loop, take its chart box widened by the margin.
- For each station row, intersect the loop with the row once to get kept intervals, then mark phases by interval: O(nu × (n + nv)).
- Measure distance only inside the box.
- Compute the cycle centre once.
- Precompute `du` per station.
- Use numeric edge keys (`p * V + q`) or half-edge arrays.
- Look owners up in a map.

### 5. Each join solves the same curve and columns two or three times (regression; est. 2 to 5 s, more if item "risk" holds)

**Where:**

- **Two traces.** `realizeAutoMovieConstruction.ts:131-138` traces for the fold width, then `AutoMovieSolidBody.merge` (`AutoMovieSolidBody.ts:198-199`) builds a second atlas and `AutoMovieSolidJoin.create` traces again (`AutoMovieSolidJoin.ts:161`) with the same seed, limits and host.
- **Uncached columns.** `rail(t)` and `column(t)` (`AutoMovieSolidJoin.ts:176-185`) re-solve the curve point, both rails and both ribbons on every call. Nothing is memoized.
- **Columns at the traced points.** `AutoMovieSolidJoin.ts:196` solves 64.
- **Fold check.** `:215-231` solves 128 more, at t ± step, each with a fresh Newton curve point.
- **First repeat.** `AutoMovieSolidBlendChain.of` (`:102`) solves the same 64 columns again at the same t: `seed + 2πk/count` equals the traced points' t when count is 64.
- **Second repeat.** `AutoMovieHumanMergeEntry.of` solved them a third time. The working tree already has `MergeEntry.from(j.hostFace, j.partFace, j.blend, ...)`, uncommitted.
- **Widths.** `AutoMovieSolidBlendChain.ts:164-165` reads `join.widths` twice per column.

**Standard.** Choi and Ju 1989, *Constant-radius blending in surface modelling*, *CAD* 21(4), and kernel fillet builders compute the contact (rail) curves once at the sampled spine points, then store and fit them. They never re-solve them per query.

**Fix:**

- Let `AutoMovieSolidJoin.create` accept the traced curve (`IInput.curve`) and skip `trace` when it is given.
- Memoize `rail` and `column` by `t` in a `Map` for the join's life.
- Run the fold check on the 64 stored columns, using neighbours k ± 1 or the analytic `along` from the curve's `rate`, instead of 128 new solves.
- Commit the `MergeEntry.from` change.

These remove about 6,500 of the 10,000 jets per join.

### 6. The tape's level cut walks phases outside and stations inside (regression in the trunk build; est. 1 to 3 s)

**Where.** `AutoMovieHumanTrunkTape.ts:125-141`. For each of 512 phases it samples 65 stations, then refines with Illinois. Each jet therefore lands on a new station and misses item 2's cache.

The cut runs for 2 masses at each of 2 sites, about 43,000 O(N) misses per mass per site on order-128 chains. `perimeter` (`:86`) also rebuilds a 512-point section and sorts a hull of 512 points plus the cuts on every Illinois step (`:105`).

**Fix.** Swap the loops. Take the 65 rings once with `AutoMovieLoftChain.sampler` (one O(N) station read each, then O(1) per phase). Find the sign changes per phase on those rings and refine only the bracketing intervals with Illinois from the stored values.

### 7. Rail crossings are placed by 40 bisections of whole solves (regression; est. 0.5 to 2 s with crossings)

**Where.**

- `AutoMovieSolidClip.ts:55, 94-113`: each crossing of a host rail between two faces bisects `t` 40 times. Each step is a full `join.rail(t)`: a Newton curve point and three Newton rail solves, about 27 jets.
- `AutoMovieSolidRail.ts:100, 187`: bisects `host.kept` 40 times per offset that crosses a trim, for every column near a crossing.

**Standard.** Bracketed root finders converge superlinearly: Illinois (Dowell and Jarratt 1971, already `AutoMovieIllinois`) or Brent reach 2^-40 of the bracket in 6 to 10 evaluations. The crossing can also be solved directly as the root in `t` of the rail point's signed distance to the crossed cycle segment.

**Fix.** Use Illinois on that signed distance in both places: 42 solves per crossing become about 8.

### 8. Every view part is lofted twice, the trunk and masses three times (regression; est. 0.5 to 1.5 s)

**Where.**

- `AutoMovieHumanSiteViewPart.ts:168` lofts each part (`AutoMovieViewLoft.create`), and the lane keeps only `result.view`.
- `realizeAutoMovieConstruction.ts:80` lofts the same view again.
- `AutoMovieHumanTrunkBuild.ts:117, 122, 144, 152` lofts the base in pass 1 and pass 2. It builds and lofts all 4 masses in both passes; pass 1's masses feed only the tapes' `surface` and `stations`. The realization then lofts both a third time.

**Per-station cost.** A view loft does a lot at each station:

- `AutoMovieViewSection.bare` places 4 × 15 conic guides, each by 60 bisections with two `atan2` (`AutoMovieViewSection.ts:200, 436-447`).
- `fault` takes 388 readings.
- `length` takes 512 Gauss readings.
- N radius reads and `AutoMovieSplineCurve.interpolate`.

**Standard.** NURBS Book ch. 10, skinning: the sections are computed once and the surface is built once and shared.

**Fix:**

- Give `realizeAutoMovieConstruction` a loft cache keyed by view-node identity (a `WeakMap<IAutoMovieConstructionView, AutoMovieViewLoft.IResult>` in its props), or have the human side build only the view record where it does not read the loft.
- In the trunk build, build pass 1's masses without their view.
- Solve `turned` by Newton on its monotone angle in about 6 steps instead of 60 bisections.

### 9. Girth-owned sections bisect the shoulder range at 1e-6 mm (pre-existing in the operator; matters for girth parts, the head tree's parts first)

**Where.** `AutoMovieViewSection.range` (`:335-348`) makes about 31 bisections per edge, each a `bare` plus `fault`. `solve` then runs Illinois to `GIRTH_TOLERANCE` = 1e-6 mm (`:508`), each step a full `of` (bare, diagonals, quadrature). A girth station costs about 60 times a shoulder station. The body lane's parts own their shoulder at the sites, but the head tree's parts and any girth-owned part pay this at every station.

**Fix.** The girth is monotone in the shoulder over the valid range, so:

- Find the range's ends once per box at 1e-3 of the shoulder.
- Run Illinois on the girth to 1e-4 mm, warm-started from the neighbouring station's shoulder.

### 10. Blend faces are evaluated through the lifted O(N) path (regression; est. 0.3 to 1 s)

**Where.** `AutoMovieSolidBlendChain.ts`. Every blend is an order-64 chain with lift on both layers, so every jet on it (atlas traces that cross onto it, its rows in both draws, rails that run over it) takes `lift()`'s uncached O(N) path from item 2.

**Fix.** It goes with item 2's local-span evaluation of the lift.

### 11. Fixed fine sampling where the error bound allows coarse

**Where:**

- Digits are subdivided at a 1 mm gap (`AutoMovieHumanDigitInterim.ts:66`).
- Every limb and trunk part at 3.5 mm (`AutoMovieHumanSiteViewPart.subdivide`), whatever its curvature.
- Trunk sections at 256 controls with 512 samples.

Downstream per-vertex stages scale with the resulting grid; the modeler log measured the rig's `dress` at 66 s over 3.76M vertices. The kernel's own station choice for the draw is adaptive by chord (`AutoMovieLoftStations.bisect`), but every layer is a forced mark (`AutoMovieLoftStations.ts:33`), so it never drops below the layer count.

**Standard.** NURBS Book ch. 9 and 10 place stations and knots by an error bound, not a uniform pitch. `verb` and `BRepMesh` tessellate adaptively by chordal deviation and normal angle.

**Fix.** Layers where the outlines need them (the sites plus bisection by outline deviation), and draw stations by chord alone.

### 12. Smaller items

- **Curved axes re-march from the first knot for every station.** `AutoMovieViewAxis.minimal` (`:395-439`) makes `|s - s0| / step` double reflections, each with 4 natural-spline readings, which themselves scan their knots linearly. That is O(S² · K) per loft at a 1 mm step. It is used by the head tree's curved axes (debug path today). Wang, Jüttler, Zheng and Liu 2008 (double reflection) march once over the sorted stations: O(S).
- **Rollback state is copied three times per join.**
  - `AutoMovieConstructionState.snap` copies every face's cycles (`realizeAutoMovieConstruction.ts:112`).
  - `AutoMovieSolidBody.atlas` copies them again (`AutoMovieSolidBody.ts:146`), twice per join (`realizeAutoMovieConstruction.ts:123`, `AutoMovieSolidBody.ts:198`).
  - `AutoMovieSolidBody.merge` copies them a third time for its own rollback (`:185`).

  This is cheap now (a few thousand points), but it grows with the tree. One snapshot can serve the realization's rollback and the merge's.
- **Seed search resets to a grid.** `AutoMovieConstructionSeeds.create` falls back to a 17 × 32 grid of jets (`:30, 92`) whenever a step's foot from the previous guess fails, and it can call the grid twice in one step. Warm-start from the last good foot and fall back to the grid at most once per seed (NURBS Book §6.1: a coarse start once, then Newton).

## What to measure to rank these with numbers

1. The risk counters above, per join.
2. Wall time of `realizeAutoMovieConstruction` split into lofts, joins (seed, trace #1, merge, BlendChain, clip) and the draw tail (`:237-247`).
3. Wall time of `AutoMovieHumanTrunkBuild.create` (passes, tape cut) and of the old body (`calibrate` up to `today`).
4. Station-cache hit rate in `AutoMovieLoftJet.stationOf`, by chain order.
5. Time in `AutoMovieSolidMesh.face` classification (`:248-256`) for both draws.

`debug/pieces/HumanDebugPieceTiming.ts` already times `calibrate`, `surface`, `skinChart` and `rig` per person. Splitting `calibrate` there by the stages above answers 2 and 3.
