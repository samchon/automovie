# Performance investigator log

Owner, 2026-11-04 evening: one f1 whole figure takes 400 to 600 s in the shared viewer and stalls it; find where generation stalls, fix it with behaviour unchanged, and sweep the generation and kernel code for inefficient implementations. Times are `date` readings on this machine.

## State at the stop (written 21:46, `date`; the campaign moves to #3062)

- f1 `prepare` 167.5 s (run 5, 21:20:55, `test_human_prepare_profile`), under the morning's 178 s: calibrate 142.2 s (85 percent, since the head is realized from its construction tree, `e7f7ef0dd`), surface 11.2 s, skin dressing 4.2 s, binding 4.7 s, appearance 1.2 s (the texture brow, `8e7a16e91`). Run 5 painted no brow: the realized head carries no openings, so no lid and no brow image.
- Landed after 21:06: `8783ad8b1` (K5 trunk solved once, ring blend without per-pass copies, tone pushed per vertex, binding's touched slots). The lazy `AutoMovieLoftJet.stationOf` was reverted unrun (its test `test_construction_operator_loft_jet` was cancelled).
- Blank figure under the default (appearance) shading since 19:16 while `shade=normals` draws it: not caused by the brow change (it predates `8e7a16e91`). The appearance shade clones each part's own single-sided material, normals and clay shading are double-sided, so inverted winding is the lead suspect, matching the head modeler's nose seen only from inside (`.shots/head/nose1/merge-three.png`) on a level axis; `AutoMovieSolidChain.surface`'s orientation sign (outward test and the extra flip for a `mirrored` chain) and `AutoMovieSolidMesh.face`'s emit sign are where a face's winding is decided. `test/src/features/human/test_human_skin_attributes.ts` (non-finite or short skin attributes, indices, overlay transforms) could not finish at 21:42: generation threw in the rig (`Stickman skeleton needs the head.mass chain`, `AutoMovieHumanJointCentres`). The head modeler's `test_construction_level_winding` (`2bda6b075`) was not run.
- Backlog for #3062: calibrate's 142 s (the tree head's realization, then A11 the legacy body's unread parts), the lazy `stationOf` (b), trim classification (a), A2/P5, A3 typed arrays, A4 to A9, V1, A10.

## State at hand-over (written 21:06, `date`)

f1 `prepare` (`test_human_prepare_profile`): 1,015 s at 19:39 (run 1, `41fb1e15d`), 349 s at 20:08 (run 2, after `530376915`), 293 s at 20:39 (run 3, after the lazy station read, on a machine loaded by other workers' runs that took unchanged stages about 2.5 times their run-1 CPU). Run 3 still built the strand brow; its seed grid was 39 s of the 85.8 s appearance stage. Run 4 (21:00, after `8e7a16e91` and `8feef93e7`) failed in the test's own `eye(side)` at the appearance stage: the calibration no longer carries one of the eyes, a head change outside this work. Skin dressing, where the texture brow is painted, ran without error before it, so run 4 has no stage table. The next measurement needs `test_human_prepare_profile`'s `eye` to tolerate a missing eye, as `AutoMovieHuman` does.

Landed (identical output unless noted; pushed): `530376915` (P1 to P4: brow seed grid read once, root loop caches, binding row sampler, realized blends published), `c70e4d941` (P7: `AutoMovieLoftChain.point` combines a new station's controls lazily, proven by `test_construction_operator_loft_point`; binding quantize, capsule height and vermilion weight without allocation or needless hypot; the profile's per-stage table), `8e7a16e91` (owner order: brows painted into the skin's texture, the projector path deleted; changes the brow's look by design), `8feef93e7` (aperture seed grid read once; tape cut station by station). The core worker landed K2 and K3 (`6d877c342`).

Backlog, in the supervisor's order (A items: `log-performance-read.md`):

1. A11: build only the legacy body's parts something reads (body modeler; `AutoMovieHumanBodyLaw.ts` was open); K5, the trunk solved twice.
2. A2 / P5: refine only near each opening (`AutoMovieHumanBodyApertures` `refine`/`split`, full head rings at 0.5 mm); the head is 1.4 M vertices.
3. A3: typed arrays end to end through skin, chart, tone and rig (garbage collection 49 to 279 s sampled).
4. Kernel, given to this worker by the core worker and not done: (a) trim classification (`AutoMovieSolidMeshLoop.keeps`, `AutoMovieSolidMesh.face`, `AutoMovieSolidCycle.kept`, 6 to 12 s); (b) `AutoMovieLoftJet.stationOf` combining controls lazily as `point` does (13 s of Hermite rows in calibrate); a draft was reverted unverified at 21:04. (c) `AutoMovieViewSection.turned`: its 2^-60 bisection must stay bit-exact, so it stays. K1 and K4 remain with the core worker.
5. A4 to A9: head field casts, shoulder field, normals' array copies, tone noise per vertex, binding's bone scan and construction tubes, marks image size; `AutoMovieHumanVermilion.weight` still 3.5 s (a segment index would make it local).
6. V1 (viewer: compare the source hash before generating, so a save during module load does not cost a whole generation) needs the supervisor, since editing `debug/server` restarts the viewer; A10 goes to #3062.
7. The texture brow is not yet seen in the viewer: one frame of f1's face is owed before any visual claim.

## Measurement 1: f1 `AutoMovieHuman.prepare` by stage (run 19:39:14 to 19:57:39)

`pnpm test --include human_prepare_profile` (`test/src/features/human/performance/test_human_prepare_profile.ts`), f1, source at `41fb1e15d` plus the workers' saves loaded at 19:39, under the sampling profiler with other workers' test runs on the machine. This morning's run (`packages/human/.shots/profile/20261104-1056/f1.txt`, 10:56) is the baseline.

| Stage | Morning ms | Now ms | Change |
| --- | --- | --- | --- |
| body law (calibrate) | 49,069 | 38,268 | -10.8 s (head 24.7 s to 11.4 s) |
| surface (loft, seams, apertures) | 13,339 | 58,055 | +44.7 s |
| skin split | 286 | 742 | |
| construction curves | 1,158 | 1,170 | |
| mouth interior | 3,459 | 161 | rim pass deleted |
| construction parts | 865 | 535 | |
| rig | 776 | 676 | |
| skin dressing | 19,661 | 28,412 | +8.8 s |
| appearance | 22,841 | 865,697 | +842.9 s |
| binding (rig dress) | 66,381 | 21,659 | -44.7 s (binding on loft coordinates) |
| pose evaluator | 19 | 24 | |
| total | 177,852 | 1,015,399 | x5.7 |

Garbage collection is 278.8 s of the 1,022.7 s sampled. The bound meshes hold 2,937,124 per-vertex bound vertices; `human.skin.head` alone is 1,404,910 vertices and 2,257,186 triangles in 478 parts (this morning's whole tessellated skin was 689,793 vertices).

## Measurement 2: after `530376915` (run 20:08:48 to 20:17:00)

The same test on the source with `530376915` (P1 to P4) and the workers' saves to 20:08, the machine loaded by other workers' runs (stages whose code did not change took about 2.5 times their run-1 CPU time: construction curves 1.1 s to 3.0 s, rig 0.66 s to 1.27 s).

| Stage | Run 1 ms | Run 2 ms |
| --- | --- | --- |
| body law (calibrate) | 38,268 | 81,005 |
| surface | 58,055 | 55,140 |
| skin dressing | 28,412 | 48,425 |
| appearance | 865,697 | 135,565 |
| binding | 21,659 | 20,606 |
| total | 1,015,399 | 348,933 |

The eyebrow fell from 594 s to 87 s sampled. What is left of it is the grid built once per chain and per brow (42 s), and `solve`'s Newton steps: every iteration reads two new stations, each a whole section sampler (`AutoMovieLoftChain.sampler` 63 s total, its Hermite rows 44 s), on all four head chains, including the neck chain `head`, which never holds a brow point and runs all 30 iterations. The same sampler builds carry `AutoMovieHumanSkinChartGrid.locate` (4 s) and `AutoMovieHumanApertureSpan.solve` (1.5 s). Hence P6 and P7 below.

## The code reader's list (`log-performance-read.md`, `340496c62`) against the measurements

The reader suspected that Newton retry cascades in the traces and rails (tolerance 1e-6 mm) carry a regression of 150 to 200 s. Run 1 refutes that: the body lane (`AutoMovieHumanBodyLane.create`, the whole tree's lofts, traces, merges and draw) was 10.0 s of 38.3 s calibrate; `AutoMovieSolidMesh` 1.6 s and `AutoMovieSolidMeshLoop` 1.3 s self. The regression was the eyebrow (P1). The reader's items 2 (local controls for a new station's jet), 3 (K1), 4 (K6), 5 (K2, K3), 8 (K4) and the twice-solved trunk (K5) stand as listed; K2 and K3 landed in `6d877c342` (core worker).

## Findings

| # | Stage | Time | Cause (file:line) | Fix | Owner | Expected saving |
| --- | --- | --- | --- | --- | --- | --- |
| P1 | appearance, eyebrow | 594 s sampled (535 s in `seed`), most of the 866 s stage with its garbage | `appearance/AutoMovieHumanBrowProjector.ts` `seed`: a grid of every millimetre of station by 256 phases, each a whole `AutoMovieLoftChain.point` (a new section sampler per station), repeated whenever `solve` misses a chain, and a chain that never holds a brow point (the neck chain `head`) misses on every hair point, so the grid is evaluated again for each of the strands' points | each chain's grid places read once per projector and scanned from a typed array; the same arithmetic and order, so the same seed bit for bit | investigator (no worker edits the file) | about 590 s |
| P2 | surface | 30.6 s self in `cells` | `generation/AutoMovieHumanBodySurfacePoles.ts:279` `cells` tests every corner of every band cell against each root loop: `AutoMovieHumanBodyRoots.inside` recomputes the loop's mean phase and walks every edge, `AutoMovieHumanBodyRoots.station` (for `beyond`) maps and sorts the whole loop per call | per loop, the mean phase and station range read once (a station outside the range crosses no edge, so the answer is unchanged) and the phase-ordered samples sorted once | investigator (no worker edits the file) | most of 30 s |
| P3 | binding | part of 21.7 s | `skeleton/AutoMovieHumanBindingLoft.ts` `fill`: `AutoMovieLoftChain.ring(chain, s, [phase])` builds a whole section sampler for each grid node | one sampler per grid row, shared by its nodes | investigator | a few seconds |
| P4 | body law, lane | the join count times 64 rail columns | `generation/AutoMovieHumanBodyTree.ts` `realize` rebuilt every join's blend chain (`AutoMovieHumanMergeEntry.of` calls `AutoMovieSolidBlendChain.of`, 64 rail solves) that `AutoMovieSolidBody.merge` had already built and the realization returns as `IJoin.blend` | publish the returned blend (`AutoMovieHumanMergeEntry.from`) | investigator (file not being edited) | one blend solve per join |
| P5 | surface and everything after | 1.4 M head skin vertices | the head's tessellation is twice this morning's whole body; it drives the surface stage, the split, the binding of 2.9 M vertices, the viewer's posing and its frame. The head modeler's reading (20:05): `generation/AutoMovieHumanBodyApertures.ts` `refine` and `split` (about lines 143 to 195) split every station interval whose rings come within `REACH` 2 mm of an opening's outline into `SPACING` 0.5 mm steps, each a full ring of the head chain; the mouth, both fissures and both nostrils (10 to 30 mm of height each) add about 200 full head rings, and since the trims of `e04547fa5` and `20eeb3500` every opening takes this path without the older thickness cap | refine only the band's cells near the outline (local refinement), or tie the ring spacing to the chain's sample spacing; the construction-tree head (`AutoMovieHumanHeadTree`) that replaces this path has no ring refinement | head modeler, scheduled by the supervisor | to count: the head chain's stations before and after `refine` |
| P6 | appearance, eyebrow | 42 s of run 2 | the brow projector's seed grid was built per projector, so twice (left and right brow) on the same chains | the chain's grid points kept per chain (`SURFACES`), each projector's places derived from them by the same arithmetic | investigator | half of the grid |
| P7 | every single-point Newton reader | `sampler` 63 s, `hermite` 44 s, `combine` 29 s total in run 2 | `engine/.../AutoMovieLoftChain.ts` `point`: a station not among the last eight builds a whole `sampler`, combining the full 2N section row, the lift row and the frame, to read four controls | on a miss, a lazy station: the same bracket, weights, frame and normal, each control combined with the same per-entry expression only when a phase reads it; harmonic chains keep the sampler. Proven equal by `test_construction_operator_loft_point` (`Object.is` against the sampler) | investigator (file not being edited; core worker told) | most of 63 s |
| V1 | viewer | one whole generation per mid-load save | `debug/server/HumanDebugCaptureSession.ts` `load` compares the page's source hash with the hash before navigation only after `ready`, which resolves after the whole generation; a save between navigation and the page's hash read therefore costs a full generation before the retry starts | the page compares the hash it reads with the expected one (passed in the navigation) before generating and fails at once with `Human source changed` | supervisor's decision (editing `debug/server` restarts the viewer) | one generation per collision |
| V2 | viewer | one generation per frame after any save | the page caches the prepared person per page load (`loadHumanDebugSubject` `PREPARED`), and a frame on a new source hash loads a new page; with three workers saving, almost every frame regenerates | frames of one series pass `keep=1` (README) so they share one generation | workers' habit | one generation per extra frame |

## Sweep (kernel and generation, read 19:40 to 20:02)

| # | Where | What | Status |
| --- | --- | --- | --- |
| K1 | `engine/.../realizeAutoMovieConstruction.ts:230-246` | the realization draws, closes, publishes and meshes the whole body (`AutoMovieSolidBody.draw`, `AutoMovieConstructionSkin.close`, `publish`, `mesh`), and the body lane (`AutoMovieHumanBodyTree.realize`) reads only `chains` and `joins`; `AutoMovieHumanBodySurfaceSolids.draw` tessellates the same faces again | queued to the core worker |
| K2 | `engine/.../realizeAutoMovieConstruction.ts:120-128` with `AutoMovieSolidJoin.create` | a join whose width law reads the traced curve (`fold`, every body join) traces the intersection, then `AutoMovieSolidBody.merge` traces it again from the same seed | landed in `6d877c342` (core worker) |
| K3 | `engine/.../AutoMovieSolidJoin.ts` `column`, `rail` | not memoized: `create` solves each traced point's column, `AutoMovieSolidBlendChain.of` solves the same parameters again (`seed + 2 pi k / count` equals the traced points' `t0 + turn i / count`), and `AutoMovieSolidClip.rail` again at the columns | landed in `6d877c342` (core worker) |
| K4 | `human/.../limb/AutoMovieHumanSiteViewPart.ts:168` with `realizeAutoMovieConstruction` `view` | every view part is lofted in the human package (to hand masses their host surface and to report) and again by the realization from its tree node | queued to the body modeler and the core worker |
| K5 | `human/.../AutoMovieHumanBodyLaneInterim.ts:87` | `AutoMovieHumanTrunkSolver.solve` runs again on the same inputs `AutoMovieHumanTrunkConstruction.apply` solved (6.2 s total in the solver) | queued to the body modeler |
| K6 | `engine/.../AutoMovieSolidMesh.ts` `face` | per grid vertex `Math.min(...[..].filter().map())` and string edge keys | low |
| K7 | `engine/.../AutoMovieLoftJet.ts` `lift` | the lift's Hermite combination and a fresh doubled array per jet, not kept with the station | low |
