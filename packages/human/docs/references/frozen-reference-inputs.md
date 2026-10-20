# Frozen reference input ledger

The four reference meshes seed representation research. They do not establish Human's anatomical equations, clinical correspondence, population coverage or completed appearance.

## Authoring inputs

The existing f20-model and m20-model identities have female and male design roles; their names do not certify age. Their historical body inputs, including height, were not recorded. Their face-only revision preserved body geometry and did not enter a height or body setting. All saved body constraints are inactive, so their readback values cannot recover the original requested inputs.

The additional f-adult-160 and m-adult-173 plans record female and male design targets and fictional ages 21 and 22. Youthful rounded faces, Northeast Asian impressions and model-like bodies are appearance requests, not verified age, ancestry, adiposity or aesthetic completion. Neither additional identity is a qualified low-fat muscular calibration body.

Requested source controls are below. Height, Chest, Waist and Hip use centimetres; the other controls are unitless source semantics.

| Source control | f20-model | m20-model | f-adult-160 | m-adult-173 |
| --- | --- | --- | --- | --- |
| Height | unrecorded | unrecorded | 160 | 173 |
| Chest | unrecorded | unrecorded | 83 | 91 |
| Waist | unrecorded | unrecorded | 64 | 73 |
| Hip | unrecorded | unrecorded | 88 | 91 |
| Fat | unrecorded | unrecorded | -1.05 | -0.65 |
| Muscularity | unrecorded | unrecorded | -0.35 | -0.25 |
| Masculine/Feminine | unrecorded | unrecorded | 0.6 | -0.85 |

The two additional bodies retain these seven active targets. The female Hip readback is 87.99999237060547 cm, distinct from its requested 88 cm. Fat is not body-fat percentage, Muscularity is not lean mass, and Masculine/Feminine is not a clinical sex measurement. Mass in kilograms, BMI, clinical body-fat percentage, actual clinical circumferences and sitting height are unrecorded; no estimate is supplied here.

The existing pair's face-only request moved nine source API controls; the requested offsets and saved readback remain in the private authoring ledger. Numeric control indices are not Human parameters or clinical landmarks. The additional female's final revision applied a smooth native-template field with cheek-width fraction 0.08, lower-jaw-width fraction 0.05, oral-to-chin height compression fraction 0.16 and chin-projection reduction 0.12 cm, holding its body fixed. These are field inputs, not guaranteed changes in clinical dimensions. Its support coordinates and source anchor stay outside Human. The additional male's final operation corrected 22 mixed patch rotations using normalized shortest-arc interpolation at a second-state weight of 0.15; it changed no body or landmark target. These operations are historical source authoring, not shared anatomical rules.

## Frozen geometry and registration

Each complete input contains 64,300 vertices and 124,910 triangles from the exported head and body, including eyes, lashes/cards and oral components; separate grooms are absent. Source normals were not preserved. A flat-shaded reference display therefore does not establish the source renderer's shading.

Registration converts native centimetres once by [X,Y,Z] -> 10*[X,Z,Y] mm. Positive X is subject-left, positive Y is up and positive Z is front. The odd axis permutation reverses triangle winding. The native root is retained, postscale is one and floor shift is zero. This converts axes and units; it leaves the native neutral A-pose unchanged. It does not establish a Frankfurt head plane or Human's straight-joint T-pose.

The exact frozen vertex extrema below are geometric observations in millimetres. The saved Height readback has its own source protocol and is shown separately.

| Subject | Minimum Y | Maximum Y | Vertical extent | Native Height readback x10 |
| --- | --- | --- | --- | --- |
| f20-model | -3.294731378555298 | 1735.8120727539062 | 1739.1068041324615 | 1732.0698547363281 (inactive) |
| m20-model | -0.8734601736068726 | 1858.1021118164062 | 1858.9755719900131 | 1856.2432861328125 (inactive) |
| f-adult-160 | -0.5983778089284897 | 1599.9839782714844 | 1600.5823560804129 | 1600 (active) |
| m-adult-173 | -2.7906882762908936 | 1734.2025756835938 | 1736.9932639598846 | 1730 (active) |

A bbox extent uses every exported component's extrema. The native Height definition measures between configured source vertices. Human's stature uses its declared measurement posture and standing surface. These quantities differ in protocol; their difference is not a clinical stature error. Negative minimum Y is preserved rather than silently floor-shifted.

## Correspondence and scope

Rig joint centres, source API controls, extrema and clinical surface landmarks remain distinct observations. Final API arrays contain 85, 79, 90 and 84 points in the table's subject order. Equal numeric indices do not establish shared anatomical meaning. The historical nearest-vertex correspondence record uses older V3 geometry for the two additional identities, so it does not qualify their frozen V5C/V4 correspondence. A zero nearest-vertex residual proves contact with the recorded version's mesh, not clinical identity.

A geometric section records its physical plane, component selection, contour identity and orientation. It becomes an anatomical measurement only after its landmark, posture and tissue or tape protocol are established. Multiple loops, cavities and contacts are separate observations. Skin arclength and convex-tape perimeter are separate observations. An A-pose cut cannot silently become a T-pose or clinical cut.

All four identities have already been exposed to fitting. More sections add geometric observations, not independent people. Leave-one-identity-out analysis probes seed sensitivity; it does not create an untouched identity reserve. The earlier research's muscular reference set and ratios do not describe this fixed four-person set.

## Provenance

The private frozen manifest is .references/northeast-asian-pair-20261018/frozen-core-four/manifest.json, SHA-256 `2049efb22deb83d0c2201577ec24525e5788b0d0c562e8df6687c6beb15eaa0b`. Exact input hashes and versions are:

| Subject | Version | Display-mm SHA-256 |
| --- | --- | --- |
| f20-model | existing-four-face-v1 | `660af3378dbd50d05af311e83e26a64c008a1d0e987daffdf938cdb1eefb2332` |
| m20-model | existing-four-face-v1 | `be41021bf919a5843aff899854154d003499277416134ac84fc84264aa440ca1` |
| f-adult-160 | template-variant-proportion-v5c | `25666932385861a796fc20f4ff0cc3d02927f226111188d1c7f7ced2c58d8d2d` |
| m-adult-173 | male-schema-corrected-v4 | `74c9639d0d3bbf29789c952c4dd2298e18c4a2556a9b85501422dc782712b6bc` |

Requested body controls and fictional context come from author-plan-v2.json. Existing-pair body preservation and requested facial offsets come from existing-four-face-v1/manifest.json. The female field comes from template-variant-proportion-v5c/manifest.json and template_field_v5.py; the male correction comes from male-schema-corrected-v4/manifest.json and SERIALIZED-FACE-STATE-ERRATUM.md. CURRENT-ORIGINAL-CONTRACT.md records their unresolved appearance. prepare_display.py defines registration, and unit-provenance-private.json records the source Height protocol. These are private files beneath the same reference directory; they are observations, not runtime dependencies.

A read-only identity check recomputed all four display and eight raw-part hashes, every native-to-mm position, and each offset/reversed triangle. Hashes matched, maximum position conversion residual was 0 mm, and triangles agreed exactly. This verifies frozen bytes and registration; it does not verify anatomy or appearance.
