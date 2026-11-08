# Human test rebuild record

Erased or replaced region tests, each with its reason. The frozen ZIP `packages/human/.shots/f1_modeler_xhigh/numeric-influence-20261107-1805/source.zip` keeps the earlier bytes.

## Pure-logic purge (f1_tests), 2026-11-08: classification

Owner orders of 2026-11-08: every Human test finishes in under one second and is a pure-logic unit test, with hardcoded, monkey-patching and e2e tests erased (about 11:55); every test that reads the MetaHuman reference is erased (about 12:10).

- **Keep**: pure logic, made inputs, independent expectations, under one second, no hardcoding or patching, no reference.
- **Rewrite**: a valuable law or operator property reached through a person build, a loft, a reference-person input record or a run over one second; rewritten as a unit test of its owning function on made inputs.
- **Delete**: e2e (builds a person, body, skin or capture), expected values copied from output or a reference, patching of the code under test, no single owning function, or reads the MetaHuman reference.

Time is the latest logged run of the test in `packages/human/.shots/**/*.log` (milliseconds, `x` = that run failed, date 2026-11-dd), many of them under concurrent load; `no log` means no run was found. Reference: `pack` = private curve pack (`HumanReferenceSections`, `.references/curves`); `f1 ref` = optional private f1 reference mesh; `outlines` = `AutoMovieHumanReferenceOutlines`; `people` = runs the `HumanPeople` set, whose core is the four reference people's records; `f1 record` = the f1 reference person's parameter record as input; `tool` = exercises reference tooling on made data and loads no reference. Region rows (arm, leg, trunk, head) were first classified only; the supervisor then assigned all rewrites, region rows included, to f1_tests.

