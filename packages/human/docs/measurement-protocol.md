# Human measurement protocol

This candidate relaxed model-identity protocol records the geometric meanings currently assigned to authored dimensions. It has not been accepted as a replacement for the campaign's published anatomical checks. The construction owns each address before solving its skin, and a separate reader measures the final assembled skin there. Addresses contain points, directions and named regions, never target girths, fitted ratios or solved radii. `AutoMovieHumanMeasurementProtocol` defines the typed addresses and their owner. An absent address is unestablished and produces an unavailable measurement, not a passing identity check.

## Unresolved anatomical acceptance

A target-free address and an independent section reader establish neither the address's anatomical validity nor its correspondence to a reference observation. Closing the skin at a producer-owned address answers model identity only. It cannot replace independently observed anatomy or the separately defined clinical identity check. The audit retains this acceptance gap as explicit unavailable clinical rows, even when the corresponding model rows pass.

| Published anatomical check | Current model operation | Unresolved correspondence |
| --- | --- | --- |
| Upper-arm section midway from acromion to olecranon | Midpoint from shoulder-contact arc centroid to elbow joint centre | Contact centroid and joint centre have not been established as the two anatomical landmarks |
| Knee section at mid-patella | Horizontal section at knee-joint height | Joint height has not been established as mid-patella |
| Least neck girth over its independently specified anatomical domain | Named neck-to-vault handover course at `HANDED = 0.7` | An existing normalized shape parameter does not establish the least-neck site or a clinical infrathyroid landmark |

Keep model-identity results and the original anatomical acceptance obligations separate. Preserve observed anatomical failures with their definitions, posture and provenance even when the model rows pass. Where a landmark, reference correspondence or measurement domain is unestablished, report that anatomical row as unavailable with a concrete reason and retain it as unresolved acceptance. Do not remove it, relabel it as the model operation, or count it as passed. Independent anatomical observation, definition-correct reference evidence and final-skin checks remain required before this gap can close.

## Evidence authority and availability

Every acceptance row names one authority: `model-identity` for final-skin agreement with an authored model course, `observed-anatomy` for independently visible surface properties, or `clinical-identity` for a required anatomical measurement. Its separate status is `measured` or `unavailable`. A row passes only when it is measured, finite and within its unchanged bounds. An unavailable clinical row carries a concrete reason and remains failed; a passing model row cannot discharge it. JSON encodes its non-finite value as null while preserving status and reason.

Reports group these authorities separately. The newly explicit clinical rows enlarge the recorded obligations, so their combined denominator must not be compared directly with the earlier mixed-authority baseline. Observed whole-domain waist and neck minima remain separate checks: a closed named course cannot conceal a narrower region elsewhere. All sections in each minimum comparison share one normal. Their declared model domain and 2 mm sampling pitch do not prove palpable landmark registration or a continuous extremum bound.

## Input provenance

The body controls of f1, f2, m1 and m2 originated as native authoring courses. Their saved `body-observations.json` files distinguish requested targets, native readbacks and achieved values, and record ordered course points in centimetres. `referenceControlBindings` converts spatial values to millimetres once. `observeReferenceBodyCourses` explicitly leaves clinical correspondence unestablished. For example, f1's original unpinned chest request was 800 mm, while its achieved native course and retained example value are 851.5725708007812 mm. Preserving the example value does not turn the original course into a clinically observed bust or axilla tape.

The 2026-11-02 provenance inspection retained original file SHA-256 values and the requested, applied, achieved and course-bound rows for all four references in the campaign's measurement-provenance artifact. No original reference file was modified. Their native body values are retained as authored goals in this protocol; external clinical equality remains unproved.

The hand remeasurement in commit `4f2bec009` also has a material limitation. The reference skin showed no reliable styloid prominence, and the men's minimum-girth interval was flat over about 16 mm. The extractor therefore used the thinnest dorsal-palmar wrist section as a crease-like stylion proxy. The model uses its owned wrist-crease centre explicitly, without claiming to recover a palpable radial styloid. Hand length and palm length are read on the neutral, straightened hand. Closing a bent bind-pose projection alone does not establish those neutral measurements.

## Owned sites

All body addresses below describe the generated bind pose in world millimetres, forward +X, up +Y and anatomical left +Z. Their basis is a model convention. A section tape is the perimeter of the convex hull of the independently emitted skin section. A surface course is a different operation and retains its three-dimensional length.

| Goal | Geometric owner and address | Independent reading |
| --- | --- | --- |
| Chest | Trunk's bust-apex guide inside its declared thoracic construction | Taut section at that address; an abdominal bulge cannot select its height |
| Underbust | Trunk's lower-bust feature address | Taut section there, separate from the chest target |
| Waist | Trunk's owned model-waist guide | Taut section there; natural waist and ANSUR omphalion are distinct external protocols |
| Hip | Trunk's posterior-crest guide | Taut section there, retaining separate surface-health inspection of the buttocks |
| High hip | Midpoint of the owned hip and waist section addresses | Taut section there |
| Neck | Head/neck construction's owned neck-tube section | Taut section there; an inferred global curvature maximum is not a clinical infrathyroid landmark |
| Neck base | Trunk/neck assembly's four owned front, left, back and right contacts | A radial surface course through their axial heights, including non-planar travel |
| Upper arm | Midpoint between the owned shoulder-contact arc centre and elbow centre, square to the upper-arm axis | Taut assembled section, including parent triangles across a shared boundary |
| Elbow | Arm's owned joint section | Taut section in its declared plane; joint centre is not relabelled olecranon |
| Forearm | Entire owned muscle region, from the generated elbow-turn exit to the wrist transition | Maximum taut section there, plus a separate full forearm profile health check |
| Wrist | Arm/hand's shared crease section and its owned normal | Taut section there; no 1.5 mm animation-origin substitution |
| Thigh | Leg's declared upper-thigh region below its crotch root | Maximum horizontal taut section there; the region's model premise remains explicit |
| Knee | Leg's owned joint-height section | Horizontal taut section there, without a clinical mid-patella claim |
| Calf | Entire shank muscle region between the ankle handover and knee-frame transition | Maximum horizontal taut section there, plus a separate full shank profile health check |
| Hand length and palm length | Hand's owned crease origin, digit axis and shared-web geometry | Neutral skin projection to digit III tip and its first separation from both neighbours |
| Hand breadth and circumference | Plane through the owned second and fifth metacarpal-head guides | Actual neutral skin breadth across those guides and taut section perimeter |
| Thumb length | Owned thumb MCP-crease origin and thumb axis | Actual neutral skin tip projection |

