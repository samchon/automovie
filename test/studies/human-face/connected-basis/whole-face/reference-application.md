# Reference application across the face

This records the integrated implementation, not a claim that every investigated algorithm or licensed asset is included. The research history is [#2513](https://github.com/samchon/automovie/issues/2513). Body work remains the separately requested [#2512](https://github.com/samchon/automovie/issues/2512).

## Source-backed principles

[MetaHuman neutral-pose guidance](https://dev.epicgames.com/documentation/metahuman/neutral-pose) treats the neutral skin, eyes, lids, lips and internal mouth as a coupled assembly. [Expression editing](https://dev.epicgames.com/documentation/metahuman/expression-poses) and [expression tiers](https://dev.epicgames.com/documentation/metahuman/expressions-by-tier) require reviewing intermediate and dependent poses. [Rig operation](https://dev.epicgames.com/documentation/metahuman/metahuman-dna-rig-definition-and-rig-operation) separates large joint/skinning motion from detail displacement. The studied OpenRigLogic revision is `7b9e7a88898f51f29aa308acb4877276f27e1507`; its runtime arithmetic does not include the Creator's anatomical shape database.

The selected CC0 MPFB geometry supplies the connected neutral and authored endpoint data. Preparation freezes subdivision and clipping correspondence. Runtime separates immutable geometry, shape, performance and appearance, evaluates all attached surfaces with the same ordered controls, and computes normals before material separation. These are actual paths through the editor worker and exporter, not proposed unconsumed APIs.

## Whole-face application inventory

| Research domain | Implemented application and explicit boundary |
| --- | --- |
| Neutral basis | One version-bound connected head and five attached assets; exact neutral recovery on every surface. |
| Cranium, jaw and neck | Signed regional endpoints share the skin topology, including posterior skull, temple, chin and neck. |
| Global and local controls | Global scale and regional volume/position controls coexist in the same compact document. |
| Sides and units | Left/right controls remain distinct; positions are metres and endpoint weights are dimensionless. |
| Globe and optical surface | Original CC0 eye asset follows shape refit and expression endpoints; this is not a clinical corneal fit. |
| Lid tissue and folds | Source-connected eyelid geometry plus side-specific height, fold and soft-tissue controls. |
| Blink and gaze | Original paired gaze/blink performance channels act on skin and transferred eye/lash data; physiological combination correctives are not inferred. |
| Orbit and cheek | Independent cheekbone, inner cheek, volume and eye-position changes operate on the same surface. |
| Nasal envelope | Global and upper/middle/lower width, bridge and tip targets replace an independent-component seam in this selected prior. |
| Nasal base | Connected nostril, flare, angle, septum and base controls; no claim of clinically measured internal airway geometry. |
| Lip identity | Separate upper/lower volume, width and height plus philtrum, with a shared skin/vermilion normal field. |
| Oral performance | Smile, pucker, opening and asymmetry retain surrounding cheek and attached interior targets. |
| Jaw movement | Source-authored jaw channels are usable; endpoint interpolation is not substituted for a verified rigid joint mechanism. |
| Dentition | Official upper/lower dental geometry and transferred performance data remain resident. Individual tooth morphology is not newly parameterized here. |
| Oral pocket and tongue | Source inner surfaces and tongue follow the same document. Full opening remains an observed shape to inspect, not an assumed anatomical success. |
| Ears | Bilateral scale, height, depth, lobe, wing, flap and rotation keep temporal attachment in the shared skin. |
| Skin and subdivision | One subdivided skin surface and frozen clip stencils precede endpoint extraction and runtime normal reconstruction. |
| Contact and validity | Numerical, topology and export admission remain active. They do not prove continuous collision freedom. Existing procedural contact work remains preserved. |
| Aging and appearance | Source age-structure and under-eye/neck tissue targets are separate from resident material edits; no arbitrary blemish fitting. |
| Hair, brows and lashes | Official brows/lashes are refitted and receive performance data. This prior has no scalp groom; the existing procedural hair path remains separate. |
| Combination mathematics | Ordered sparse sums are deterministic. The researched PSD/RBF algorithms need valid corrective data; no fabricated correction is presented as anatomical knowledge. |
| Detail and performance | Fixed subdivision/correspondence is prepared once per compiled builder. This is not a multi-LOD rig implementation. |
| Numerical reproducibility | Old controls and neutral arrays remain exact; Float64 evaluation precedes the existing Float32 export checks. |
| Editing and interchange | Actual worker, last-valid publication, history, compact JSON and GLB share the established editor/export owners. |

## Verification population

The integrated numerical run covers neutral, twelve region families at both signs, intermediate/full jaw and blink, half smile, pucker, gaze/cheek and asymmetric/combined oral performance: 34 states total. All built and exported successfully; this establishes evaluated-buffer/export admission for those states. The capture run retained nine directions/material modes per state on the real GPU. The final direct visual inspection is intentionally smaller under the user's instruction to minimize repeated render comparisons, and must be reported by its actual viewed population.

No universal anatomical or input-person likeness acceptance follows from the number of controls, successful serialization or capture count. The remaining boundaries above are retained so a consumer can distinguish applied reference principles from capabilities the reference system has but this implementation does not.