| Test | Class | Reason | Time | Reference |
| --- | --- | --- | --- | --- |
| `test_human_anatomy_arm` | Delete | e2e: generates people and skin | no log | people |
| `test_human_anatomy_foot` | Delete | e2e: poses generated people | no log | people |
| `test_human_anatomy_hand` | Delete | e2e: poses generated people | no log | people |
| `test_human_anatomy_head` | Delete | e2e: people, skin and mouth interior | no log | people |
| `test_human_anatomy_head_consistency` | Delete | e2e: generates people, locates face landmarks | no log | people |
| `test_human_anatomy_leg` | Delete | e2e: generates and poses people | no log | people |
| `test_human_anatomy_pose` | Delete | e2e: poses generated people | no log | people |
| `test_human_anatomy_trunk` | Delete | e2e: people and skin | no log | people |
| `test_human_anatomy_trunk_silhouette` | Delete | e2e: cuts people's skins | no log | people |
| `test_human_calibration_dimensions` | Delete | e2e: whole-body calibration of f1, three times | no log | f1 record |
| `test_human_calibration_mouth` | Keep | mouth producer on a made planar skin; Wheeler/Downs published values | no log | no |
| `test_human_calibration_radius` | Keep | head radius on analytic ellipses; quadratic ray intersection | no log | no |
| `test_human_clinical_ik_roundoff` | Keep | public IK solver on a small arithmetic FK fixture | no log | no |
| `test_human_engine_pose` | Delete | e2e: rigs and poses every generated person | no log | people |
| `test_human_foot_preparation` | Delete | e2e: calibrated people through Skeleton.prepare | no log | people |
| `test_human_foot_surface` | Delete | e2e: foot exterior derived from calibrated people | no log | people |
| `test_human_loft_phase_endpoint` | Keep | loft phase owner on four-point polygons; exact quarter-turn phases | no log | no |
| `test_human_memory` | Delete | e2e: generates each person | no log | people |
| `test_human_mouth` | Delete | e2e: lofts people's skin | no log | people |
| `test_human_pose_mirror` | Delete | e2e: builds mirror images and poses both bodies | no log | people |
| `test_human_reference_curve_scaffold` | Keep | display adapter on an analytic parabola; Bernstein coefficients | no log | tool |
| `test_human_runtime_choices` | Delete | expected enum values are a literal copy of the source | no log | no |
| `test_human_seam_patch` | Keep | Coons patch reproduces an analytic surface; closed forms | no log | no |
| `test_human_seam_ribbon` | Keep | seam ribbon on a graph surface; closed forms | no log | no |
| `test_human_seam_section` | Keep | guide assembly on a circle; closed forms | no log | no |
| `test_human_seam_station` | Keep | station rule on surfaces of revolution; closed forms | no log | no |
| `test_human_skin_attributes` | Delete | e2e: generates skin | 198429 (05) | people |
| `test_human_skin_binding` | Delete | e2e: lofts people's skin | no log | people |
| `test_human_torso_camera` | Keep | camera parser and projection on numeric arrays | 5 (07) | no |
| `test_human_universality` | Delete | e2e: builds each person | no log | people |
| `test_human_universality_sample` | Delete | e2e: builds sampled people | no log | people |
| `arm/test_human_arm_clearance` | Delete | e2e: each person's neutral skin (region: arm) | 46952 x (05) | people |
| `arm/test_human_arm_landmarks` | Keep | landmarks on made inputs; published shares (region: arm) | 13 (08) | no |
| `arm/test_human_arm_segment_frames` | Keep | ISB frames on made inputs (region: arm) | 16 (08) | no |
| `arm/test_human_arm_view_curves` | Rewrite | made inputs, over 1 s (region: arm) | 1490 (08) | no |
| `arm/test_human_arm_view_loft` | Rewrite | lofts a whole arm and digits, over 1 s; test the loft property on made sections (region: arm) | 4012 x (08) | no |
| `audit/test_human_audit_anatomy` | Delete | e2e: generates people | 681774 x (05) | people |
| `audit/test_human_audit_inputs` | Delete | e2e: people and skins | 666622 x (05) | people |
| `audit/test_human_audit_seams` | Delete | e2e: generates people | 671190 x (05) | people |
| `audit/test_human_audit_sections` | Delete | e2e: generates people | 643990 x (05) | people |
| `audit/test_human_audit_surface` | Delete | e2e: generates people | 596594 x (05) | people |
| `audit/test_human_audit_trunk` | Delete | e2e: generates people | 616314 x (05) | people |
| `capture/test_human_capture_cameras` | Keep | camera fit on made points; vector identities | 4 (08) | no |
| `capture/test_human_capture_comparison` | Keep | pairing on made manifests | 2 (08) | no |
| `capture/test_human_capture_manifest` | Keep | manifest plan on made records | 2 (08) | no |
| `capture/test_human_capture_options` | Keep | argv parser | 1 (08) | no |
| `capture/test_human_capture_outliers` | Keep | outliers on made boxes | 2 (08) | no |
| `capture/test_human_capture_selection` | Keep | selection on made part records | 2 (08) | no |
| `capture/test_human_capture_specs` | Keep | spec fans on a made grid; 45-degree closed form | 20 (08) | no |
| `curves/input/test_human_anatomy_course` | Delete | e2e: people and skin | 614817 x (05) | people |
| `curves/input/test_human_input_anatomy_defaults` | Rewrite | `AutoMovieHumanBodyAnatomy.resolve` against survey bands, but over all 66 people, over 1 s | 3680 (05) | people |
| `curves/input/test_human_input_box_consistency` | Rewrite | `resolve` and `AutoMovieHumanBodyBox` box range, but over all 66 people and f1, over 1 s | 1270 (05) | people |
| `curves/input/test_human_input_response_anatomy` | Delete | e2e: f1 and a changed person | 47391 x (05) | people |
| `curves/input/test_human_input_response_extremities` | Delete | e2e: f1 and eight perturbed people | 52643 x (05) | people |
| `curves/input/test_human_input_response_face` | Delete | e2e: f1 and twelve perturbed people | 45213 x (05) | people |
| `curves/input/test_human_input_response_head` | Delete | e2e: f1 and ten perturbed people | 48884 x (05) | people |
| `curves/input/test_human_input_response_limbs` | Delete | e2e: f1 and ten perturbed people | 59864 x (05) | people |
| `curves/input/test_human_input_response_negative` | Delete | e2e: f1 and eight perturbed people | 56964 x (05) | people |
| `curves/input/test_human_input_response_shape` | Delete | e2e: f1 and two changed people | 64039 x (05) | people |
| `curves/input/test_human_input_response_trunk` | Delete | e2e: f1 and eleven perturbed people | 56370 x (05) | people |
| `curves/integrity/test_human_curve_arm` | Delete | e2e: whole-figure curve audit | 235347 x (07) | people |
| `curves/integrity/test_human_curve_foot` | Delete | e2e: whole-figure curve audit | 534291 x (07) | people |
| `curves/integrity/test_human_curve_hand` | Delete | e2e: whole-figure curve audit | 525303 x (07) | people |
| `curves/integrity/test_human_curve_head` | Delete | e2e: whole-figure curve audit | 10980 x (05) | people |
| `curves/integrity/test_human_curve_leg` | Delete | e2e: whole-figure curve audit | 252991 x (07) | people |
| `curves/integrity/test_human_curve_placement` | Delete | e2e: whole-figure placement | 9899 x (05) | people |
| `curves/integrity/test_human_curve_trunk` | Delete | e2e: whole-figure curve audit | 10198 x (05) | people |
| `curves/integrity/test_human_curves_rings` | Delete | e2e: generates people | 10283 x (05) | people |
| `curves/integrity/test_human_curves_rings_centre` | Delete | e2e: generates people | 510640 x (05) | people |
| `curves/integrity/test_human_skin_collapse` | Delete | e2e: generates people's skin | 10740 x (05) | people |
| `curves/population/test_human_people` | Delete | audits the test population catalog, no production owner | 2503 (05) | people |
| `curves/region/test_human_anatomy_ordering` | Delete | e2e: generates people | 515038 x (05) | people |
| `curves/region/test_human_curves_region_bones` | Delete | e2e: bind skin of each person | 13128 x (05) | people |
| `curves/region/test_human_curves_region_calf` | Delete | e2e: neutral skin of each person | 12681 x (05) | people |
| `curves/region/test_human_curves_region_digits` | Delete | e2e: people's rigs | 20464 x (05) | people |
| `curves/region/test_human_curves_region_foot_breadth` | Delete | e2e: neutral skin of each person | 13287 x (05) | people |
| `curves/region/test_human_curves_region_kinematics` | Delete | e2e: people's rigs | 83661 x (05) | people |
| `curves/region/test_human_curves_region_order` | Delete | e2e: bind and neutral skins | 188266 x (05) | people |
| `curves/region/test_human_curves_region_segments` | Delete | e2e: people's rigs | 83891 x (05) | people |
| `curves/region/test_human_curves_region_shoulder` | Delete | e2e: bind skin of each person | 132156 x (05) | people |
| `curves/skin/test_human_skin_integrity` | Delete | e2e: generated people's skin | no log | people |
| `curves/skin/test_human_skin_integrity_posed` | Delete | e2e: posed people's skin | no log | people |
| `debug/test_human_debug_boot_failure` | Delete | runs the page bootstrap in a JSDOM realm, not a law or operator | 264 (05) | no |
| `debug/test_human_debug_capture_resources` | Keep | capture probe lifecycle with test-owned protocol doubles | 134 (05) | no |
| `debug/test_human_debug_chain_loft` | Keep | chain-piece builder on two analytic ellipsoids | 781 (06) | no |
| `debug/test_human_debug_controls` | Delete | Vite bundle and JSDOM integration, over 1 s | 17578 (05) | no |
| `debug/test_human_debug_page_work` | Keep | page work owner with explicit gates | 11 (05) | no |
| `debug/test_human_debug_reference_mesh` | Delete | reads the private f1 reference mesh | 2038 (05) | f1 ref |
| `debug/test_human_debug_reference_model` | Delete | reads the private f1 reference | 2460 (05) | f1 ref |
| `debug/test_human_debug_stall` | Keep | stall rule on made series | 1 (05) | no |
| `debug/test_human_debug_view_curves` | Keep | curve display on analytic parts; natural-cubic algebra | 23 (07) | tool |
| `debug/test_human_debug_view_deviation` | Keep | deviation owner on unit circles | 46 (07) | tool |
| `debug/test_human_debug_view_parts_cache` | Delete | e2e: f1 source definitions in the generation slot | 136187 (05) | f1 record |
| `debug/test_human_debug_view_parts_selection` | Delete | e2e: f1 full definition | 366283 (06) | f1 record |
| `estimate/*` (19 files) | Delete | readings of the private reference curves, no expectation | `estimate_trunk_outline` 12252 (07); others no log | pack |
| `hand/test_human_nail_plate` | Rewrite | `AutoMovieHumanNailPlate.generate` is the owner, but read on every calibrated person; rewrite on a made digit chain | no log | people |
| `head/test_human_head_plan_arcs` | Keep | plan arcs on made quarters; closed forms (region: head) | no log | no |
| `leg/test_human_leg_forefoot` | Rewrite | made legs, over 1 s (region: leg) | 4657 (08) | no |
| `leg/test_human_leg_hip_band` | Keep | hip band on made cylinder fields (region: leg) | 11 (08) | no |
| `leg/test_human_leg_segment_frames` | Keep | ISB frames on made inputs (region: leg) | 9 (08) | no |
| `leg/test_human_leg_view_loft` | Rewrite | lofts a whole leg, over 1 s (region: leg) | 18194 (08) | no |
| `leg/test_human_leg_view_specs` | Rewrite | over 1 s; finiteness is its only expectation (region: leg) | 2466 (08) | no |
| `levels/test_human_levels_isolation` | Delete | checks repository arrangement (source imports) | no log | no |
| `levels/test_human_levels_structure` | Delete | checks repository arrangement (source files) | no log | no |
| `limb/piece/test_human_arm_measurement_closure` | Rewrite | `ArmBones.place` closure, but on the selected people's records | 283 (05) | people |
| `limb/piece/test_human_body_definition` | Delete | e2e: f1 production body definition | 355656 (06) | people |
| `limb/piece/test_human_body_source_curves` | Delete | e2e: whole-person source parts | 30257 (06) | people |
| `limb/piece/test_human_foot_source_ownership` | Delete | e2e: f1 production context and raw lofts | 29896 (06) | f1 record |
| `limb/piece/test_human_foot_source_transfer` | Keep | foot source on analytic fixtures; closed forms | 8 (06) | no |
| `limb/piece/test_human_gluteal_connection` | Keep | connection modules on made view declarations | 652 (06) | no |
| `limb/piece/test_human_hand_attachment` | Rewrite | analytic parents, but over 1 s | 1924 (06) | no |
| `limb/piece/test_human_hand_definition` | Rewrite | `HandBones` factory, but on the selected people's records | 212 (06) | people |
| `limb/piece/test_human_hand_source_ownership` | Delete | e2e: f1 hand sources and raw lofts | 277735 (06) | f1 record |
| `limb/piece/test_human_head_closure_attempt` | Delete | prepares f1's canonical head pipeline; failure retention has no made-input owner entry | no log | f1 record |
| `limb/piece/test_human_head_lane_records` | Delete | e2e: f1 head lane | 12896 (06) | f1 record |
| `limb/piece/test_human_head_on_trunk` | Delete | e2e: one person's body and skin | 428970 x (06) | f1 record |
| `limb/piece/test_human_head_shared_source` | Delete | e2e: f1 production head lane | 263553 (06) | f1 record |
| `limb/piece/test_human_head_source_curves` | Delete | e2e: f1 head; expectation from reference outlines | 271721 (06) | outlines, f1 record |
| `limb/piece/test_human_head_tape_source` | Rewrite | analytic cylinder/oblate cases are unit cases; drop the f1 cranial family case | 248886 (06) | f1 record |
| `limb/piece/test_human_leg_distal_source` | Keep | leg family on synthetic originals | no log | no |
| `limb/piece/test_human_leg_proximal_source` | Keep | parent field on analytic fixtures; closed forms | 2 (06) | no |
| `limb/piece/test_human_limb_piece_body_finite` | Delete | e2e: calibrates every person | 113241 (04) | people |
| `limb/piece/test_human_limb_piece_joint_radii` | Delete | e2e: calibrates every person | no log | people |
| `limb/piece/test_human_limb_piece_mass` | Keep | mass pieces on closed-form hosts | 81 (05) | no |
| `limb/piece/test_human_limb_piece_skin_pieces` | Delete | e2e: generates body surfaces | 133448 (04) | people |
| `limb/piece/test_human_mass_source_ownership` | Delete | e2e: production preparation per person | 124449 (06) | people |
| `limb/piece/test_human_mass_source_transfer` | Keep | mass rebase on analytic scenarios | no log | no |
| `limb/piece/test_human_neck_source_curves` | Delete | e2e: f1 head mass and neck | 237274 (07) | f1 record |
| `limb/piece/test_human_published_domains` | Keep | realizes a made ellipsoid through the Human consumer | no log | no |
| `limb/piece/test_human_shared_neck_boundary` | Delete | e2e: f1 head and trunk raw requests | no log | f1 record |
| `limb/piece/test_human_torso_source` | Delete | e2e: f1 composed original; expectations from numeric snapshots | 3526 x (07) | f1 record |
| `limb/piece/test_human_torso_thorax` | Rewrite | analytic collar, envelope and cylinder cases are unit cases; drop the f1 source case | 2295 x (07) | f1 record |
| `limb/piece/test_human_trunk_section_family` | Rewrite | made circle tapes, but over 1 s | 1049 (07) | no |
| `limb/piece/test_human_walk_source_metadata` | Keep | walk evaluator on straight courses | 30 (05) | no |
| `performance/test_human_loft_counts` | Delete | reading of a generation, no expectation | no log | people |
| `performance/test_human_original_loft_cost` | Delete | reading of f1 source cost, no expectation | no log | f1 record |
| `performance/test_human_prepare_profile` | Delete | profile of a generation | 37774 (05) | people |
| `performance/test_human_profile_paths` | Delete | reading of saved profiles, no expectation | no log | no |
| `performance/test_human_skin_chart_grid` | Keep | `Grid.at` on a literal chart; bilinear closed forms | 2 (05) | no |
| `performance/test_human_surface_queries` | Delete | tests the audit helper `HumanAnatomySurface`, no production owner | 27 (05) | no |
| `performance/test_human_surface_resources` | Delete | e2e: generated skins in the generation slot | 28451 x (05) | people |
| `survey/*` (10 files) | Delete | network readings of ANSUR, no expectation | no log | no |
| `trunk/test_human_trunk_back_line` | Rewrite | over 1 s; f1 record input (region: trunk) | 2998 (08) | f1 record |
| `trunk/test_human_trunk_closures` | Rewrite | over 1 s; f1 record input; drop the debt ceiling 1.16 copied from the 11-08 readings (region: trunk) | 17421 (08) | f1 record |
| `trunk/test_human_trunk_joint_datums` | Rewrite | f1 record input (region: trunk) | 66 (08) | f1 record |
| `trunk/test_human_trunk_view_specs` | Rewrite | over 1 s; f1 record input (region: trunk) | 1124 (08) | f1 record |
| `trunk/piece/test_human_trunk_piece_views` | Rewrite | lofts the trunk part, over 1 s (region: trunk) | 3378 (05) | no |
| `trunk/piece/test_human_trunk_source_coordinates` | Rewrite | f1 resolved inputs (region: trunk) | 112 (05) | f1 record |

