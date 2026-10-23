# Human reproduction handoff

Modeling stopped at the user's request. This change retains inspection improvements and evidence, not a completed Human reproduction. The active Human generator and calibration remain at the complete baseline from merged commit `6c568f1dd545e8bf82e74b766ac6d2f8e0f8a515`. Unfinished geometry and fitter changes were rejected for publication.

The user will resume in a new session without subagents. Start with the complete evidence and one shared representation contract; do not resume the discarded regional implementation.

## Retained implementation

- The viewer supports `hair=0`, `material=clay`, and `light=raking-left|raking-right` through controls, canonical URLs, capture metadata and state restoration. Clay removes skin textures, vertex colours, emissive and skin shader effects without changing geometry.
- Specifying only `el` preserves the named camera's azimuth. Previously `head-back&el=-15` silently became a front view. Fresh implicit/explicit 180-degree captures now have identical PNG hashes, and side-camera elevation preserves its side direction.
- The existing top view is `free` with `view=+y`; encode the plus as `%2B`. Actual metadata records elevation `pi/2`.
- Human instructions require viewer recovery before modeling, every required fresh audit image, local image inspection and preservation of the original cadence. An unavailable label or old image does not complete an audit.

No geometry correction from the abandoned batch is included. Eye scale, cavity colour, terminal lineage and other identified causes still need implementation and actual rendering in a coherent replacement batch.

## Reproduction status

| Specimen | Qualification |
| --- | --- |
| f1 | Whole body assembled; visible defects remain; not accepted |
| f2 | f1 calibration scaled by stature; not reproduced |
| m1 | f1 calibration scaled by stature; not reproduced |
| m2 | f1 calibration scaled by stature; not reproduced |

The public contract remains `AutoMovieHuman.generate(params)` returning `{ parameters, model }`. Typed examples under `packages/playground/src/human-parameters/` are authoritative. Other body controls do not yet shape the skin. Four specimens would not identify every independent parameter effect or prove unseen-shape prediction.

## Preserved local evidence

These directories are ignored development artifacts, not GitHub attachments. Canonical reference addresses come from `test/.shots/manifest.json` and each specimen's `captures.json`. Original-model photographs, Recovery ruled renders and independent Human images are different evidence.

| Directory under `packages/playground/.shots/` | Contents |
| --- | --- |
| `final-r1/` | Historical inspection, not new validation |
| `repro-r1/` | 77 distinct initial frame/receipt pairs from 79 requests, regional diagrams, baseline model JSON and source/contact/head/nose/skin measurements |
| `controlled-r1/` | 60 beauty, clay, raking, overlay and construction images across ten f1 regions |
| `audit-001/`, `audit-002/` | Earlier eight-frame reports before the user narrowed the audit |
| `audit-003/` | Failed captures, not a completed audit |
| `audit-004/` through `audit-008/` | Fresh f1 front, side, top and back images with underwear off, exact SHA checks and retained receipts; every direction opened locally |
| `audit-007/` | Also corrected partial-elevation back/side captures; implicit and explicit back azimuth produce identical PNG bytes |
| `appearance-r1/` | Hair views, actual-mesh measurements and inspection report; the mislabeled old front-low capture is separated from the corrected back-low frame |
| `nails-r1/`, `nails-r1-occlusion/` | 84 directly inspected frames covering all 20 nails, hands, webs and soles; the second set resolves two initially occluded toenails |
| `stage-static-r1/`, `stage-fit-r1/` | Actual exit codes, failed fitting logs and read-only source diagnostics from the rejected batch |
| `cleanup-final-frames/`, `cleanup-final-inspection/` | Final four-direction f1 captures, clay/raking/overlay/construction head captures and separate section/axis diagrams; all eleven PNGs opened locally |
| `cleanup-final/` | Passing playground build and Evidence exit codes, final capture summary and delivery records |

Receipts retain UTC, source/input/model/construction hashes, camera, display conditions and hardware renderer. Identical deterministic pixels across fresh draws do not mean cache hits. The baseline model hash is `831d990d001232c9e6f8e408bb86b840be75a5b0f79b928410d2bc8431e46d54`, computed from `JSON.stringify(model)`, not the whole HTTP response file.

## Confirmed defects and causes

| Observation | Established cause or remaining distinction |
| --- | --- |
| Head rings near 1595.5 and 1543.2 mm | Independent endpoint curves and layer jets disagree. Two distinct helix events were merged by a 2 mm span rule. Nonlinear parent restriction is not exact after child-basis projection. C0 alone does not explain every posterior line. |
| Axilla, groin and digit webs | Projection, soft endpoint fitting and rounding lose source neck constraints. Raw hand widths around 0.001–0.006 mm become 2.27–2.97 mm, axilla widths 0.008/0.041 mm become 4.95/4.85 mm, and pelvic width 1.73 mm becomes 10.03 mm. Preserve observed widths without treating an invented closing chord as observed skin. |
| Buttock ripples | A contact-wide cutoff propagates oscillation through trunk stations 805–815 mm. Actual vertices follow those sections; mesh normal differences contribute but are not the sole cause. |
| Eyes and brows | Globe/lid stature scaling differs. Uniform-index brow interpolation reverses its physical distance by about 0.96 mm and crowds medial roots. |
| Lid teeth and folds | Defects remain in clay and raking light. Band slopes differ from the kept skin triangle; averaged depth and finite secants are not the actual edge jet. |
| Nostril facets | Snapping clipped points off triangle edges can invert kept triangles. Extruded walls and a flat floor fan have discontinuous joins. Pocket interior closure is a convention, not recovered anatomy. |
| Crown patch and facial colour | Cavity tint lacks an axial upper bound, darkening crown vertices about 173 mm from an 8.68 mm pocket. A single elliptical lip field also misses lateral lip borders. |
| Oral ripples | Synthetic straight slit closures are fitted as skin. At station 1526 the central source arc is inside the mouth, not observed external lip skin. Source commissure curvature and regression ringing must be distinguished. |
| Long little-finger tips | A collapsed terminal selects a nearby critical point without source graph lineage. Rounding also damages very short terminal spans. |
| Nail separation | All 20 plates have lifted upper surfaces without cuticle/lateral joining geometry. Boundary distances are about 0.31–0.57 mm. The intended 0.45 mm thickness is not itself the defect; the open contact structure and visible detached outline are. Reverse and degenerate triangle counts are zero. |
| Hair kinks and detached strips | Discrete contact corrections become shape authority. Direction changes and settling steps are emitted as straight card segments; maximum turn is 149.4 degrees and segment length 31 mm. More samples alone do not establish continuous contact. |

