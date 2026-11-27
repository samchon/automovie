# The armscye as a shared-loop join

What f1's trunk and arm sources are at the shoulder, measured against every premise the shared-loop join admits on, and the order of work that follows. [Joint logic](joint-logic.md) gives the joint's anatomy and kind; this note holds the numbers.

Measured 2026-11-17 by `test/src/reference-conics/FamilyConicArmscyeJoin.ts` on the two complete native sources (reliefs included, no loft and no mesh). From `test/`: `pnpm conic:build`, then `node .shots/esbuild/FamilyConicArmscyeJoin.cjs`.

## Today's construction

The trunk's sections are clipped at the sagittal plane 151 mm from the median plane. The arm's course leaves through two thorax datums square to that plane; its first knot stands at station 32 (z = 153) and its rail at 42. A port band spans from a recorded loop on the trunk's chart (a centre, two semi-axes and one share per clock) to the arm's rail, and a cutter family digs the slit under the arm out of the band.

For a person the recorded loop is re-levelled per clock in the arm's caliper frame at station 42 (`AutoMovieHumanF1NativeRootLevel`). f1's frame is bit-identical to the recorded basis, so f1 never runs that solve. A person whose arm frame tilts by 0.07 degrees (an upper arm 0.9 times as long) is refused under the arm, where the level is not monotone along the control's ray: recorded level 0.25538, 0.25671 in the tilted frame, 0.26078 at the loop's centre. The refusal is one-sided: the same tilt of the other sign (an upper arm 1.1 times as long) is solved.

| Length case | 0.9 | 1.1 |
| --- | --- | --- |
| Upper arm | refused, column 95 | admitted |
| Forearm | admitted | refused, column 95 |
| Hand length | refused, column 96 | admitted |
| Hand breadth | admitted | refused, column 96 |
| Phalanges | admitted | admitted |
| Every limb length | refused, column 95 | admitted |

## The two fields at the loop

In the arm's first section plane (z = 153, leaning 1.4 degrees from sagittal):

| Arc | Trunk stations or arm phases | Reading |
| --- | --- | --- |
| Upper arc: anterior fold, cap, posterior fold | trunk stations 530 to 620, front and back | The trunk's skin cut by the plane and the arm's section stand 0.1 to 1.0 mm apart, the trunk outside, their normals turned 1 to 10 degrees. One line, drawn twice. |
| The same arc, round the arm's first ring | arm phases 190 to 350 degrees | The ring stands 0.02 to 1.7 mm from the trunk's skin and changes side seven times, at 1.6 to 4.8 degrees. A trace has no transversal contact to follow. |
| Fold feet | arm phases 10 to 40 and 170 to 180 degrees | The arm's wall leaves the trunk's solid 1.2 to 3.8 mm past its first station, at 23 to 70 degrees. |
| Under the arm | arm phases 50 to 160 degrees | The arm's first ring stands outside the trunk's solid by 2.1 to 8.6 mm: at that ring the walls do not meet, and they do a few millimetres inward of it (below). The plane's cut of the trunk runs inside the arm's tube there (radius 1 to 12 mm about the arm's course against the arm's 39 to 41). |

Farther out the upper arc opens: at z = 158 the gap reaches 2.7 mm at the cap, at z = 163 it reaches 4.4 mm.

The arm's chart origin at its root stands at the armpit's height (y = 1299.9 mm): the section reaches 100 mm up to the shoulder's top and 40 mm down, so the root sections are charted from their lower edge.

### Carried inward, the two walls meet all round

The first ring is not where the walls meet under the arm. With the arm's face carried 22 mm inward of its first knot along its fields' end tangents, every arm phase has a crossing of the trunk's skin within 5 mm of the ring at station 31: at 26.4 to 31.8 mm under the arm (30 to 160 degrees), 32 to 36 at the posterior fold's foot, and between 28 and 35 over the cap, where the two skins weave through each other.

The loop generated from those crossings (`AutoMovieHumanF1Armscye`), against the reference's skin (`--reference`; positive outside the skin):

