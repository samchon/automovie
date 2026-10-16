# Expression

Covers the research begun for #2802, now continued by [#2845](https://github.com/samchon/automovie/issues/2845): FACS action units as muscle-driven deformation of the generated face, combinations, visemes, and return to neutral. Human currently admits expression documents and returns neutral; the study below is not emitted articulation.

## Action units and their muscles

AU numbers, names and muscular basis are the FACS coding as given by `../sources/wikipedia-facs.md` (the FACS manual itself was not read). Bony and skin attachments and the stated actions are from Gray 1918 (`../sources/gray-1918.md`). Grade: conventional (coding standard and descriptive anatomy). The movement column restates Gray's stated actions; where Gray is silent it states only the direction implied by the attachments.

| AU | Name | Muscle | Pull from (fixed) toward | Visible movement |
| --- | --- | --- | --- | --- |
| 1 | Inner brow raiser | Frontalis, medial part | Galea above; no bony origin | Medial brow up, central forehead wrinkles |
| 2 | Outer brow raiser | Frontalis, lateral part | Galea above | Lateral brow up |
| 4 | Brow lowerer | Corrugator, depressor supercilii, depressor glabellae (Gray describes corrugator and procerus) | Corrugator from the medial superciliary arch; procerus from the nasal bone | Brows down and together; vertical glabellar lines (corrugator), transverse lines over the nasal root (procerus) |
| 5 | Upper lid raiser | Levator palpebrae superioris, superior tarsal muscle | Orbit apex | Upper lid up, exposing the front of the globe |
| 6 | Cheek raiser | Orbicularis oculi, orbital part | Medial orbital rim and medial palpebral ligament | Cheek and lower-lid skin drawn up and toward the medial angle; crow's feet radiating from the lateral angle |
| 7 | Lid tightener | Orbicularis oculi, palpebral part | Medial palpebral ligament to lateral raphe | Lids close gently, narrowing the fissure |
| 9 | Nose wrinkler | Levator labii superioris alaeque nasi | Upper frontal process of maxilla | Ala and upper lip up, wrinkles on the nasal dorsum |
| 10 | Upper lip raiser | Levator labii superioris | Infraorbital margin | Upper lip up, a little forward; deepens the upper nasolabial furrow |
| 11 | Nasolabial deepener | Zygomaticus minor | Malar surface of the zygoma | Upper lip lateral part up; nasolabial furrow deepens |
| 12 | Lip corner puller | Zygomaticus major | Zygoma in front of the zygomaticotemporal suture | Mouth corner backward and upward |
| 13 | Sharp lip puller | Levator anguli oris (caninus) | Canine fossa below the infraorbital foramen | Mouth corner raised |
| 14 | Dimpler | Buccinator | Alveolar processes over the molars, pterygomandibular raphe | Cheeks compressed against the teeth, corner drawn in |
| 15 | Lip corner depressor | Depressor anguli oris (triangularis) | Oblique line of the mandible | Corner down |
| 16 | Lower lip depressor | Depressor labii inferioris | Oblique line between symphysis and mental foramen | Lower lip down and slightly lateral |
| 17 | Chin raiser | Mentalis | Incisive fossa of the mandible | Chin skin up and wrinkled, lower lip up and out |
| 18 | Lip pucker | Incisivus labii superioris and inferioris | Alveolar borders opposite the lateral incisors | Lips pushed forward and gathered |
| 20 | Lip stretcher | Risorius with platysma | Masseteric fascia | Corner pulled laterally, lips flatten |
| 21 | Neck tightener | Platysma | Fascia over upper chest and shoulder | Oblique neck wrinkles, lower lip and corners down |
| 22 | Lip funneler | Orbicularis oris | Sphincter | Lips funnel outward |
| 23 | Lip tightener | Orbicularis oris | Sphincter | Lips narrow and tighten |
| 24 | Lip pressor | Orbicularis oris | Sphincter | Lips pressed together |
| 25 | Lips part | Depressor labii inferioris, or relaxed mentalis or orbicularis oris | | Lips separate |
| 26 | Jaw drop | Masseter, temporalis and medial pterygoid relaxed | Mandible rotation (`jaw.md`) | Jaw lowered moderately |
| 27 | Mouth stretch | Pterygoids, digastric | Mandible rotation | Jaw opened wide |
| 28 | Lip suck | Orbicularis oris | | Lips drawn in over the teeth |
| 38 | Nostril dilator | Nasalis, alar part | Greater alar cartilage | Nostrils flare |
| 39 | Nostril compressor | Nasalis transverse part, depressor septi | Maxilla above the incisive fossa | Nostrils narrow |
| 41 | Lid droop | Levator relaxed | | Upper lid lowers |
| 43 | Eyes closed | Levator relaxed | | Lids closed |
| 45 | Blink | Levator relaxed, orbicularis oculi palpebral part | | Brief closure |
| 46 | Wink | Orbicularis oculi | | One-sided closure |

AU 19 (tongue show), 29 (jaw thrust), 30 (jaw sideways), 31 (jaw clencher, masseter), 32 to 37 (bite, cheek blow, puff, suck, tongue bulge, lip wipe) are gross behaviour codes; 51 to 58 head and 61 to 64 eye positions belong to the head pose and gaze, not to face deformation. Intensity is lettered A (trace) to E (maximum).

## Combinations