Detailed measurements and bindings remain beside the images. SkinChart distortion, global material changes, universal degenerate-triangle explanations and a supposed 180-degree hair-frame flip did not explain the broad defects.

## Rejected implementation

Activating a required transition schema before regenerating all 50 calibration records prevented module initialization and page capture. Unfinished code was isolated, the complete active revision restored, and fresh images opened before modeling resumed. The single live server was not terminated.

The first staged static round returned exit 2 for runtime, browser and tool configurations. The first fitting round returned exit 1 for torso, foot and head: five torso and three foot contacts rejected nearest-point correspondence, and the short head profile missed its retained top observation. Foot/head diagnostics used old torso coefficients after torso fitting failed. No replacement calibration reached the active viewer.

Further source inspection invalidated assumptions before another fitting round:

- The same arclength rule on two contours defines charts but does not prove physical correspondence across height.
- A global normal-plane graph misses retained neck source points and can follow a free auricle instead of head skin.
- A finite regular `height × phase` chart cannot cover a true height critical point. It needs another local chart, not stronger normal-jet constraints.
- Exact parent restriction at one end and an independently projected opposite endpoint can amplify residuals by inverse span length and its square.
- Schur numerical rank depends on objective conditioning and cannot alone classify original source equality feasibility or compression capacity. The sparse helper was never executed; this is a design finding, not an observed solver failure.
- Raw coefficient equalities need not constrain the final surface when runtime overrides replace that evaluator. Some G2 conditions are nonlinear in the unknown first jets.

The incomplete boundary/family hierarchy, replacement fitters, inferred oral patch and sparse-solver expansion are not a trustworthy starting implementation. Preserve their counterexamples and requirements rather than accumulated patches.

Nine ignored local fitters modified during the abandoned work were removed from their executable location and retained only for provenance under `packages/playground/.shots/handoff/rejected-local-fitters/`. Other acquisition tools and all canonical reference data remain in place. Do not assume the old local fitting commands are ready to run.

The rejected staging tree and its accidentally copied dependencies were physically deleted after removing every junction into the workspace. No staged geometry, replacement solver or scratch audit entrypoint remains active. The final cleanup passed the playground build, Evidence and whitespace checks. The eleven final PNGs retain fresh capture receipts from `2026-10-23T17:29:37.327Z` through `17:29:59.899Z`. An initial invalid diagram request mixed sections and axes and correctly failed; the two supported requests were then captured separately. This verifies retained inspection behavior, not anatomical acceptance or independent parameter responses.

## Next session's starting conditions

1. Classify all joins from source evidence: regular loft boundary, true critical event, opening, crease or inferred closure. Bind graph node/edge, raw span address, orientation and one-sided support before fitting.
2. Keep regular loft regions and use a regular local parametric chart for critical bands. Share actual curve and derivative authorities; do not force finite height derivatives through a saddle or extremum.
3. Keep observed and inferred domains separate. Synthetic chords and missing oral skin are not observed targets. Point correspondence, transverse transition, G0/G1/G2, mesh incidence and embedding are separate obligations.
4. Use one actual evaluator for skin, construction, diagnostics and attachments. Solve constraints on that evaluator, with sufficient degree and degrees of freedom.
5. Reuse existing engine mathematics within its premises. Hermite/Gregory supplies rational first partials, not automatic G2 or topology; the parametric atlas and canonical boundaries supply transport, not geometric qualification. Existing Clarabel can express least-squares through residual variables without a new bridge. These are researched candidates, not validated replacements.
6. Finish a complete evidence round and freeze common contracts before regional implementation. Then fit and render the complete affected population together. Source edits, compilation, HTTP 200 and numerical fit are not visual completion.

Correspondence, branching and fitting are distinguished by [Meyers, Skinner and Sloan](https://graphicsinterface.org/wp-content/uploads/gi1991-32.pdf). Boundary ribbons and parameter constraints are covered by [Várady, Salvi and Vaitkus](https://doi.org/10.1016/j.cagd.2024.102286). [LAPACK DGGLSE](https://www.netlib.org/lapack/lapack_routine/dgglse.f) states its rank premises and near-singular accuracy limitations.

## Operation and deferred scope

Keep the existing single service at `http://127.0.0.1:5173`. Do not create a second viewer or kill a live host for a model failure. Modeling and its audit stop at the user's stop request; the service remains available. If modeling is authorized again, use the requested f1-only front/side/top/back underwear-off audit every 15 minutes, opening exact local PNGs without embedding them unless requested. The next session works alone.

The current 2D diagram supports sections and axes; the abandoned pocket/guide diagram extension is not delivered. Pose deformation remains under [#2947](https://github.com/samchon/automovie/issues/2947); mouth interior, tongue and visemes remain deferred under [#2971](https://github.com/samchon/automovie/issues/2971). Human and Human-viewer tests remain prohibited, including renamed substitutes. No independent parameter-change, interaction or restoration experiment was performed.
