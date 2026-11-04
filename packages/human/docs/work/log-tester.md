# Tester log (campaign #3044, issue #3057)

Times are read from `date` or `Get-Date` after the fact. Scratch: my own folder under the session scratchpad (`tester/`), outside the checkout. Type collector for `test/`: `ttsc --noEmit --watch` started 13:05:57 (process id 40572), ended by me at 13:34 after the ttsc 0.36 install and restarted 13:34:33 (process id 3508), log outside the checkout.

## Baseline generation on f1, f2, m1 and m2 (program 13:05:42, read 13:12, process tree ended 13:15:46)

`AUTOMOVIE_HUMAN_PEOPLE=f1,f2,m1,m2 pnpm test --include human_universality`: `test_human_universality` failed in 204,637 ms. None of the four people generates; each stops at the skin stage.

| Person | Stage | Message | Cause |
| --- | --- | --- | --- |
| f1 | skin | Opening mouth lies on no single chain | `AutoMovieHumanApertureBase.of` finds no head chain whose station range holds the mouth's outline with a miss under `MISS` (0.1 mm): the outline crosses the ring between `head.lower` and `head.middle`, so no single chain holds it (#3043's `12155ecbc`, never generated) |
| f2 | skin | Opening nostril.left lies on no single chain | the same, for the left nostril |
| m1 | skin | Opening mouth lies on no single chain | the same |
| m2 | skin | Station 1698.22 is outside chain head.lower | `AutoMovieHumanBodyRoots.trim` clamps the station to the chain's last layer `y1`, then its Jacobian probe calls `project(s + 0.01, t)` unclamped, and `bracket` throws (1698.22 = `y1` + 0.01); same root, an outline running past one chain's end |

`test_human_universality_sample` was ended unread, because every sampled person goes through the same skin stage. Reported to the supervisor at once. The head modeler owns the repair (trims spanning the chains an opening crosses, an analytic end probe); the skin-stage reruns wait for it.

## Solid operator tests (attempts 13:18:27 and 13:34:43)

