# Jaw

Covers the articulated mandible and the jaw motion of AU26 and AU27.

## Kinematics

| Quantity | Value | Population, protocol | Grade | Source |
| --- | --- | --- | --- | --- |
| Centre of rotation for full opening | 32.4 (7.4) mm below the condyle centre, 0.2 (10.8) mm posterior; range 19.8 to 44.8 mm below | 8 healthy adults, optical tracking registered to CT, Reuleaux method | measured | `../sources/mehl-2025-jaw-centre-of-rotation.md` |
| Condylar translation per rotation | 5.51 (1.05) mm per 10 degrees, near linear over the whole opening | same | measured | Mehl 2025 |
| Early opening | first 10 mm of incisal opening is about 7 degrees, with at least 3 mm of condylar translation; no pure rotation | same | measured | Mehl 2025 |
| Motion of the fitted centre | under 4 mm over the opening cycle | same | measured | Mehl 2025 |
| Joint structure | lower condyle-disk hinge plus upper disk-eminence glide; for wide opening both act simultaneously, "around an axis which passes through the mandibular foramina"; protrusion glides in the upper joint; chewing advances one condyle while the other recedes | descriptive anatomy | conventional | `../sources/gray-1918.md` |

Gray's axis through the mandibular foramina and Mehl's measured centre about 32 mm below the condyles near the occlusal plane describe the same thing: opening is close to a rotation about a transverse axis low in the ramus. A two-phase model, pure rotation first and translation afterwards, which this research brief assumed, is not supported by Mehl's tracking; Gray also describes the two motions as simultaneous in wide opening.

### Opening model (derived)

One degree of freedom α (opening angle). The mandible rotates by α about the transverse axis through the centre C, placed at the condyle centre K plus (0, -32 mm, 0) in an occlusal-plane frame and scaled by ramus height. Equivalently the condyle point moves forward and down along the articular eminence by s = 0.551 mm per degree × α. Incisal opening is then ≈ |incisal point - C| × α in radians; with the incisal point roughly 90 to 100 mm from C (not measured here) and α in radians, 7 degrees gives about 10 to 12 mm, consistent with Mehl's 10 mm at 7 degrees.

| Range | Boys | Girls | Population, protocol | Grade | Source |
| --- | --- | --- | --- | --- | --- |
| Active maximum opening, interincisal | 50.0 (6.3) mm | 47.8 (5.7) mm | 169 Dutch children 6-18, ruler | measured | `../sources/verkouteren-2022-mandible-rom-children.md` |
| Same, model at 6 years | 45.0 mm | 42.8 mm | mixed model | population-fitted | Verkouteren 2022 |
| Same, model at 18 years | 55.3 mm | 50.5 mm | mixed model | population-fitted | Verkouteren 2022 |
| Passive maximum opening | 51.2 (6.4) mm | 49.5 (5.5) mm | examiner stretch | measured | Verkouteren 2022 |
| Protrusion (incl. overjet) | 8.7 (2.0) mm | 8.3 (2.2) mm | | measured | Verkouteren 2022 |
| Laterotrusion | 9.6 to 9.7 (1.5) mm | 9.8 (1.7) mm | dental midline reference | measured | Verkouteren 2022 |
| Laterotrusion, model at 6 and 18 | 9.2, 10.4 mm | 9.1, 10.3 mm | | population-fitted | Verkouteren 2022 |
| Overjet at rest | 3.0 (1.5) mm | 2.9 (1.3) mm | | measured | Verkouteren 2022 |
| Overbite at rest | 2.2 (1.7) mm | 2.3 (1.2) mm | | measured | Verkouteren 2022 |

### Admission (derived)

- Opening angle α in [0, α_max] with α_max set so the incisal opening equals the age- and sex-specific maximum above; passive opening allows about 1.5 mm more than active.
- Protrusion is a separate degree of freedom: both condyles glide forward on the eminence with little rotation, up to the protrusion maximum minus the resting overjet.
- Lateral excursion: one condyle advances while the other rotates in place, up to the laterotrusion maximum at the incisors.
- Combined states are bounded by the envelope of motion; no source here gives the envelope shape beyond its three extremes.

## Muscles (Gray 1918)

Elevators: masseter (superficial part from the zygomatic process of the maxilla and anterior two-thirds of the arch, fibres down and back to the angle and lower lateral ramus), medial pterygoid, anterior temporalis. Depressors: gravity, digastric, mylohyoid, geniohyoid, platysma. Protrusion: both pterygoids. Retraction: posterior temporalis and deep masseter. The masseter's bulk at the angle and the temporalis in the temporal fossa are the visible masticatory relief.

## Mandible shape and ageing

Bigonial width is in `head.md`. Ageing (`../sources/mendelson-2012-facial-skeleton-ageing.md`): mandibular angle increases, ramus height and body height and length decrease, bigonial width and ramus breadth do not change; the prejowl area becomes concave. Tooth loss accelerates jaw resorption.

## Open questions

- Adult opening, protrusion and laterotrusion norms by sex and age past 18 were not found open; Mehl's sample is eight people without a sex split.
- The articular eminence slope, which turns the condylar translation into a downward path, has no value here.
- The incisal point's distance from the rotation centre needs the mandible geometry; it is a derived check, not a parameter.
- Whether the expression document should carry the jaw angle in degrees or the incisal opening in millimetres (millimetres are what the norms bound).
