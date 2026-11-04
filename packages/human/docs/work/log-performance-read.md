# Performance read of the body's construction tree

Written 2026-11-04 by reading the code only; nothing was run. It covers the path one f1 whole figure takes since the body lane became one construction tree on the engine (6c95c21b6). The figure went from 400 to 450 s up to about 600 s. Every cost below is an estimate from the code, there to be confirmed or refuted by measurement, and it names the standard technique the code departs from.

## Measured outcome

The performance investigator checked this list against a profile (`log-performance.md`):

- f1 `prepare` took 1,015 s.
- The whole body tree (lofts, traces, merges, draw) was 10.0 s of `calibrate`'s 38.3 s. This refutes the Newton-cascade risk below and agrees with the steady-state estimate.
- The regression was the eyebrow's `AutoMovieHumanBrowProjector`, outside this read's path. For each head chain a hair point missed, it re-seeded a 1 mm × 256 grid of whole-section points: 594 s sampled. It is fixed in 530376915; the next run took 349 s on a loaded machine.
- Item 2 was confirmed in the single-point reader path: `sampler`, `hermite` and `combine` took 63, 44 and 29 s in total. `AutoMovieLoftChain.point` is now lazy per control.
- Item 5's repeated solves landed in 6d877c342, and the `MergeEntry.from` switch in 530376915.
- Items 3, 4 and 8 are queued.

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

# The rest of `prepare`, read the same way

Read on 2026-11-04 after the investigator's profile (`log-performance.md`). Run 2 of f1 `prepare`, taken after 530376915 on a loaded machine, took 349 s:

| Stage | Time |
| --- | --- |
| calibrate | 81 s |
| surface | 55 s |
| skin dressing | 48 s |
| appearance | 136 s, of which 87 s is the brow |
| binding | 21 s |

Run 1 spent 279 s of 1,023 s sampled in garbage collection, and the head's skin is 1.4M vertices and 2.26M triangles.

What I read for this part: appearance (brows, lashes, hair stage and its fields, skin chart, tone, marks, images), binding and the rig, surface normals and aperture refinement, the viewer's subject and capture path, and the PNG encoder.

What is not here:

- Garments: erased from generation (`modeler-log.md`, triangle survey row 1).
- Nails: now on their digit chains, not read in depth.
- Eyeball, conjunctiva and the eye images: read for loop size only; nothing large.
- Items the investigator already lists are cited by their P, K or V number rather than repeated.

Ranked by expected saving per f1 figure.

### A1. The brow's remaining 87 s: every hair point is solved on every head chain by finite-difference Newton

**Where.** `appearance/AutoMovieHumanBrowProjector.ts`. Each brow places up to 1,100 hairs (`AutoMovieHumanEyebrow.ts:36, 108`), each hair 6 points, and each point calls `project`. `project` runs `solve` on every head chain, the neck chain `head` included (`:64`):

- up to 30 iterations (`:84`);
- each iteration takes 3 whole `AutoMovieLoftChain.point` reads, because the Jacobian is a finite difference (`:90`) that only converges linearly near the 1e-4 mm stop;
- the depth check takes another read (`place(s, t + π)`), and the normal 3 more.

A chain that misses drops its warm start, so its next point re-seeds by a linear scan of that chain's whole 1 mm × 256 grid (`:146`, about 60,000 nodes). `solve` also rebuilds and spreads the layer list on every call (`:78`).

**Cost.** About 13,000 points per brow × 4 chains × up to 95 reads, plus grid scans: the 87 s, mostly `sampler` and `hermite` (P7).

**Standard.**

- **Point inversion.** The NURBS Book §6.1 runs Newton on the exact first derivatives (`AutoMovieLoftJet.at`), which converges quadratically in 3 or 4 steps, after one coarse start.
- **Seeding.** A coarse start comes from a bucketed grid, not a linear scan.
- **Culling.** A query is tried only on the surfaces whose bounding box in the query plane contains it.

**Fix:**