A muscle maximum excludes only a transition that the geometry itself owns. An elbow or knee bony expansion can exceed the forearm or calf goal without making the goals inconsistent. A private percentage window chosen to hide a larger muscle belly is not such a boundary. Independent fixtures move the belly through its declared domain, and the full limb profile still checks extra turns outside that domain.

The neck-base course uses the declared axis and forward direction to define its polar frame. A periodic Catmull-Rom interpolation carries the four contact heights, and rays from that axis locate the actual final skin. The reader measures the resulting closed three-dimensional polyline. It does not measure the stored contacts' radial distances, clip shoulder width, or replace a non-planar course by a planar hull. This is a reproducible model surface course; equality to an ISO chainette or an ANSUR clinical tape has not been established.

## Independent checks and limits

Identity tolerances retain the campaign's existing millimetre limits: 9 mm for large girths, 4 mm for small girths, 1 mm for head and hand dimensions, and 2 mm for foot dimensions. ISO 20685-1 Table 4 motivated those engineering acceptance limits. Applying the limits here does not certify clinical protocol equivalence. They must not be enlarged to absorb a misplaced site or a construction error.

The owned-domain maximum reader samples the complete interval at a pitch no greater than 2 mm and includes its exact ends. This is a numerical sampling limit, not a proven continuous maximum bound. Sharp unsampled peaks remain the responsibility of the independent surface-health checks and visual inspection. The synthetic maximum fixtures use smooth bellies whose sampling deficit is independently bounded within their 0.1 mm test allowance.

The wrist transition publishes one complete family of physical section frames, including its exact crease. Both least girth and thumb-side support use that family; comparing the crease's tilted tape with a forearm-axis tape can otherwise make a sound skew tube appear swollen. Frame origins interpolate linearly and normal directions follow their shortest spherical arc, with thumb-side directions projected into each plane. Intermediate pitch is at most 1 mm and every owned knot remains eligible. The minimum covers the complete owned domain; the thumb-side health observation retains the original engineering centre range of -40 to +10 mm from the crease and its 10 mm chord, now under these consistent frames. That local criterion is not extended to normal thumb emergence at the knuckles. Missing sections, zero-length frame intervals and an unobservable support chord remain unavailable. The independently prescribed skew-circle fixture distinguishes the former mixed-plane false excess from a real support bump. These are model and observed-surface checks, with clinical radial-stylion requirements retained separately.

The visible eyelid margin has its own geometric owner. Fissure length reads the junctions of the actual `AutoMovieHumanEyelid` contact margins, and height reads their intersections with the globe's pupil plane. The recessed trim loop is an assembly boundary and cannot answer those dimensions. Analytic 32 by 10 mm and 24 by 8 mm margins, a wrong 23.3 mm boundary, and a rotated local frame distinguish these readings independently of a generated person's head ratios. The reader observes the consumer's evaluated margin; attachment to the skin mesh and seam health still require their independent surface and viewer checks.

The [FaceBase primary landmark notes](https://trackhub.facebase.org/resources/human/facial_norms/notes/) distinguish vermilion-border midpoints from anterior lip prominence, nasion from the deeper sellion, and the ala's lateral extremum from its attachment groove. They locate gnathion where the chin turns toward its underside. The previous lip-prominence reader did not establish the colour-border definition. The independent replacement carries the actual appearance consumer's prepared border from the same single calibration, intersects it with the median plane, and reads final skin at those crossing heights. Its synthetic fixture moves bulge prominence, colour border and final skin depth independently. Deepest-root, alar-groove and diagonal-chin-support heuristics still do not establish their clinical definitions. Solving a declared Farkas dimension against such a substitute can distort the real feature. These remain explicit head-oracle defects for the combined head correction; the model-reader fixtures do not validate them.

The fixture round also separates a larger abdominal bulge from a fixed chest address, moves a muscle belly to 7%, 30% and 65% of its domain, displaces a crease away from an independently marked wrist, changes the skin radius while keeping neck contact guides fixed, checks a non-planar four-contact course, and applies a rigid rotation with 2x scale. Unavailable addresses and missing skin remain non-finite failures. These proofs test numerical readers at prescribed model addresses; they establish neither those addresses' anatomical validity nor a generated person's anatomical or visual acceptance.

## External definitions remain distinct

ANSUR II's handbook NATICK/TR-11/017 defines chest point, infrathyroid, cervicale and suprasternale through distinct procedures, including palpable landmarks. Its biceps and forearm circumferences use a flexed, contracted posture. ISO 8559-1's relaxed upper-arm, elbow and wrist procedures use their own postures. Neither protocol supplies the old relaxed-forearm 10–60% search window. de Leva 1996 Table 2 gives estimated population-mean joint offsets, not an individual's full three-dimensional acromion or stylion. The proposed model addresses above do not substitute for those observations or discharge their acceptance checks.