Totals, 175 files: Keep 37, Rewrite 20 (11 region), Delete 118 (one region: `arm/test_human_arm_clearance`).

The 83 helpers under `test/src/features/internal/` reached only by the Delete rows (relative-import graph of `test/src`; `HumanPeople` stays for the runner's `--human-people`): `assertHumanAnatomy`, `assertHumanCurves`, `audit/{HumanAnatomyTable, HumanInputIdentity, HumanInputReadings, HumanSectionAudit, HumanSectionReading, HumanSurfaceAudit, HumanTrunkTable}`, `curves/{HumanCurveBoneInside, HumanCurveCalfContour, HumanCurveCentreTrack, HumanCurveCollapse, HumanCurveDigitGirth, HumanCurveDigitOrder, HumanCurveFootBreadth, HumanCurveJoints, HumanCurveKinematics, HumanCurveMirror, HumanCurveOrder, HumanCurveProfile, HumanCurveRingAudit, HumanCurveRings, HumanCurveSegments, HumanCurveShoulderSlope}`, `HumanAnatomyCourse`, `HumanAnatomyCourseLandmarks`, `HumanAnatomyMade`, `HumanAnatomyOrdering`, `HumanBodyDefinitionFrames`, `HumanBodyDefinitionLeg`, `HumanBodyDefinitionShoulder`, `HumanBodyDefinitionTrunkSource`, `HumanCurveAudit`, `HumanCurveBody`, `HumanCurveChain`, `HumanCurveConstants`, `HumanCurveEar`, `HumanCurveFinding`, `HumanCurveFoot`, `HumanCurveHand`, `HumanCurveJaw`, `HumanCurveJoin`, `HumanCurveNose`, `HumanCurvePlacement`, `HumanCurveRing`, `HumanCurveSides`, `HumanCurveVector`, `HumanFootSourceFamily`, `HumanHandSourceInspection`, `HumanHeadContactCandidates`, `HumanHeadLipBorders`, `HumanHeadMassFamily`, `HumanHeadRequestBoundaries`, `HumanHeadSharedSource`, `HumanHeadSourceSection`, `HumanInputResponse`, `HumanInputResponseMade`, `HumanInputResponseReadings`, `HumanInputResponseShards`, `HumanLimbSourceCurves`, `HumanLocalSourceControls`, `HumanNeckBaseCourseReadings`, `HumanNeckCourseReadings`, `HumanPoseMirror`, `HumanPoseMirrorMatch`, `HumanPoseMirrorSubject`, `HumanPrepareProfileReport`, `HumanReferenceMedian`, `HumanReferenceSections`, `HumanSectionShape`, `HumanSharedLimbSources`, `HumanSkinIntegrityControl`, `HumanSkinIntegrityMesh`, `HumanSkinIntegrityPerson`, `HumanSurveyData`, `HumanTorsoSourcePreservation`, `HumanTrunkMedianComparison`, `levels/{HumanLevelIsolation, HumanLevelStructure}`, `region/assertHumanProvenRows`, `universality/{HumanUniversality, HumanUniversalitySample}`. The `HumanAnatomy*` and `HumanSkinIntegrity*` audit helpers stay reachable through the engine test `test_construction_operator_merge_angle`.

Human tests outside `test/src/features/human`, classified 12:40: Delete (each calibrates the m1 reference person through `HumanPeople`) `motion/test_human_{check_ankle_direction, grounding_geometry, leg_ik_point, prepared_fk_snapshots, prepared_projection, projection_solver_parity, rig_control_units, rig_controls_applied}` and `viewer/test_viewer_human_polygon_foot{,_admission}`; Keep (arithmetic FK fixtures or a synthetic descriptor) `motion/test_human_{clinical_ik, clinical_ik_admission, clinical_ik_conditioned_pose, clinical_ik_constraints, controller_transport, controller_transport_ownership, grounding, grounding_active_bounds, grounding_admission, grounding_conditional_bounds, grounding_floor_branches, grounding_static_inspection, pose_blend}` and `viewer/test_viewer_human_polygon`. `debug/test_human_debug_capture_resources` stays Keep: its protocol doubles are test-owned objects passed through the public seam and no production module, method, global or prototype is replaced.

Done: the 118 Delete rows and the 83 helpers erased 12:33:35 and the 10 outside Delete rows 12:43:12, each file by `Remove-Item -LiteralPath`, after an import-graph check of all `test/src` files found no remaining importer.

Owner order of 13:18: the parameter-based laws are commented out while f1 is authored by coordinates and the part connections are made first. Every test whose target is a region parameter law moved from Keep or Rewrite to Delete, and was erased 13:22:07 after the same import-graph check (25 tests): `test_human_calibration_mouth`, `test_human_calibration_radius`, `head/test_human_head_plan_arcs`, `limb/piece/test_human_head_tape_source`, `arm/test_human_arm_{landmarks, segment_frames, view_curves, view_loft}`, `limb/piece/test_human_{arm_measurement_closure, hand_definition, torso_thorax, trunk_section_family}`, `leg/test_human_leg_{forefoot, hip_band, segment_frames, view_loft, view_specs}`, `trunk/test_human_trunk_{back_line, closures, joint_datums, view_specs}`, `trunk/piece/test_human_trunk_{piece_views, source_coordinates}`, `curves/input/test_human_input_{anatomy_defaults, box_consistency}`; with them the helpers `internal/HumanTrunkMadeCurves.ts` (written for the trunk rewrites) and `internal/HumanTorsoCollarReadings.ts`, and earlier the orphaned `internal/HumanHeadTapeFamily.ts`. Rewritten and kept: `hand/test_human_nail_plate` (`AutoMovieHumanNailPlate.generate` on a made cylinder digit). Kept, as region source or connection operators on analytic fixtures unless their region comments the producer out: `limb/piece/test_human_{hand_attachment, foot_source_transfer, gluteal_connection, leg_distal_source, leg_proximal_source, limb_piece_mass, mass_source_transfer, walk_source_metadata}`.

Owner order of 13:25: keep only tests that guard what the f1 coordinate build uses (curves authored as f1 coordinates per part frame, joined through ports) or the tooling that judges it, and universal defect detectors. Judged 13:28 with the static import closure of `packages/human/src/executable/NodeF1Body.ts` (561 modules) as the reachability fact:

| Test | Verdict | Reason |
| --- | --- | --- |
| `test_human_loft_phase_endpoint` | Keep | engine `AutoMovieLoftParameter.phases`, used by every loft |
| `test_human_seam_ribbon` | Keep | `AutoMovieHumanSeam.ribbon`/`AutoMovieHumanBodyStrip` (reached by NodeF1Body); G0/G1/G2 seam detector on made surfaces |
| `test_human_seam_section` | Keep | `AutoMovieHumanSeamKnot`/`AutoMovieHumanSeam` (reached); guide jets and curvature-step detector |
| `test_human_seam_station` | Keep | engine `AutoMovieSeamStation` and `AutoMovieHumanSeam.reflect` (reached); layer curvature-step detector |
| `test_human_seam_patch` | Delete | `AutoMovieHumanSeamPatch` is not reached by NodeF1Body |
| `limb/piece/test_human_published_domains` | Keep | `AutoMovieHumanBodySurfaceSolids.draw` (reached) on a made engine body |
| `capture/*` (7) | Keep | the capture tool that judges f1 renders |
| `debug/test_human_debug_{capture_resources, chain_loft, page_work, stall, view_curves, view_deviation}` | Keep | the viewer and capture tooling that judges f1 |
| `test_human_reference_curve_scaffold` | Delete | saved-reference display tooling, not reached and not part of the f1 judgement |
| `test_human_torso_camera` | Delete | torso observation camera, not reached by the f1 build or its capture |
| `test_human_clinical_ik_roundoff` | Delete | IK |
| `hand/test_human_nail_plate` | Delete | appearance |
| `performance/test_human_skin_chart_grid` | Delete | appearance |
| `limb/piece/test_human_{hand_attachment, foot_source_transfer, gluteal_connection, leg_distal_source, leg_proximal_source, limb_piece_mass, mass_source_transfer, walk_source_metadata}` | Delete | parameter-law source producers the coordinate path replaces |
| `motion/test_human_*` (13) | Delete | IK, grounding, controller and pose blending |
| `viewer/test_viewer_human_polygon` | Delete | rig polygon viewer |

Owner orders relayed about 13:27 to 13:31: keep and add universal defect detectors, logic that finds an error in any sculpted figure regardless of parameters, chiefly anatomical order relations. Added as pure production functions in `packages/human/src/inspection/`, each with a red/green unit test on made inputs in `test/src/features/human/inspection/`:

| Function | Finds | Test |
| --- | --- | --- |
| `HumanInspectionAnatomyOrder.order` with `GIRTHS`, `HEIGHTS` | a girth order broken along a limb or the trunk (wrist < forearm, ankle < calf, knee < thigh, lower thigh < thigh, neck < neck base, underbust < chest, wrist < elbow breadth, bimalleolar < knee breadth); landmark heights out of order (midpatella < gluteal furrow < waist < axilla < suprasternale, axilla < acromion < cervicale < stature) | `test_human_inspection_anatomy_order` |
| `HumanInspectionAnatomyOrder.belly` | two maxima where one muscle belly stands | same |
| `HumanInspectionAnatomyOrder.taper` | a step against a declared monotone taper | same |
| `HumanInspectionAnatomyOrder.extremum` | a least or greatest girth away from its site (the narrowest wrist at stylion) | same |
| `HumanInspectionAnatomyOrder.inside` | an axis outside its own section | same |
| `HumanInspectionAnatomyOrder.mirror` | left and right not mirror images across z = 0 | same |
| `HumanInspectionMeshDefects.edges` | open, non-manifold and inconsistently wound edges | `test_human_inspection_mesh_defects` |
| `HumanInspectionMeshDefects.volume` | an inside-out closed skin (negative signed volume) | same |
| `HumanInspectionMeshDefects.triangles` | sliver and degenerate triangles | same |
| `HumanInspectionMeshDefects.crossings` | skin passing through itself | same |
| `HumanInspectionCurveDefects.loop` | a section loop that crosses itself or winds the wrong way | `test_human_inspection_curve_defects` |
| `HumanInspectionCurveDefects.fold` | a rail or column whose stations turn back | same |
| `HumanInspectionCurveDefects.crease` (`curvature`) | a turn sharper than the smallest skin radius | same |
| `HumanInspectionCurveDefects.spikes` | curvature spikes and ripples along a curve | same |

Not included as universal: calf < knee girth (ANSUR women's means 373.3 against 365.2 mm), forearm < elbow girth (237.6 against 238.3 mm), waist < hip and waist < chest (broken at the population's heavy end). Existing detectors kept: the seam position, normal and curvature (G0/G1/G2) readings `HumanSeamObserver.curve`, `surface` and `audit`, moved 13:46 from `test/src/features/internal/` to `packages/human/src/inspection/HumanSeamObserver.ts` so the body report can run them, still tested by `test_human_seam_{ribbon, section, station}` (its other importers, three engine operator tests and `internal/audit/HumanSeamAudit.ts`, now import the production module); the skin-integrity helpers `test/src/features/internal/HumanSkinIntegrity*.ts` (test-side, reached through an engine test).

Counts: `test/src/features/human` held 175 test files at the start and holds 23 now (the 18 kept from the start, the 3 detector tests, and the 2 files `limb/piece/test_human_published_domains` was split into beside itself, `_dense` and `_legacy`, over the shared fixture `internal/HumanPublishedDomains.ts` because its three restoration scenarios took 1749 ms together in `final-1.log`); the 24 Human-named tests outside it (motion, viewer) are all erased; 88 helpers in `test/src/features/internal/` are erased with them. `packages/human/.shots/f1_tests/final-1.log` (tests run 14:01): 21/21 passed, every test under 1000 ms except `published_domains` (1749 ms). `final-2.log` (tests run about 14:13): 23/23 passed, every test under 1000 ms except `published_domains_dense` (1336 ms), whose scenario doubled the phases and also halved the station tolerance. `final-3.log` (about 14:22), with the station tolerance kept: 23/23 passed, `published_domains_dense` still 1467 ms (restoring the explicit authorities at doubled samples costs about 1.2 s in `AutoMovieHumanBodySurfaceSolids.draw`), so the dense test was tried with the ellipsoid realized at a 1 mm chord: `final-4.log` (about 14:32) 23/23 passed, every test under 1000 ms except `published_domains_dense` (1455 ms). The chord change did not move it and was reverted; the cost is `AutoMovieHumanBodySurfaceSolids.draw` restoring explicit authorities at density 2. The supervisor ruled no exception to the one-second rule: `published_domains_dense` was erased 14:36:55, the explicit and legacy scenarios keeping the restoration covered, leaving 22 tests. `HumanInspectionMeshDefects.crossings` was made to scale the same hour (it kept every candidate pair in one Set and overflowed on the whole f1 body): each pair is now tested only in the grid cell holding the low corner of the two boxes' overlap, with an optional limit. `final-5.log` (tests run about 14:47), the closing run: 22/22 passed, every test under 1000 ms (largest `debug_chain_loft` 887 ms, `published_domains` 436 ms).

Engine construction tests added in this campaign, classified only: `test_construction_view_reliefs` (f1_arm) Keep, 52 ms; `test_construction_mesh_legalize` (f1_arm) Rewrite, 1964 ms and failing; `test_construction_split` (f1_integration) Rewrite, 2370 ms and failing. Other engine construction tests over 1 s in `f1_arm/engine-legalize-after2.log` (11-08 12:01): `determinism` 14753, `without_skin` 14152, `diagnostics` 14220, `nesting` 11902, `source_conic` 6488, `level_winding` 5340, `merge` 2711, `phase_fidelity` 2704, `widths` 2649, `diff` 2218, `arc` 1825, `conic_projective` 1713, `rollback` 1647, `section_metric` 1349, `mesh_consumers` 1201, `native_continuation` 1136, `source_ingress` 1045.

## Arm (f1_arm), 2026-11-08

| Test | Action | Reason |
| --- | --- | --- |
| `test/src/features/human/arm/test_human_arm_curve_specs.ts` | erased 02:20 | It verified the scaffold loops of `AutoMovieHumanArmCurveSpecs` (circles at the old 0.25 forearm station, bisection ellipses, straight silhouettes), which the conic-lofting view curves replaced and which no constructor reads any more; its module was erased with it. Its girth, bisection and locality checks are rebuilt on the actual view curves and loft in `test_human_arm_view_curves.ts` and `test_human_arm_view_loft.ts`. |
| `test/src/features/human/arm/test_human_arm_segment_frames.ts` | rewritten 02:20 | It asserted the 23:52 frame semantics (hand origin one wrist radius lateral of the styloid, `upper` read as GH to the elbow), which the ISB metacarpal frames replaced; the rewrite checks the ISB 2005 definitions, composition, mirror and frame invariance. |
