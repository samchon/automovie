# The armscye as a shared-loop join

What f1's trunk and arm sources are at the shoulder, measured against every premise the shared-loop join admits on, and the order of work that follows. [Joint logic](joint-logic.md) gives the joint's anatomy and kind; this note holds the numbers.

## Restart from the original surfaces

The Phase 2.5 reference pose and the identity-joint neutral pose have different receiving geometry. The Phase 2.5 reference shoulder retains its overall outline, with a narrow slit visible from below. In neutral, the arm's first sections cross to the medial side of the legacy sagittal plane. The close clay shows a shelf below the front of the shoulder and a pocket behind it. Keep the parent wall and the unaffected arm sections together when investigating that seam. [Campaign 2.5](https://github.com/samchon/automovie/pull/3533) · [Historical neutral inspection](https://github.com/samchon/automovie/issues/3171#issuecomment-6876575198).

Replay the original port and cutter using `FamilyConicArchivedAssembly` with `--shoulder=left` or `--shoulder=right` and the matching `shoulder.left` or `shoulder.right` camera scope. The overlay evaluates the published boundary points on their original owners. The replay holds each saved camera's orientation and scale and centres it on the port. Build the neutral input with `FamilyConicNeutral --shoulder-snapshot=<directory>` and add `--right` for the mirrored side. These captures contain the trunk, arm and cutter. Other joins and the whole-figure closure are outside their scope.

The original Phase 2.5 left port and cutter replayed in 57.1 seconds with no diagnostic. The current neutral ports replayed in 30.5 and 27.5 seconds. Both neutral cutters fail the historical seed search on the actual port band. Diagnostic sweeps over the cutters' full station domains at their existing 192-column angular resolution found meetings. Both intersection walks lost their branches at nearly mirrored points, `[-1.0, 1265.1, 156.4]` mm and `[-1.0, 1265.1, -156.5]` mm. All eight images per side matched the neutral captures that failed at the seed. The previous shared-loop control also failed the kept-side condition at 4.385 radians with a 6.325 mm largest source separation. The visible shelf, the search window and the incomplete traced branch describe different parts of the failure.