- Compute each chain's bounding box in face-plane `(a, h)` once from its seed grid and skip chains that cannot hold `(a, h)`. The neck never qualifies.
- Bucket the grid by `(a, h)` for an O(1) seed.
- Solve with the analytic jet.
- Hoist `ys` and its range per chain.
- Better still, tabulate the brow patch (about 60 by 25 mm) once at 0.25 mm as an `(a, h) → (chain, s, t)` map, so each point is one lookup plus one or two Newton steps.

**Expected saving.** 70 to 85 s.

### A2. The head's 1.4M-vertex skin: whole rings refined at 0.5 mm near every opening (P5's mechanism, with the standard)

**Where.** `generation/AutoMovieHumanBodyApertures.ts:35` (`SPACING` 0.5 mm) and `:38` (`REACH` 2 mm). `refine` and `split` (`:141-200`), called from `AutoMovieHumanBodySurfaceLoft.ts:45`, split every station interval whose end or middle ring passes within 2 mm of an opening into 0.5 mm steps. Each new station is a full ring at the chain's own samples, all phases round the head, though an opening covers a small phase window: an eye about 30 mm of a roughly 560 mm girth. The face's openings cover most of the head's height (lids, nostrils, mouth, ears), so most head rings are refined.

**Cost.** This one mechanism drives:

- the surface stage (55 s), the split, and the skin dressing (48 s: chart, tone, marks);
- the binding (21 s, over 2.9M vertices);
- the head and shoulder fields (A4, A5), the normals (A6) and much of the 279 s of garbage collection;
- the viewer's posing and its frame.

**Standard.** Adaptive tessellation refines only where the chordal deviation or a trim curve requires it, in a restricted quadtree, so the refinement stays local in both parameters:

- Piegl and Tiller 1998, *Geometry-based triangulation of trimmed NURBS surfaces*, *CAD* 30(1).
- Kumar and Manocha 1995, *CAD* 27(7).
- OpenCASCADE `BRepMesh` (deflection-driven, with the trim polygons as constraints).

**Fix.** Refine the station interval only in the phase window the opening's chart box covers, widened by `REACH`. That means a local subgrid there, joined to the coarse ring by a zipped band of triangles, as `AutoMovieSolidMesh.face` already does for its trims. Elsewhere the ring stays at its chain's own sampling.

**Expected saving.** The head back to about this morning's density (the whole skin was 690,000 vertices) would roughly halve the surface, dressing and binding stages: about 40 to 60 s, plus garbage collection.

### A3. Garbage collection (279 s of 1,023 s in run 1): mesh attributes in `number[]` and allocation per element

**Where.** A sweep of the per-vertex and per-triangle hot loops:

- `appearance/AutoMovieHumanSkin.ts:171`: per triangle, `indices.slice(t, t + 3)`, then `every`, then `push(...tri)`, over about 4.5M triangles.
- `AutoMovieHumanSkinChart.ts:205-213`: four full spread copies (`[...piece.positions]` and the like), then a `corners`, `us` and `map` array plus `Math.max(...)` spreads per triangle.
- `AutoMovieHumanSkinChartGrid.ts:119`: four `[node, weight]` tuples per `at` call, one call per vertex.
- `AutoMovieHumanSkinTone.ts:177-182`: `V.at` vectors, plus `color.push(...table.lookup().map())` per vertex.
- `skeleton/AutoMovieHumanRig.ts:188-189`: `number[]` bone indices and weights for 2.9M vertices.
- `AutoMovieHumanSkin.ts`: `positions.map` and `uvs.map` copies per part; a piece with a cavity copies them twice.

**Standard.** Structure-of-arrays buffers with fixed element types (`Float32Array` for positions, normals, uvs, colours and weights; `Uint16Array` or `Uint8Array` for bone indices; `Uint32Array` for indices), written in place with scalar arithmetic, as every engine's mesh path does (three.js `BufferAttribute`, glTF accessors).

**Fix.** Typed buffers end to end from the tessellation to the model part, and scalar loops at these sites.

**Expected saving.** A large share of the garbage-collection time: 10 to 40 s, before A2 shrinks the counts.

### A4. The head field casts 8,192 rays against a soup of all 2.26M head triangles built as `number[]`