Neither attempt ran a test. At 13:18 the owner-ordered `pnpm install` (ttsc 0.36) removed `ttsx` from under the run. At 13:34 the project check stopped the run at `test/src/features/human/curves/input/test_human_input_anatomy_defaults.ts:21` (TS2740: `SURVEY` lacks the anatomy fields #3045 added; the input worker's file, routed through the supervisor).

## Erasure of the tests the new construction makes unneeded (list written 13:42, before any deletion)

Owner order (relayed by the supervisor): erase first the old tests that the three-view construction makes unneeded, then write unit tests of the new operators, then the generic audits. The reference tests leave because a closeness to f1, f2, m1 and m2 rewards matching four people (owner rule 3). The per-part tests leave because they read per-part mechanisms (pieces, profiles, layers, merges, per-part seams, per-site defects) that the campaign replaces with one lofting operator, solid merge and solid diff, which operator tests and data-driven audits check once for every part.

Erased tests (52):

| Group | Files | Why |
| --- | --- | --- |
| reference comparisons and readings | `human/reference/**` (13: anatomy, inputs, thumb, aperture-base and loft-coordinate readings, limb mass, sections, isolation, layers, raw oracle, surface) | reference comparison layer, scheduled for erasure by #3057; the readings read today's construction |
| per-site defect tests | `human/curves/defect/**` (13: dent forehead, hip, shank, temple; fold lean; lump buttock; plate shoulder; rib heel, neck front; spike hair; step groin, neck base, shoulder) | one test per site of a defect class; surface health reads the classes once over every chain |
| per-part profiles | `human/curves/profile/**` (5: arm, head, leg, trunk, trunk girth) | profiles of the row-table constructions; the section audit reads fairness on every chain |
| merges and layers | `human/curves/merge/test_human_curves_merge`, `human/curves/layer/test_human_layer_composition`, `human/head/merge`, `human/trunk/merge` | ray unions and principal-layer composition, replaced by solid merge and diff |
| per-part seams | `human/curves/seam/**` (limbs, webs), `human/head/seam`, `human/trunk/seam`, `human/hand/seam`, `human/leg/seam`, `human/foot/seam` | event splits and relief seams, replaced by merges; the seam audit reads every declared seam and blend |
| pieces | `human/arm/piece`, `human/leg/piece` (bones, girth), `human/foot/piece` (guides, ribs, section, toes) | per-piece tests of the replaced row tables and pieces |
| head surface | `human/head/surface/**` (forehead, jaw, submental, temple) | the head's field construction, replaced by lofting |
| per-site fossa | `human/arm/test_human_arm_fossa` | a per-site kink reading of today's elbow |

Erased helpers that only the erased tests reach (found by an import-index fixpoint over `test/src`, so each file below has no importer left once the tests above go): all of `internal/reference/**` (41 files; nothing tracked outside imports them, and the ignored local tooling imports none), and 46 more: `arm/HumanArmPieceAudit`, `arm/HumanArmPieces`, `curves/assertHumanCurveKinks`, `curves/HumanCurveHairExtent`, `curves/HumanCurveHairStandoff`, `curves/HumanCurveHeadVault`, `curves/HumanCurveKinkRegions`, `curves/HumanCurveKinks`, `curves/HumanCurveMerge`, `curves/HumanCurveProfileArm`, `curves/HumanCurveProfileLeg`, `curves/HumanCurveSilhouette`, `curves/HumanCurveTrunkGirth`, `curves/HumanCurveTrunkOutline`, `foot/HumanFootMadeShapes`, `foot/HumanFootPieceAudit`, `foot/HumanFootPieces`, `head/HumanHeadMadeCut`, `head/HumanHeadPiece`, `head/HumanHeadSurfaceProof`, `head/HumanHeadSurfaceRows`, `HumanLayerComposition`, `HumanLayerContinuity`, `HumanLayerEmitted`, `HumanLayerFinding`, `HumanLayerIndex`, `HumanLayerPlane`, `HumanLayerPolygon`, `HumanLayerSite`, `HumanLayerTriangle`, `HumanRawBoundary`, `HumanRawFinding`, `HumanRawGeometry`, `leg/HumanLegPieceAudit`, `leg/HumanLegPieces`, `limbs/assertHumanProof`, `limbs/failingHumanRows`, `limbs/HumanLimbSectionShape`, `limbs/HumanLimbUnion`, `limbs/HumanWebColumns`, `region/HumanEventSeamProof`, `region/HumanEventSeamRows`, `region/HumanEventSeamTable`, `region/HumanMergeProof`, `region/HumanMergeRows`, `region/HumanSagitta` (all under `test/src/features/internal/`).

Kept, because each holds for any construction:

| Kept | Why |
| --- | --- |
| `human/curves/input/**` (10) | inputs read back at their definitions and input response; the input-identity audit later absorbs them |
| `human/curves/population/test_human_people`, `human/curves/region/**` (9), `human/test_human_anatomy_*` (9) | population relations and anatomy on the finished figure; the owner's table-driven anatomy audit on the finished curves later replaces the per-part files |
| `human/curves/integrity/**` (10) | placement and curve soundness on any lofted chain (winding, crossing, gaps, rings, collapse); the surface-health and placement audits later absorb them |
| `human/curves/skin/**` (2), `human/arm/test_human_arm_clearance` | a closed skin at bind and in pose; every limb outside the trunk at the neutral (placement) |
| `human/test_human_universality`, `_sample` | universality |
| `human/test_human_engine_pose`, `_pose_mirror`, `_skin_binding`, `_anatomy_pose` | pose and rig |
| `human/test_human_mouth`, `human/hand/test_human_nail_plate` | mouth and nails |
| `human/levels/**`, `human/performance/**`, `human/test_human_memory`, `human/debug/test_human_debug_stall` | levels, performance, memory, the debug viewer |
| `human/solid/**` (4), `human/test_human_seam_patch`, `_seam_ribbon`, `_seam_section`, `_seam_station` | operator unit tests on closed forms of the shared lofting mathematics the new operators use |

Not run before erasure, by order.

Committed as `572892a9e` (`date` 13:49:31 just before the commit): 134 test and helper files and two documents deleted (`packages/human/docs/testing/reference-layer.md`, `test/human-independent-coverage.md`, the reference layer's own pages). Held back: `human/reference/anatomy/test_human_reference_inputs.ts` and the four `internal/reference/bodies/` files it imports (`HumanReference`, `HumanReferenceFiles`, `HumanReferenceSkin`, `HumanReferenceWeld`). The input worker is editing that test uncommitted, and #3045's acceptance names it. It leaves when its acceptance moves into the input-identity audit, as the supervisor relayed. Doc comments of five kept tests no longer cite erased tests (`test_human_anatomy_course`, `test_human_anatomy_trunk`, `test_human_curves_region_calf`, `test_human_curves_region_shoulder`, `test_human_levels_isolation`). `packages/human/docs/README.md`, `generalization.md` and `testing/consistency.md` (file layout, section 7) no longer link the erased layer. `packages/human/src/generation/leg/AutoMovieHumanLegMassPrior.ts` still names `test_human_reference_limb_mass` in its comment; that prior is the input and laws worker's to replace. Human test files: 116 before, 70 after (counting other workers' new files).

Correction 13:49:43 (`date`): `572892a9e` recorded the erasure as "Done 13:58", a time not read from a clock; the clock read 13:49:31 at the commit. Now stated as read.

13:52:07 (`date`): the input and laws worker reverted its uncommitted edits to `test_human_reference_inputs` and released it; its rows (#3045's new trunk breadths and depths read on the skin at their sites, 7 mm allowance, ANSUR II's allowable error for chest breadth; `chestBreadth` and `bicristalBreadth` are no skin readings) move into the input-identity audit. Deleted with the four `internal/reference/bodies/` helpers it alone imported, so nothing under `reference/` remains.

## Operator tests and generic audits, written (recorded 14:11:50, `date`; not run: the owner ordered no test runs until relayed)

Compile read only from the shared watch log `packages/human/.shots/debug/ttsc-test-watch.log` (owner order: no ttsc of my own; my collector 3508 was left to the helper that replaced every watcher).

| File | What it checks | Red proof on |
| --- | --- | --- |
| `human/lofting/test_human_lofting_view_section` | ellipse at `sqrt(2) - 1` within the quarter's Hermite remainder of the closed form (seventh derivative by Taylor arithmetic, `internal/lofting/HumanViewOracle`), girth against the AGM perimeter, guide touch (radius, zero slope, declared curvature from the jet and from three points, never past its side) on boxes 1:3 to 3:1 and asymmetric, C2 across guides | a 0.02 fuller ellipse, a sloped guide, a turned ellipse, a curvature step |
| `human/lofting/test_human_lofting_view_section_girth` | reach inside the rhombus and rectangle girths, monotone girth, round trip within the solve's tolerance over the girth's slope (also with departures), one `girth in reach` diagnostic each way, one `view section` diagnostic for a box without a section | a falling sequence, a shoulder 0.01 off |
| `human/lofting/test_human_lofting_view_section_chain` | `AutoMovieHumanViewLoft.create`: knots read back at the guide phases, girth knots, every layer's `view`, surface and declared continuity, C2 in station, `outline order`, `half extent`, `order`, `stations`, a pole | an extent 0.5 mm off, a moved station curvature |
| `human/audit/test_human_audit_sections` (`internal/audit/HumanSectionAudit`, `HumanSectionReading`) | every section of every chain: closure, simple, curvature continuity by refinement, guide touch on `ILayer.view` layers, star about the axis; breadth, depth and girth fair along stations | figure-eight, fold, stadium, turned and open sections; turned and swollen made chains |
| `human/audit/test_human_audit_seams` (`internal/audit/HumanSeamAudit`) | every published merge and diff (`IAutoMovieHumanBodyCalibration.merges`): both rails G2 at the blend's columns; gap within the facets' chordal error, class A angle, curvature jump | a 2 mm crack, a 20 degree cone, a G1-only cylinder, a blend read 0.3 rad off its seed |
| `human/audit/test_human_audit_surface` (`internal/audit/HumanSurfaceAudit`) | every chain: meridian steps past the crease bound, ripples finer than the 10 mm chord, folded cells | a ripple, a doubled layer, a reversed ring |
| `human/audit/test_human_audit_inputs` (`internal/audit/HumanInputIdentity`) | every numeric input of `body.anatomy`, `head` and `extremities` read back by a region observer's identity row, or its reason for not being a skin reading | a reading out of allowance, a missing one, one centred elsewhere, an unknown input |

Written after: `human/audit/test_human_audit_anatomy` (`internal/audit/HumanAnatomyTable`), one table of limb relations on the chains' girth profiles: knee over thigh, calf over knee and wrist over elbow in ANSUR 1988's bands by sex, least ankle over calf 0.439 to 0.719, the narrowest ankle and wrist at their landmarks, one calf and one forearm belly, a monotone taper, the knee, elbow, ankle and wrist centres inside their sections; one made defect per row. `test_human_solid_merge_angle` reads the kernel's angle parameter on a sphere lying across a plane. Still to add: the trunk's depth over breadth at its sites and the hand and foot ratios on the finished figure, once the trunk and extremity subtrees publish their sections; the retirement of the per-part files these audits replace (Phase 2). Placement stays in `test_human_curve_placement` until then.

Violation 14:30:45 (`date`): a shell command I sent to edit this log began with a stray `python -` call, against the owner's rule of no Python helper; the tool refused it before it ran, and the edit was redone with `sed` alone. No Python ran.

14:39:57 (`date`): the anatomy table gained the mirror row (SYM-1, `HumanCurveMirror`'s bound); the surface audit gained the centre track (CUR-4, the crease bound on the sections' centres, proven on a layer offset 5 mm). CUR-2 (layer spacing at most doubling) is not carried: uneven spacing is no defect of a C2 surface, its bound came from the old leg row rule, and the steps it stood for are read by the profile and step rows. Shared watch: clean at the cycle started 14:37:41, after my last save.

Violation (same entry): the shared test watch's cycle started 14:33:33 read `HumanAnatomyTable.ts` between my edit that used `HumanAnatomyMirror` and the save of its import (TS2304), a red state under the rule to save only compiling states. From here an edit and the imports it needs go in one save.

## Phase 2 retirement map (written 14:40:20, `date`; each retirement waits for its subtree and for one run that shows the replacement red on the retired file's own made defect)

| Kept file | Replacement | Made defect to show red there |
| --- | --- | --- |
| `curves/integrity/test_human_curve_{arm,foot,hand,head,leg,trunk}` | `test_human_audit_sections`, `_surface`, `_seams` | its own proof, the part's middle layers swollen 30 percent (girth profile, meridian step) |
| `curves/integrity/test_human_curves_rings` | `_sections` (girth profile, star), `_anatomy` (SYM-1) | a shank layer swollen 10 percent; a reflected finger control point; a right shank 5 percent fuller |
| `curves/integrity/test_human_curves_rings_centre` | `_surface` (CUR-4) | an offset layer |
| `curves/region/test_human_curves_region_calf`, `_digits` (digit girth order) | `_anatomy` | the calf belly's lateral reach; the digit order once the hand rows land |
| `test_human_anatomy_{arm,leg,foot,hand,head,trunk}` identity rows | `_inputs` (which reads them through the region observers until the observers move into it) | an input moved by its allowance plus 1 mm |
| `test_human_seam_{patch,ribbon,section,station}` | stay while their modules stay in `lofting/` | none |

Kept as they are (#3057 item 6): pose and rig, mouth, nails, universality, levels, performance, memory, the debug stall, the solid and view operator tests, `test_human_people`, `test_human_curve_placement`, `test_human_skin_integrity` and `_posed`, `test_human_skin_collapse`, `test_human_arm_clearance`.

## Supervised operator run 14:42:19 to 14:45:27, triage (written 14:51:20, `date`)

3 of 9 passed: `test_human_solid_intersection`, `_merge`, `_mesh`. Every failure by cause:

| Test | Finding | Cause | Owner and fix |
| --- | --- | --- | --- |
| `view_section`, `_girth`, `_chain` | no valid range at the ellipse's shoulder for every box of aspect 2:1 or more and every asymmetric box (the chain's at 1.4:1); so no girth range, no chain, no surface | one quintic and one bump per quarter cannot follow a conic of aspect 2 or more | kernel, confirmed and fixed in `a0ec6ac90` (each quarter carries its conic's points at t = 1/4, 2/4, 3/4 as extra guides) |
| `view_section` | the three-point curvature at the guides off the declared by 2e-4 to 3.5e-4 relative at shoulders away from the ellipse's, on a square box | my symmetric three-point circle straddles a jump of the third derivative at the guide, which the C2 section may carry, and errs at the order of the step (kernel's reading, accepted) | test: read one side at a time, Richardson-extrapolated to zero step |
| `view_section` | the 0.02 fuller ellipse inside the remainder bound (2.6 mm on 30 by 20, 3.5 m on 60 by 20) | one quarter's seventh-order remainder is loose on elongated boxes | test: the bound follows the fixed section's knot spans, each a quintic Hermite (`max|rho^(6)| h^6 / (720 * 64)`), tight enough for the red proof on every box |
| `view_section` | mixed-shoulder continuity sections invalid (concave) | my chosen shoulders lay outside the reach | test: departures of 0.01 and 0.02 about the middle of the reach they leave |
| `solid_diff` | rim normal curvature 0.1 /mm "concave" at share 1 | G2 makes the rim equal the bowl there, concave from outside by 1 / R; the test asked convexity at every share | test: 0 at the plane's rail, 1 / R at the bowl's, a convex run between |
| `solid_diff` | the merge of the same pair does not keep the sphere above the plane | merge gives no join or a rail at z <= 0 | kernel, sent; the test now prints which |
| `solid_merge_angle` | part rail 0.52 to 0.80 mm off the vertical great circle, height varying with t | the rail is offset along a chart line, which depends on the parameterisation | kernel, confirmed: both rails move to the normal section (the great-circle oracle stays) |
| `solid_trim` | rolled rim angle 2.8e-9 rad and curvature jump 2.3e-6 /mm over the exact limits | the exact limits leave out the stencils' truncation; the rim quintic's fifth derivative, about 32 /mm^5, predicts 4.0e-9 and 3.3e-6 | test: truncation added to the limits from the rim's own ribbons |

The test fixes are in one batch; the next supervised run checks them with the kernel's answers.

14:59:35 (`date`): the kernel confirmed findings 1 and 3 as operator defects and fixed them (`a0ec6ac90` conic guides, `65fafe9bb` normal-section rails); finding 2 was my test's (a symmetric three-point circle straddling a third-derivative jump), now read one side at a time. The ellipse oracle now bounds each knot span's quintic Hermite (`max|rho^(6)| h^6 / (720 * 64)`), and the 0.02-fuller red proof is back on every box. New operator test `test_human_solid_body` for `AutoMovieHumanSolidBody` (`b84ae180d`): a column on a floor, a beam across the column's face and blend; watertight, outward, coordinates read back, red on a turned or dropped triangle and a moved coordinate. Asked the kernel for the host chain per column in `IMerge`, since a rail across faces cannot be read on one host chain.

Violation 15:01:58 (`date`): the shared test watch's cycle started 14:59:18 read `HumanSeamAudit.ts` red (TS2304 `turn`): a multi-line `sed` insert collapsed into one comment line and dropped the declaration it carried. Repaired within two minutes by the Edit tool. From here multi-line source edits go through the Edit tool only, never `sed` inserts. Change itself: `HumanSeamAudit.merges` reads each host column on its own chain (`IMerge.hostChains`, the kernel's field), with a first-order model of the rail toward same-chain neighbours.

## Next supervised pass, in order (written after the triage; one test program at a time, each tree ended when its result is read)

| Step | What | Command | Needs |
| --- | --- | --- | --- |
| 1 | the ten operator tests, no person | `pnpm test --include test_human_solid_intersection test_human_solid_merge test_human_solid_merge_angle test_human_solid_diff test_human_solid_trim test_human_solid_mesh test_human_solid_body test_human_lofting_view_section test_human_lofting_view_section_chain test_human_lofting_view_section_girth` | nothing (`--include test_human_solid_merge` also reaches `_merge_angle`, and `test_human_lofting_view_section` its two siblings; listed for clarity) |
| 2 | #3045's input tests | `pnpm test --include test_human_input_anatomy_defaults test_human_input_box_consistency` | the input worker's last save compiling |
| 3 | universality on the references | `AUTOMOVIE_HUMAN_PEOPLE=f1,f2,m1,m2 pnpm test --include test_human_universality` | the head modeler's trim repair; the filter also reaches `test_human_universality_sample`, which samples its own set (`AUTOMOVIE_HUMAN_SAMPLE`) and is ended unread if step 3's own result already fails at the skin |
| 4 | the curve audits, body law only | `AUTOMOVIE_HUMAN_PEOPLE=f1,f2,m1,m2 pnpm test --include test_human_audit_sections test_human_audit_seams test_human_audit_surface test_human_audit_anatomy` | nothing beyond generation by the body law |
| 5 | the input-identity audit, on the skin | `AUTOMOVIE_HUMAN_PEOPLE=f1,f2,m1,m2 pnpm test --include test_human_audit_inputs` | step 3 green (the skin builds) |
| 6 | the same audits on the core set | steps 4 and 5 without `AUTOMOVIE_HUMAN_PEOPLE` | steps 4 and 5 read |

Every audit lists all its findings before it fails; a failing audit on the figure is a work list for the subtrees, and only a made-proof line (`proof ...`) is a defect of the audit itself.

## Phase 2 retirements, ready edits (each waits for its subtree and for one run showing the replacement red on the retired file's own made defect)

Each edit: `git rm` the files, rerun the import-index fixpoint of the erasure (every helper whose importers are all gone goes too), and fix the citations listed.

| Retirement | `git rm` (under `test/src/features/human/`) | Helpers expected to fall with it | Citations to fix | Red proof to show first |
| --- | --- | --- | --- | --- |
| R1 curve soundness per part | `curves/integrity/test_human_curve_{arm,foot,hand,head,leg,trunk}.ts` | `internal/HumanCurveBody`, `HumanCurveHand`, `HumanCurveFoot`, `HumanCurveJaw`, `HumanCurveNose`, `HumanCurveEar`, `HumanCurveJoin` and the rules only they import (`test_human_curve_placement` keeps `assertHumanCurves` and `HumanCurvePlacement`) | `packages/human/docs/work/modeler-log.md` (history, left as it is) | the part's middle layers swollen 30 percent fail `test_human_audit_sections` (girth profile) and `test_human_audit_surface` (step) on that part's chains |
| R2 rings | `curves/integrity/test_human_curves_rings.ts` | `internal/curves/HumanCurveRingAudit` | `test_human_curves_rings_centre`, `test_human_skin_collapse` doc comments; `docs/testing/consistency.md` (CUR-2, CUR-3, SEC-4, SYM-1 rows) | a shank layer swollen 10 percent (girth profile), a reflected finger control point (star), a right shank 5 percent fuller (`test_human_audit_anatomy` SYM-1) |
| R3 centre track | `curves/integrity/test_human_curves_rings_centre.ts` | `internal/curves/HumanCurveCentreTrack` | `docs/testing/consistency.md` (CUR-4) | an offset layer fails `test_human_audit_surface` CUR-4 |
| R4 calf contour | `curves/region/test_human_curves_region_calf.ts` | `internal/curves/HumanCurveCalfContour` | `docs/testing/consistency.md` (OBS-LG-1) | needs a row first: the calf's lateral reach against its medial is not yet in the anatomy table (OBS-LG-1), so this retirement waits for that row |
| R5 digits | `curves/region/test_human_curves_region_digits.ts` | `internal/curves/HumanCurveDigitGirth`, `HumanCurveDigitOrder` | `docs/testing/consistency.md` | needs the digits in the anatomy table (girth order along each digit), written when the hand subtree (#3051) publishes its phalanges |

Not retired by these audits: placement, skin integrity and collapse, the arm's clearance, `test_human_people`, the region tests of kinematics, segments, bones, order, ordering, shoulder and foot breadth, which read relations the audits do not yet carry; each gets a row of the anatomy table or stays, decided when its subtree lands.