EMFACS prototypes (`../sources/wikipedia-facs.md`): happiness 6+12; sadness 1+4+15; surprise 1+2+5B+26; fear 1+2+4+5+7+20+26; anger 4+5+7+23; disgust 9+15+17; contempt R12A+R14A (right side only, trace intensity). The 6+12 rule is the anatomical reason a smile without the orbital orbicularis looks posed: AU12 alone moves only the mouth corner.

Combination rules the deformer must honour (derived from the anatomy):

- AU1 and AU2 share the frontalis sheet; AU1+2 raises the whole brow and gives full-width forehead wrinkles, AU1+4 gives the oblique "grief" brow because corrugator pulls the medial brow down and in while medial frontalis pulls it up.
- AU6 lifts the lower lid from below while AU7 tightens the lid itself; both narrow the fissure from different directions.
- AU12, 13, 14, 15, 20 and the lip parts of 10 and 16 all pull on the commissure; their vectors add at one point, which is why the corner has to be modelled as a shared node (modiolus) rather than per-muscle vertices.
- AU26 and 27 move the mandible; lips follow through the skin while teeth move rigidly with the bone.

## Measured magnitudes

| Quantity | Value | Population | Grade | Source |
| --- | --- | --- | --- | --- |
| Brow travel, maximal open to maximal close, at medial canthus / lateral limbus / lateral canthus / tail | 9.9 / 10.6 / 8.6 / 4.9 mm | Korean women 20-30 | measured | `../sources/park-2017-eyebrow-ageing.md` |
| Same | 5.8 / 6.7 / 5.0 / 2.6 mm | Korean women 50-70 | measured | Park 2017 |
| Brow at maximal frown relative to reference | 2.5 to 4.8 mm lower | young | measured | Park 2017 |
| Jaw opening | see `jaw.md` | | | |
| Blood perfusion | anger 127 percent, fear 81 percent of neutral hemoglobin (renders); expression changes repeatable, melanin constant | 4 Caucasian adults | measured | `../sources/jimenez-2010-dynamic-facial-color.md` |

Brow travel shrinks by about 40 percent with age and the brow tail moves half as far as the body: AU1 and AU2 displacement should taper toward the tail and scale down with age.

## Muscle model

Two primitives cover the facial muscles (`../sources/kumar-sharma-2019-waters-muscle.md`, restating Waters 1987, which was not read; grade: conventional graphics method):

- Linear muscle: a bone attachment point and a skin insertion; skin points inside a cone around the muscle vector and within a radius move toward the attachment, with angular and radial falloff. Use for AU1, 2, 4, 9 to 17, 20.
- Sphincter: an elliptical region with semi-axes lx and ly around centre c. For a skin point P: f = 1 - √(ly² Px² + lx² Py²) / (lx ly), g = |P - c| / lx; contraction moves P toward c by K·f·g when |P - c| > ly and not at all inside the central circle; out-of-plane bulge proportional to K(1 - f g). Use for orbicularis oculi (AU6, 7, 45, 46) and orbicularis oris (AU18, 22 to 24, 28).

For Human (derived): attachments come from the skull landmarks of `head.md` (zygoma, canine fossa, oblique line, superciliary arch, frontal process of maxilla) and insertions from the face-surface landmarks (cheilion, philtrum, brow points), so each identity's muscles follow its own geometry. The deformation must preserve the one continuous face surface and return exactly to the neutral surface at zero activation; volume preservation of the lips under the sphincter and the jaw-driven lower face are the two places where a purely kinematic pull fails.

## Visemes

The 15-viseme convention (`../sources/meta-ovrlipsync-visemes.md`): sil, PP, FF, TH, DD, kk, CH, SS, nn, RR, aa, E, I, O, U. Proposed decomposition into AUs and jaw (derived, to be judged visually):

| Viseme | Lips | Jaw | Tongue |
| --- | --- | --- | --- |
| PP (p, b, m) | 24 lip pressor | closed | rest |
| FF (f, v) | lower lip under upper incisors (28 partial on the lower lip) | slight | rest |
| TH | 25 | slight | tip between the incisors (19) |
| DD, nn (t, d, n, l) | 25 | slight | tip on the alveolar ridge |
| kk (k, g) | 25 | small | back raised |
| CH (ch, j, sh) | 18 + 22 funnel | small | blade raised |
| SS (s, z) | 20 slight + 25, teeth nearly closed | minimal | tip near the ridge |
| RR | 18 slight | small | |
| aa | 25 + 26/27 | wide | low |
| E | 20 + 25 | medium | |
| I | 20 + 25 | small | high front |
| O | 18 + 22 + 26 | medium | |
| U | 18 + 22 strong | small | high back |

## Interface fit

`IAutoMovieExpression` carries a coarse VRM-style preset (happy, angry, sad, relaxed, surprised, five vowels, blink and look) and ARKit's 52 blendshape names, and its sinks address morph targets by name. Human's `IAutoMovieHumanExpression` already owns AU activations, including jaw action units; `AutoMovieHuman.express()` admits it but returns neutral while generated targets are absent. #2845 requires conversion of anatomical articulation into exactly 52 ARKit targets, with no additional preset-named targets; gaze uses eye bones under #2842. The original alternative of adding a FACS channel set to `interface` is not the current contract.

## Open questions

- Measured displacement vectors per AU at maximum intensity (mm at named landmarks) exist only for the brow here; mouth-corner travel for AU12 has no source read.
- Wrinkle line patterns per AU (forehead, crow's feet, nasolabial) need a source for position and depth.
- Which AUs a child or an elderly face can produce at full intensity, beyond the brow travel above.
- The FACS manual's appearance changes per AU were not read; descriptions above come from Gray's stated actions.