**Where.** `appearance/AutoMovieHumanHeadField.ts`:

- `collect` (`:216-226`) copies every head triangle corner into one `number[]` (about 20M numbers), one `push` at a time, de-indexing shared vertices.
- `cast` (`:245`) then makes three `atan2`, one `hypot`, an array, a sort (`:266`) and a gaps array per triangle, and pushes each triangle into every bin it may cover.

**Standard.**

- Compute the angles once per vertex, not per triangle corner (about 6 times fewer).
- Read the index buffer in place.
- Use typed arrays.
- Or derive the radial depth map from the head chains themselves. The modeler log's triangle survey, row 11, already names the lofted chains as the owner.

**Expected saving.** 2 to 6 s, more while A2 stands.

### A5. The shoulder field walks every skin triangle of the whole body with an array per triangle

**Where.** `appearance/AutoMovieHumanShoulderField.ts:72-81`: every `human.skin.*` part, every triangle, a fresh 9-number array (`:80`), and only then the height cull. The field covers a 360 by 520 mm box from 600 mm under the head's top down to the menton.

**Standard.** Cull whole parts first by bounding box, then scan-convert triangles into the height grid (a z-buffer) with no per-triangle allocation.

**Expected saving.** 1 to 4 s.

### A6. The ring-blend normals copy the whole normal array 16 times and key a cache by string

**Where.** `generation/AutoMovieHumanBodySurfaceNormals.ts`:

- `:182`: each of `PASSES` = 16 passes copies the entire normal array (`[...current]`, about 8.7M numbers) to update the band vertices.
- `:153-154`: per vertex, `Math.min(...rings.map())`.
- `:53`: per vertex, a string key `index:s` for the station cache.
- `surfaceNormals` copies the whole mesh first (`[...mesh]`).

**Standard.** Jacobi smoothing over a vertex subset updates two scratch buffers sized to the subset. The station cache is keyed by `(chain, station)` numerically, or replaced by row-order traversal, which already hits.

**Expected saving.** 1 to 3 s.

### A7. Skin tone: four noise octaves and allocation per vertex over 2.9M vertices

**Where.** `appearance/AutoMovieHumanSkinTone.ts:163-185`: `regional` (chain-gated, fine), then `mottle` with four `value3` octaves, and `push(...map)`. `AutoMovieHumanFaceTone.apply` adds its own fields per head vertex.

**Standard.** Shading that varies on 16 to 40 mm wavelengths is evaluated on the chart grid (`AutoMovieHumanSkinChartGrid`, 2 mm) or baked into a texture and read per vertex, not recomputed per vertex.

**Fix.** Evaluate the mottle at the chart grid's nodes once per chain and interpolate per vertex. Write the colours into a `Float32Array`.

**Expected saving.** 2 to 5 s while A2 stands.

### A8. Binding: the strongest-four scan reads every bone per vertex, and the construction curves are bound only to be unbound by the viewer

**Where:**

