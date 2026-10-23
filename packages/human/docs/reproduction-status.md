# Neutral Human reproduction status

This is the open correction round for [campaign #2925](https://github.com/samchon/automovie/issues/2925), based on merged commit `6c568f1dd545e8bf82e74b766ac6d2f8e0f8a515`. It records observed defects and remaining work, not acceptance of the generated figures.

## Current implementation

`AutoMovieHuman.generate(params)` returns the public `{ parameters, model }` contract. Skin, construction and appearance are assembled in the existing Human viewer. The body currently consumes height as a uniform scale of the f1 calibration. Other body controls, head and extremity inputs do not yet change the skin. Consequently f2, m1 and m2 are not reproduced specimens.

| Specimen | Current qualification | Required next result |
| --- | --- | --- |
| f1 | Whole body integrated; correction round open | All regions, joins and assembled appearance inspected and accepted |
| f2 | f1 body scaled by stature; not reproduced | Reproduce its own observations through shared parameter rules after f1 |
| m1 | f1 body scaled by stature; not reproduced | Reproduce its own observations after f2; reinspect f1 and f2 |
| m2 | f1 body scaled by stature; not reproduced | Reproduce its own observations after m1; reinspect all preceding specimens |

## Inspection evidence

The first round retains 79 new whole-body, regional, construction and curve-diagram captures under the ignored `packages/playground/.shots/repro-r1/` directory. The source model JSON is retained there for read-only geometric measurements. These are independent generated Human images; the canonical original-model and Recovery photographs remain separate under `test/.shots/`, selected by their manifest and capture indices.

The first user audit has eight additional fresh surface images under `packages/playground/.shots/audit-001/`, captured with `garment=0` from `2026-10-23T15:30:36.369Z` through `2026-10-23T15:31:38.793Z`. Each PNG has a SHA-256-checked response and retained receipt binding its source, typed input, model, construction, camera and renderer. The copies and their local paths are not published GitHub artifacts. Images of f2, m1 and m2 show their unfinished generated bodies, not successful reproduction.

## Defects and causes

| Phenomenon | Evidence and cause status | Remaining correction or discrimination |
| --- | --- | --- |
| Head rings near 1595.5 and 1543.2 mm | Child endpoint curves are refitted approximations of exact inherited parent arcs. Measured head endpoint residuals reach approximately 0.65 mm. Back-of-head residuals are much smaller, so this alone does not explain the complete ring. | Compare endpoint jets, neighbouring layers, axes and curvature diagrams; separate geometric bending from skin normal-map effects. Use one boundary authority for skin and construction. |
| Axilla point and shallow contact line | Fresh surface, overlay and construction place the defect at the upper-to-trunk/arm contact. Parent contact sections retain narrow curvature spikes that child sections approximate differently. | Resolve shared boundary correspondence and transverse derivatives; inspect both axillae and neighbouring shoulder/trunk surfaces. |
| Groin and repeated lines under the buttocks | Fresh underwear-off back images expose repeated short ridges absent from the original photographs. Parent contact-section oscillation and child endpoint approximation are separate candidates. | Inspect posterior close-ups, original curves and section curvature before selecting the correction. Recheck the whole pelvis and both legs. |
| Globe and eyelids scale differently | Globe revolution applies fixed millimetre conversion while lids use stature scale; seating is recomputed from an already scaled radius. | Place and scale the globe from the same calibration frame as lids, tear film and lashes. Verify the existing specimen paths without expanding deferred parameter experiments. |
| Eyebrow medial pile-up | Uniform control-index interpolation reverses the distance coordinate by approximately 0.96 mm; a quarter of roots accumulate in the first short segment. | Use monotone physical distance and interpolation at the actual nonuniform stations. Inspect both brows and neighbouring eyelids. |
| Eyelid outer red triangles, lower ripples and lateral folds | Fresh front/high/low views reproduce them. Triangle inspection does not support a widespread degenerate-mesh explanation. Lid-band and kept-skin boundary slopes are independently processed. | Discriminate band geometry, neighbouring head lofts, colour and lighting before changing the shared edge and its derivatives. Inspect caruncles, conjunctiva and globe contact together. |
| Nostril rim teeth and wall spokes | Projected snapping preserves a different depth from the saved spatial margin; measured disagreement reaches approximately 0.47 mm. Extruded irregular rims and a flat fan do not share a wall/floor tangent. | Bind the actual margin, wall and floor consistently; determine whether a surviving head bridge contributes. Draw the actual aperture construction. |
| Bright nostril interior | Current floor normals face the opening and existing cavity darkening is consumed. Neither reversed cap normals nor missing colour alone explains the appearance. | Separate cap, wall and any remaining head sheet under clay and matched lighting. Internal pocket shape remains a conventional closure, not recovered internal anatomy. |
| Lip-border and philtrum/alar colour spread | A single lip profile and elliptical field define pigment; cavity darkening uses a circular reach rather than its exact aperture domain. | Align colour with generated surface features and the actual aperture domain. Distinguish normal-map artifacts from pigment boundaries. |
| Scalp patch, ear and neck surfaces hidden by hair | Hair-free isolation exposes a crown-area dark patch absent from the original photographs. Shape versus normal-map contribution is unresolved. | Inspect plain skin under raking light, all head/ear joins and scalp sections before accepting appearance. |
| Long little-finger tips | A collapsed terminal branch chooses the lowest nearby minimum without graph lineage; a neighbouring digit's critical point supplies the pole. | Select terminal critical points from the observed branch lineage and regenerate the fitter output. Preserve sufficient coordinate precision for all digit poles. |
| Remaining hands and feet | Fresh dorsal/palmar hand and upper/rear foot views are available. Gross wrist/ankle cracks were not observed in those views. Web slivers, all nail contacts, soles and every digit remain incomplete inspections. | Finish close-ups and curve comparisons, then inspect regenerated caps, nail placement, webs and neighbouring wrist/ankle skin. |

## Correction and validation sequence

1. Finish the current whole-asset evidence round, including plain skin, raking light, hidden surfaces and all neighbouring regions. Keep unresolved hypotheses distinct from measured causes.
2. Correct the identified causes together at their owning representations. Runtime skin, construction, appearances and diagnostics must consume the same curves and boundaries. Regenerate calibration through its fitters rather than hand-editing coefficient literals.
3. Repeat the original conditions across every affected view and region; inspect the assembled f1 before accepting it. Any new or unexplained defect keeps the round open.
4. Reproduce f2, then m1, then m2 through identifiable shared equations in the typed inputs. Bind observed course definitions, axes, sections and guides. Person-indexed coefficients, alias branches, source-mesh fallback and arbitrary coordinate corrections are excluded.
5. Reinspect every already accepted specimen after a shared correction. Four specimens do not identify 28 independent parameter effects or establish prediction of unobserved shapes.
6. Run the applicable type, static and Evidence checks with actual exit codes, then whole-change self-review and exact-head CI. Human and Human-viewer tests are prohibited, including relocated substitutes.

## Scope and delivery

The single existing service on `127.0.0.1:5173` remains the viewer and capture host. One execution owner controls compilation, fitting and GPU capture while regional contributors inspect and implement disjoint responsibilities. During delegated modeling, inspect and send eight fresh underwear-off front/back images every 15 minutes, retaining the exact local bytes and provenance.

The public pose schema and stickman preview remain separate from skin rigging and deformation, tracked by [#2947](https://github.com/samchon/automovie/issues/2947). Mouth interior, tongue and viseme articulation remain deferred under the existing [#2971](https://github.com/samchon/automovie/issues/2971). Independent parameter changes, interactions and restoration experiments remain deferred. Recalled joint-range sources need protocol-qualified documentation; their values must not be promoted to measured anatomical limits by citation alone.

This work is delivered through topic-specific draft pull requests. A draft, successful fit, compilation or image response is not visual completion. Final merging requires complete review and green checks on the final commit.