The capture also reads the exact parent line in the proximal arm section planes. For a radial ray `e` in the identified plane, the outward parent normal `n` supplies the signed incidence `a = n·e`. The inherited slope is `-n·(o′ + r e′)/a`, from differentiating the physical point `o + r e`. Here the arm's original axis supplies `o`, `e` and their station derivatives. A nonpositive incidence fails the outward radial premise regardless of the scalar slope bounds. The accepted reference has 17 such samples and neutral has 26 at the same 192 port clocks. The arm's original layer stations bracketed one plane at each of those clocks. The receipt stores the individual readings and the plane residual. This finite observation motivates a direct world-space guide where the radial chart reverses. It does not establish a complete interval enclosure. [Geometric continuity at shared guide curves](https://users.math.uoc.gr/~mkaravel/files/papers/bransurf.pdf).

### Trace preparation correction

The original adaptive walk reached its cut seed after a turn. The repeated fixed-chord stage lost the branch on both receiving arms, with a meeting residual below `3e-13` mm at a distant candidate. Its native secant assumed the previous step size even after a failed attempt shortened the physical step. Scaling that secant alone still left defects in the independent guide traversal. The replacement samples the one accepted adaptive path by accumulated world chord length and uses the original spline-plane intersection solve and chart-closure checks. It keeps guide density independent of the walk stride. [Surface intersection marching](https://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node109.html) · [Continuation step adaptation](https://doi.org/10.1137/1.9780898719154.ch6).

With the diagnostic seed domains, both neutral cutters realize with zero diagnostics, as does the isolated archived shoulder. The complete approved reference also replays with zero diagnostics and 1,545,076 triangles. The same-camera hand, pelvis and foot frames match their pre-change files. Direct inspection confirmed the retained silhouette and face. The neutral shelf and posterior pocket remain visible in the isolated clay. A source-line change must address the proximal arm geometry separately. Run `FamilyConicArchivedAssembly --operators` to read the realized join records without skin tessellation, then render the full matched views for appearance.

The restored roll reader had also refused seven constant-angle spans in the arm, hand and digits. Subtracting their world stations made the represented span up to `2.13e-14` mm shorter than the sum of the unused ease windows. A constant-angle span has zero first and second derivatives and uses neither window. Its reader retains the exact constant. The spans whose angles change still require disjoint, finite, nonnegative windows.

Use the front and back folds as separate landmarks. The shared curve should come from the retained parent surface and supply its tangent plane to the proximal arm. Trace any cutter against the live receiving surface and check the entire branch and its kept side. ISO 8559-1 defines the folds and armscye landmarks. Gabrielides et al. derive a cross tangent that remains independent of the guide tangent and use both for compatible Hermite ribbons. CGAL corefinement uses the same intersection edge incidence on both surfaces. These sources support the construction and ownership rules. The actual chart supplies the curve and its derivatives. [ISO 8559-1:2017, §§3.1.13–3.1.14 and Fig. 29](https://gso-sims-preview-doc-aws.s3-eu-west-1.amazonaws.com/iso-8559-1-2017-en.html) · [Gabrielides et al., §§4.2–4.3](https://users.math.uoc.gr/~mkaravel/files/papers/bransurf.pdf) · [CGAL, Corefinement and Boolean Operations](https://doc.cgal.org/6.1.2/Polygon_mesh_processing/index.html).

## Previous shared-loop investigation

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

Taken from `AutoMovieConstructionSharedLoop.create`, `AutoMovieSolidSharedCurve`, the fold branch of `AutoMovieConstructionWidths` and `IAutoMovieConstructionJoin`.

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

## Neutral receiving-curve controls, 2026-11-26

The retained cut can be traced in both isolated neutral shoulders with an
expanded diagnostic seed domain. The resulting clays still show an anterior
ledge and a posterior slit. The accepted archive remains the comparison for
the full-figure silhouette. Its isolated shoulder also shows the ledge in the
matched close view.

| Receiving line | Correspondence | Bilateral result |
| --- | --- | --- |
| Original curved arm rail | Length | The left realizes with no diagnostics and retains the ledge and slit. The right cutter refuses where successive blend normals turn 96 degrees apart. |
| First stored regular arm section after the proximal reversal | Angle | In both arms the parent loop has zero winding around the receiving center in its projected chart. |
| First stored regular arm section after the proximal reversal | Length | The cutter crosses the replacement surface on both sides. Successive blend normals turn about 104 degrees apart and the adjoining face loses a directed incidence. |

With `--topology`, the archived visual runner reads the same indexed mesh.
Each isolated neutral shoulder is one component with 728 boundary edges and
no non-manifold edges or degenerate triangles. The isolated archive gives
688 boundary edges and the same remaining counts. The isolation leaves
external cut edges, so these counts cannot establish assembled closure or
locate the visible slit. The optional query took 3.8–4.5 s. All eight frames
in the neutral left control have identical image hashes with and without it.

The last control places the receiving rail at a native section already beyond
the measured proximal reversal. It exposes an incompatibility between the
whole-loop correspondence and the two boundary tangent fields. Its failure
is reproducible under reflection. Keep the outer receiving curve where its
native orientation is positive. Use the shared parent position and cross
tangent to derive the medial transition, with anterior and posterior fold
landmarks identifying the corresponding arcs.

The medial-only receiver removed the measured rail inversions by keeping the
outer samples. It still widened the anterior ledge and exposed a sharp lower
edge. In the retained neutral close, the front ledge is on the shoulder
transition about 25–55 mm from the cutter contact. The posterior pocket
belongs to the cutter's surface. The lower blade belongs to the original
arm wall at about 45.6 mm along the arm, where the signed native orientation
reverses. The shared boundary and its cross tangent govern the front ledge,
the kept arm line governs the blade, and the cut must preserve both
resulting walls. Read the resulting contours with the same regional cameras.

A slow rejected realization was profiled while in progress. Cutter marching
accounts for 95% of sampled time and source station recovery for 85%,
inclusive. Evaluate the owning lines and their orientation before asking
the cutter to trace a proposed replacement.

Gabrielides et al. partition each downstream contour into inner and outer
arcs and carry the tangent ribbons with the reparameterization (§4.2).
Hahmann and Bonneau derive compatible cross-boundary tangent fields from one
curve network. Wang's mannequin construction derives the cross tangent from
the boundary tangent and the surface normal (equation 4). Open CASCADE's
compatible-wire implementation computes origins and orientation before
lofting closed profiles. The existing
angle and length clocks are useful controls for the shoulder, where the
folds identify more specific correspondences.

- [Gabrielides et al., G1-smooth branching surface construction from cross sections](https://users.math.uoc.gr/~mkaravel/files/papers/bransurf.pdf)
- [Hahmann and Bonneau, Triangular G1 interpolation by 4-splitting domain triangles](https://www.cs.cmu.edu/~eugene/refs/f-cubit/Hahmann-bonneau-00.pdf)
- [Open CASCADE, compatible wires implementation](https://github.com/Open-Cascade-SAS/OCCT/blob/master/src/ModelingAlgorithms/TKBool/BRepFill/BRepFill_CompatibleWires.cxx)
- [Wang, Parameterization and parametric design of mannequins](https://mewangcl.github.io/pubs/CADParaHuman.pdf#page=13)

### Pose and source controls

The archived identity control puts every articulated joint at zero rotation
and retains the thorax-fixed proximal placement. Against the same retained
parent envelope, each arm has more than 5,300 sampled points inside the
parent beyond the trimmed opening. The deepest is about 30 mm. Both arms
exit and re-enter farther along their medial stock. Replaying the held pose
against the same envelope clears that sample set. This isolates pose from the
local shoulder transition, which can still show a ledge in the held frame.

The public empty-pose skeleton derives resting abduction separately. Its
level-ring selector supplies only the trunk. The resulting fallback gives
6.28 degrees for this parameter set. Applying that pose to the calibrated
native stock moves 76 upper-arm samples per side inside the retained trunk.
Reading the actual arm radii in the same model would saturate the angle at
90 degrees. The strongest retained constraint pairs a torso point 2.26 mm
below the shoulder with a 39.91 mm arm radius from the outlet. The two
observations identify the radius-over-depth approximation at the shared
source. Use the held case for visual quality comparisons. Preserve the
archived identity and public rest calculations as diagnostic controls.

The sampled rigid-stock posture reaches near contact between 28.118 and
28.125 degrees on this shape. Treat it as a material-clearance control.
Upright CT of 158 healthy upper extremities documents a standing rest
with the palms touching the thighs and coupled scapular, humeral and
forearm positions. That observation supports a coupled posture check
with touching allowed. [Yoshida et al., standing neutral alignment](https://pmc.ncbi.nlm.nih.gov/articles/PMC9013055/).

The held shoulder's anterior ledge is on the shoulder transition and
the conspicuous lower blade follows the separate cutter near its station
15 mm. The held ledge has positive local parent-to-child departure in
both tested directions. Changing the radial correspondence alone addresses
a separate three-column reversal earlier around the loop.

### The axillary depression and the anterior ledge

Replay each held arm with `--shoulder=<side> --port-only` to isolate the
original port. Keep the same placement and the same front, back, below and
axillary close cameras, including their curve overlays. In both close views
the oval notch disappears when the cutter is removed. The left rear slit
also disappears. The anterior ledge remains and a thin projection is still
visible in the right below view. These images locate the notch on the cutter
and the persistent ledge on the arm's transition. The two isolated port-only
meshes have 688 scope boundary edges each, with zero non-manifold edges,
zero degenerate triangles and no construction diagnostics.

The original cutter sits about 13 mm below the held anatomical axillary
datum and dermal apex. Compare these landmarks separately from the cutter's
own cycle. Cocco et al. illustrate the continuous axillary fossa with
cadaver sections and ultrasound. The anterior and posterior folds must
still lead into that depression when a source curve changes. The cutter's
own centre serves as a probe of that operation. Use independent anatomical
landmarks to inspect the shape. [Cocco et al., Ultrasound imaging of the axilla](https://link.springer.com/article/10.1186/s13244-023-01430-9).

In the full held replay, both cutter variants have one closed, orientable,
consistently wound piece of genus zero. The axillary datum and traced dermal
apex are solid in both, and the nearest sampled positions on the old cutter
cycle are empty in both. These observations cover eight fixed probes, one
realization per variant and a locked camera with the original depth planes.
The body, face, pelvis, foot and hand comparisons match their corresponding
PNG hashes. Direct visibility of the notch is clearest in the isolated
shoulder captures. Probe readings leave continuous clearance and overlap
open. In the manual replay, `--form-points=<file>` reports genus and winding
at the supplied fixed metre coordinates. [Jacobson, Kavan and Sorkine-Hornung, Generalized winding numbers](https://igl.ethz.ch/projects/winding-number/).

In the held left front, the endpoints of one visibly pinched source line
turn through 81.92 degrees. Its two cross-boundary speeds are each 30.67%
of chord divided by span. The interior curvature reaches 0.648/mm at 6.25%
of the line. A quintic built from those same parametrized two-jets stays
within 0.023 mm of the source there. The short departures and endpoint
turn already explain the concentrated bend. Across the affected lines,
the child tangent leaves the parent-and-chord plane by up to 26.85 degrees.
Use spatial boundary data to evaluate changes to these lines.

Spatial Hermite with unit endpoint speed and zero tangential acceleration
lowered peak curvature on 13 of 15 of the visible source lines and reduced
curvature variation on all 15. An isolated variant preserved all 192
measured cutter contacts per side. Both matched front clay views acquired
a second bright strip, and the axillary close showed a wider crease. At
the sampled front strip the candidate normal rotated 33.61 degrees on the
left and 40.73 on the right. Subtracting the derivative of the angular
handover alone lowered those turns to 8.28 and 15.33 degrees. The
source-line change helped individual meridians while their angular
handover introduced a visible regression. The current shape stays in use.
Evaluate neighbouring lines and both surface partials together before
tessellation. [Sánchez-Reyes and Chacón, A polynomial Hermite interpolant for C2 quasi arc-length approximation](https://doi.org/10.1016/j.cad.2014.12.001).

The next source search varied the receiving station around the arm.
Individual viable points still need one directed path on both charts. In
the ordered search, the whole-shell control stops between 0.06545 and
0.09817 radians, where the receiving edge enters the trunk and downstream
arm stock re-enters. The retained trim removes that intrusion and reaches
3.04342–3.07614 radians. Both available edges there still lose the radial
departure bound at 23 of 25 measured points. The forward phase clock, the
material clearance and the continuous slope bound each qualify a full
edge. [Fuchs, Kedem and Uselton, Optimal surface reconstruction from planar contours](https://www.cs.jhu.edu/~misha/Fall13b/Papers/Fuchs77.pdf) · [Buchin et al., Locally correct Fréchet matchings](https://arxiv.org/abs/1206.6257).

### Global meridians without the cutter

The held bilateral comparison removed the historical cutter from both
controls and applied spatial Hermite around the entire port. It held the
parent and arm walls, seam jets through second order and material-clock
correspondence fixed. At 768 clocks and 97 stations per side, the candidate
showed zero sampled trunk intrusions, orientation reversals, winding
failures and strict triangle crossings. The matched front and close clay
views showed a brighter transverse ridge and a lower curled crease inside
the port. The thin diagonal remained visible from below on the right.
These images reject this replacement for the held pose.

On each side, the greatest turn between adjacent clock normals increased
from 6.47 to 33.37 degrees. The number of nonpositive chord projections of
the longitudinal derivative grew from 52 to 234 per side. Both controls
already departed backward at the same 13 parent seam clocks, from 3.36249
through 3.46066 radians, and had positive chord projections at every arm
seam clock. For a meridian `P` and its fixed unit endpoint chord `d`, the
projected derivative of `P(s(t))` is `d · P′(s(t)) s′(t)`. A positive
change of parameter speed preserves its sign. If a different departure is
needed at those clocks, inspect the parent loop, its inherited derivative
and the receiving correspondence together. Treat the turn and projection
as diagnostics of the observed fold. Inspect both surface directions
before evaluating a replacement, as fairness of a surface involves more
than the curvature along any one set of curves. [Moreton and Séquin, Functional Optimization for Fair Surface Design](https://www2.eecs.berkeley.edu/Pubs/TechRpts/1992/6142.html).

The unchanged walls and common cameras locate the new folds inside the
port. Adaptive diagonals left 434 band triangles unique to each variant.
Their separate contribution to shading remains unmeasured. The
held comparison covers two isolated shoulders and leaves whole-body
closure, clearance between samples, motion and tissue response open.

### Source of the anterior turn

Resolve the inherited parent derivative into the unit loop tangent and
the inward unit cross direction in the trunk tangent plane. The 13
backward meridians have positive chord projections in the inward cross
direction on both sides. Their negative along-loop contributions dominate,
with a lowest total projection of −0.08641. A positive longitudinal
scale keeps that sign. An orientation-preserving G1 shear adds a
multiple of the loop tangent and can change the projection while keeping
the tangent plane. This identifies a correspondence effect at the lower
fossa. It supplies no evidence of a smoother skin surface. [Collin, Sangalli and Takacs, G1 interface conditions](https://arxiv.org/abs/1509.07619).

The observed anterior ledge lies farther along the material clock. All 15
sampled meridians at 4.12334–4.58149 radians have positive endpoint
advance. At 4.12334 radians the endpoint tangents turn 81.92 degrees, with
the curvature peak within the first 6.25% of the span. Check how the
parent loop reads the trunk's anterior fold approach. A same-clock
inward displacement changes the angle between the two outward source
normals by −26.35 degrees/mm at 3.92699 radians and +6.23 degrees/mm at
4.12334 radians to first order. A uniform small offset therefore cannot
decrease both angles. Read a continuous, landmark-anchored trim on the
existing trunk wall and check both sides of the sign change. Preserve the
front and rear fold roots and the superficial hollow. If the wall cannot
supply that trim, the trunk's sectional guide that carries the anterior
fold approach is the next dependency. Cadaver sections and ultrasound
support those landmarks. The current person's field supplies their shape
and scale. [Berthier et al., anatomy of the axilla and upper arm junction](https://pubmed.ncbi.nlm.nih.gov/19669074/) · [Cocco et al., Ultrasound imaging of the axilla](https://link.springer.com/article/10.1186/s13244-023-01430-9).

In the right below view, seven ray samples on the thin diagonal met the
low trunk in front of the local shoulder and arm. The analytic clay
shade of the trunk reproduced the archived red-channel values within one
level. Those samples locate the line at the foreground overlap in this
camera. The exact tessellated owner at its short bright base remains open.

### Material correspondence and the axillary floor

In the held pose, horizontal sections through the anterior approach reach the native 48 mm arm ring in material order. At the first shelf, the inherited section tangent points toward the shoulder along the distal arm axis. For a fixed section normal `n` and source chart `B(u,c)`, the tangent that advances in `u` within the section is a positive multiple of `B_u - ((n · B_u) / (n · B_c)) B_c` where `n · B_c` is nonzero. The only parallel plane family preserving both held end pairings has its normal along the cross product of their chords. It also gives a backward inlet at the shelf, and its receiving phase derivatives differ from the held values at both ends. This rules out the two tested section families under the held correspondence constraints.

The floor landmark projects into the part of the trunk removed by the opening on both sides. In the measured section, the held exterior takes a long route away from the floor to reach the posterior fold. Dissection and ultrasound show the axillary fascia spanning the pectoral and latissimus margins and continuing toward the arm fascia. Use that adjacency to place a floor guide on the connecting surface. Derive its position and scale from the person's neighboring fields. [Pirri et al., Fig. 2](https://pmc.ncbi.nlm.nih.gov/articles/PMC13578567/#jum70292-fig-0002) · [Cocco et al., Ultrasound imaging of the axilla](https://doi.org/10.1186/s13244-023-01430-9).

Choose the parent opening and arm correspondence together where the native surfaces can supply the boundary points and transverse derivatives. Use the fewest guide curves that preserve both folds and the shallow floor. Check the resulting directions and contact with the retained fields across the whole opening, then compare clay, curve overlays and close views from the front, back and below. Boundary tangent data and shape-preserving guides are standard inputs to this construction. [Gabrielides et al., §§4.2–4.3](https://users.math.uoc.gr/~mkaravel/files/papers/bransurf.pdf) · [Open CASCADE, Filling a contour](https://github.com/Open-Cascade-SAS/OCCT/blob/master/dox/user_guides/modeling_algos/modeling_algos.md).