- `skeleton/AutoMovieHumanBindingQuantize.ts:24`: `strongest` scans all bones (about 65) per vertex, where at most 16 slots were touched (`AutoMovieHumanBindingLoft.create`'s `touched`).
- `AutoMovieHumanShapeStages.ts:222-231`: every construction curve becomes a tube mesh part with loft coordinates. `AutoMovieHumanRig.dress` (`:227`) binds those thousands of parts per vertex.
- The viewer then drops every skin and rebuilds each curve's polyline from its tube's vertices (`debug/page/loadHumanDebugSubject.ts:110`, `HumanDebugTubeCentreline`).

**Standard.** Partial selection over the touched set. A curve is carried as its polyline, bound per point if needed, and tubed only at draw time.

**Fix:**

- Pass `touched` to `strongest`.
- Publish the construction curves as polylines (`curve.coordinates` already holds their loft coordinates) and tube them in the viewer.

**Expected saving.** 2 to 5 s in binding and in the page.

### A9. Skin marks: a 2048² `Float64Array` and one full triangle pass per kind with arrays per triangle

**Where.** `appearance/AutoMovieHumanSkinMarks.ts:100` allocates `N * N * 3` doubles (about 100 MB). `eachTriangle` (`:105, 111`, and `:348` builds `ids`, `p` and `uv` arrays per triangle) runs over all triangles once for the area and once per requested kind. The 12.6 MB image is then written as a stored, uncompressed PNG (`engine/src/render/encodeAutoMoviePng.ts`, zlib stored blocks) and base64'd into a string of about 17 MB that the page decodes again.

**Standard.**

- A `Float32Array`, or an 8-bit multiplier where the marks' dynamic range allows.
- One triangle pass that serves all kinds.
- Deflate-compressed PNG (`zlib.deflateSync` in Node, `CompressionStream` in the browser), or raw typed-array textures in memory without base64.

**Expected saving.** 1 to 3 s when marks are requested, plus memory.

### A10. The viewer: generation on the page's main thread, CPU posing, base64 images

**Where:**

- V1 and V2 in the investigator's log.
- `debug/page/loadHumanDebugSubject.ts:85` runs `AutoMovieHuman.prepare` on the page's main thread, which is what stalls it (`modeler-log.md`). `:91` poses every part on the CPU (`HumanDebugPose.apply`) for each posed frame.
- Textures arrive as base64 PNG strings (A9).

**Standard.**

- Generation in a Web Worker, with the meshes returned as transferable typed arrays.
- Posing by GPU skinning, which the model already carries (`IAutoMovieMeshSkin`, `method: BLEND`).
- Textures as typed arrays.

**Expected saving.** No change to `prepare` itself, but a viewer that keeps responding and frames that do not re-pose on the CPU.

### A11. The legacy body and the head construction inside calibrate (calibrate was 38 s in run 1)

**Legacy body.** Item 1 of the first list: the old limbs, the reconcile and the hand meshes, built for the interim and the rig.

**Head construction.** It took 11.4 s in run 1. It still solves each head section as an implicit field root-solved along rays (`modeler-log.md`, triangle survey row 9). The standard, which the survey names as the head's owner, is section curves through the landmarks and courses, evaluated directly.

**Expected saving.** Together, most of calibrate's non-lane time (about 25 s of 38 s), subject to the owner's call on retiring `legacy`.

### A12. Smaller items seen on the way

- **Hair cache key.** `AutoMovieHumanHairStage` checks its chart cache with `same()`, which compares every position and index of every head skin part (`:173-193`). That is O(V) per call. A content hash computed once with the mesh would do.
- **Skin chart grid.** `AutoMovieHumanSkinChartGrid.locate` seeds by scanning every fourth node and then runs 8 finite-difference Newton steps of 3 `point` reads each. It is used only for vertices without loft coordinates (pole apexes), so it is cheap now.
- **Normals cache.** `AutoMovieHumanBodySurfaceNormals.surfaceNormals` reads `AutoMovieLoftJet.at` per vertex in mesh order, so the station cache hits. It stays cheap once K7 keeps the lift with the station.

## The combined list for the measuring worker

The first part's items 1 to 12 and this part's A1 to A12 are disjoint. In expected saving after the investigator's P1 to P4 and K2 to K3:

1. A1, the brow: 70 to 85 s.
2. A2/P5, local refinement at openings: 40 to 60 s plus garbage collection.
3. A3, typed buffers: 10 to 40 s.
4. P2, poles `cells` (30.6 s; the investigator's), with the same standard as item 4 of the first part (scanline intervals and per-loop data read once).
5. A11 and item 1, the legacy body and the head sections: about 25 s.
6. A4, the head field: 2 to 6 s.
7. A7, the tone: 2 to 5 s.
8. A8, binding and curves: 2 to 5 s.
9. Item 2 and P7, local-span evaluation in `stationOf`: 5 to 10 s inside the realization and the tape.
10. A5, the shoulder field: 1 to 4 s.
11. A6, the normals: 1 to 3 s.
12. A9, the marks: 1 to 3 s.
13. Items 3, 4 and 8 of the first part, already queued.
14. A10, the viewer.