| Arc, arm phase | Arm's point | Trunk's drop | The two fields apart |
| --- | --- | --- | --- |
| Upper arc, 185 to 350 degrees | within 0.35 mm | within 0.35 mm | 0.0 to 0.8 mm; 1.6 to 2.0 at 275 to 285 |
| Under the arm's back half, 100 to 160, all on carried wall | -0.10 to +0.76 | within 0.15 | 0.0 to 1.7 |
| Front of the hollow, 60 to 95, on carried wall | +0.7 to +1.7 | +0.2 to +2.3 | 0.0 to 1.7 |
| Anterior fold, 352.5 to 30 | +1.2 to +3.3 | 0.0 to +3.4 | 1.5 to 6.3 |

So the carried wall lies on the skin under the arm's back half and does not draw the join's edge off it there. At the front of the hollow both stored walls stand proud of the skin, and at the anterior fold the arm's wall stands up to 3.3 mm proud where its section turns its front lower corner. Both stored walls are fitted to the tape's hull, which bridges the fold.

The joint alone (`--realize`: a trunk slab, the carried arm and one `merge` with the generated loop, realized in three seconds) is refused there: `one kept side: the part's kept side reverses before clock 4.385`, the anterior fold's foot.

## Premises of the join

Taken from `AutoMovieEngineConstructionSharedLoop.create`, `AutoMovieEngineSolidSharedCurve`, the fold branch of `AutoMovieEngineConstructionWidths` and `IAutoMovieConstructionJoin`.

| Premise | Today | Needs |
| --- | --- | --- |
| The loop is an `ILoop` on the trunk's chart: finite centre, positive semi-axes with the phase one under pi, `count` shares | A recorded table | A generated loop: the upper arc as the trunk's skin cut by the plane fixed in the thorax's frame, the lower arc as the two walls' own crossing, sampled into shares about a centre it is star-shaped about |
| `shared loop`: every loop point within `tolerance` of the part's face | On the generated loop the two fields stand up to 0.8 mm apart over the cap, 1.7 under the arm and 6.3 at the anterior fold | One owner over the cap (the arm's root reads the trunk's cut), and both walls fitted to the skin at the anterior fold and the front of the hollow. The tolerance is then a numerical one on a shared curve; it is never sized to the two fits' mismatch |
| `closed loop`, `enclosed loop` | Not evaluated | Follows from the generated loop |
| `one kept side` | The ring changes side seven times | Follows once the upper arc is shared |
| Each fold width positive; `fold radius` under both surfaces' radii toward the fold; no `cleft` past the cap | 23 to 70 degrees at the fold feet; unmeasurable under the arm | Measured once the lower arc exists |
| Seams exact between columns | The join's seams are exact at columns only | A loop-owned band builder for joins, in the kernel, with an operator test that fails first |

## Order of work

1. **The trunk under the arm.** Fit the trunk's wall at the shoulder to the skin with the arm left out by the plane's far side only above the folds, so a wall stands under the arm for the arm's wall to cross. Today's clip at 151 mm leaves the tape hull to bridge there.
2. **The arm's root.** Carry the arm's sections inward of the plane and centre their course on the sections; take the upper arc of the section in the plane from the trunk's cut.
3. **The loop by rule.** Generate it for the person from the two sources: the plane's cut above the fold points, the walls' crossing below them. `FamilyConicArmscyeRule.ts` holds the candidate planes and the accepted landmarks as checks.
4. **The join.** Declare it on that loop with fold widths; state the fold's radius at the fold feet and under the arm in the thorax's frame; where the walls face each other past the cap the kernel reports `cleft`, which is the slit of a hanging arm and stays two sheets.
5. **Remove** the axilla cutter, the recorded loop, `AutoMovieHumanF1NativeRootLevel` for this joint, the arm's rail tables and their readers.
6. **Gate.** f1 builds without a diagnostic; the shoulder and the armpit are opened in the three passes beside the reference on both sides; the length cases above and the tissue cases the joint refused are built and looked at.

## What the references say

| Source | Read | Bearing |
| --- | --- | --- |
| Wang C. C. L., Parameterization and parametric design of mannequins, Computer-Aided Design 37 (2005) | read in part: pages 3 to 9 | In level sections the armpit is a branch: the contour at the underarm height is one loop with the arms as lobes, and the underarm point is the middle of its front and back turning points, at `H_belly + 0.55 (H_backneck - H_belly)`. The feature curves lie on planes set by anthropometric rules. The junction's cross tangent (the paper's equation 4) and the n-sided patches are on pages this note's author did not read. |
| Blender `MOD_skin.cc`; Dust3D; Anny; MPFB2 | not read by this note's author; the supervisor's reading is in the campaign's record | None claimed here |
