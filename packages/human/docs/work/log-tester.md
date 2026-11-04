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
