# Eye

Covers the eye module of #2799 (globe, cornea, iris, lids, canthi, fold, socket transition), the lash and brow attachment lines used by #2801, and the lid and brow motions of #2802.

## Globe and cornea

| Quantity | Value | Population, protocol | Grade | Source |
| --- | --- | --- | --- | --- |
| Globe transverse diameter | 24.2 mm (SD 1.9), range 21 to 27 | 250 adults, Israel, CT | measured | `../sources/bekerman-2014-eyeball.md` |
| Globe vertical diameter | 23.7 to 23.8 mm (SD 1.6) | same | measured | Bekerman 2014 |
| Globe axial length | 23.4 (emmetropic), 24.5 (myopic), 22.3 (hypermetropic) mm | same | measured | Bekerman 2014 |
| Axial length, older adults | 23.48 mm; men 23.68, women 23.23 | 1,015 eyes, Guangzhou, 50+, IOLMaster | measured | `../sources/chen-2016-ocular-biometry-guangzhou.md` |
| Anterior chamber depth | 3.03 mm; men 3.13, women 2.95 | same | measured | Chen 2016 |
| Corneal radius | 7.64 mm; men 7.70, women 7.58 | from keratometry 44.20 D by r = 337.5 / K | derived | Chen 2016 |
| Iris diameter (limbus to limbus) | Caucasian 12.11 (M), 11.83 (F); Chinese 11.55 (M), 11.44 (F) mm | 147 young adults, Cologne, 3D photographs | measured | `../sources/gao-2025-periocular-chinese-caucasian.md` |
| Corneal apex in front of the lateral orbital rim | adults 15.7 (1.8) mm; age 10, 13.7; elderly 15.3 | 2,010 Han Chinese, Hertel | measured | `../sources/wu-2015-hertel-chinese.md` |
| Orbital margin | height 41 to 43 mm, width 35 to 36 mm, depth 48 mm | CT, as above | measured | Bekerman 2014 |

Construction (derived): the globe is a slightly oblate ellipsoid of about 24.2 × 23.7 × 23.4 mm, sex- and age-independent in adults. The cornea is a spherical cap of radius 7.6 to 7.7 mm whose base circle is the limbus (diameter = iris diameter about 11.4 to 12.1 mm). Cap height h = r - √(r² - (d/2)²) gives about 2.8 mm for r 7.64 mm and d 11.8 mm, close to the 3 mm anterior chamber depth that places the iris plane behind the corneal apex. The corneal bulge is what moves the upper lid as the eye looks around; it must be geometry in the eyeball mesh, not a texture. The globe's forward position comes from the Hertel value relative to the lateral orbital rim.

Globe size barely varies with face size (transverse 21 to 27 mm across all adults; no sex or age effect), so a small face reads as having large eyes. Children's globes were not covered by the sources read.

## Palpebral fissure, canthi and fold

| Quantity | Caucasian M | Caucasian F | Chinese M | Chinese F | Source, grade |
| --- | --- | --- | --- | --- | --- |
| Fissure width en-ex | 31.15 (1.96) | 29.69 (1.63) | 30.24 (1.96) | 28.63 (1.87) | Gao 2025, measured |
| Fissure height at the pupil | 11.61 (1.02) | 11.63 (1.04) | 10.73 (1.17) | 11.52 (1.08) | Gao 2025 |
| Upper margin arc length | 41.04 | 39.36 | 39.96 | 38.65 | Gao 2025 |
| Lower margin arc length | 34.87 | 33.16 | 33.23 | 31.63 | Gao 2025 |
| Medial canthal angle (degrees) | 39.1 | 40.8 | 39.1 | 44.2 | Gao 2025 |
| Lateral canthal angle (degrees) | 36.2 | 38.2 | 32.2 | 36.2 | Gao 2025 |
| Canthal tilt, ex above en (degrees) | 0.8 | 2.4 | 4.9 | 6.0 | Gao 2025, derived as 180 - CT_2D |
| Intercanthal en-en | 32.12 | 30.35 | 37.28 | 36.06 | Gao 2025 |
| Fold to lid margin, at the pupil | 3.35 | 3.39 | 1.54 | 2.97 | Gao 2025 |
| Fold to lid margin, medial | 4.64 | 4.37 | 1.55 | 2.68 | Gao 2025 |
| Fold to lid margin, lateral | 4.93 | 4.74 | 3.14 | 4.12 | Gao 2025 |

Other populations, en-ex and en-en (mm): US European ancestry 28.8 / 32.7 (men), 27.8 / 31.3 (women), 3D (`../sources/weinberg-2016-3d-facial-norms.md`); Kenyan 34.0 / 32.2 (men), 33.7 / 32.1 (women), caliper (`../sources/virdi-2019-kenyan-face.md`); Nigerian en-en 35.2 both sexes, 3D (`../sources/adekunle-2022-nigerian-3d.md`); South African women en-en 34.7, canthal tilt 6.8 degrees (SD 2.7) against the perpendicular to the midline (`../sources/wilson-2023-south-african-women.md`). Intercanthal width over fissure width is about 1.13 in the European-ancestry 3D norms, 0.95 in Kenyans and 1.23 to 1.26 in Gao's Chinese group: the "one eye between the eyes" canon holds only for some populations.

Growth (3DFN, M / F): en-en 27.9 / 28.2 at 3-4 and 32.7 / 31.3 adult; ex-ex 74.3 / 73.0 to 88.9 / 85.4; fissure length 23.8 to 24.2 at 3-4 against about 28 to 29 adult. The intercanthal width is 85 to 90 percent of adult size at 3-4 years.

Fold: the measures above are the visible pretarsal show between the lid crease (fold) and the lid margin with the eye open. A fold distance under 2 mm medially, as in Chinese men (1.55 mm), means the fold nearly meets the margin at the inner corner, the low or hooded fold; the lateral show is larger in every group. No source read gives the epicanthic fold's prevalence or geometry; Gao's larger Chinese intercanthal width and medial fold behaviour are its measurable traces.

## Lid structure

- Tarsi (Gray 1918, conventional): the upper tarsus is semilunar, about 10 mm high at the centre, narrowing toward the ends; the lower is elliptical, about 5 mm high; both ciliary margins are thick and straight; lateral ends tie to the zygomatic bone by the lateral palpebral raphe, medial ends to the maxilla by the medial palpebral ligament (about 4 by 2 mm). The rigid tarsus is why the lid margin keeps its arc while the lid slides over the cornea.
- Commissures: the lateral is more acute and lies close to the globe; the medial is drawn toward the nose around the triangular lacus lacrimalis (caruncle region).
- Orbicularis oculi palpebral part closes gently (blink), orbital part squeezes and draws skin toward the medial angle; levator palpebrae raises the upper lid (`../sources/gray-1918.md`).

## Lashes

| Quantity | Value | Grade | Source |
| --- | --- | --- | --- |
| Upper lashes | 90 to 160 in five to six rows | measured (relayed) | `../sources/aumond-2018-eyelash.md` |
| Lower lashes | 75 to 80 in three to four rows | measured (relayed) | Aumond 2018 |
| Length | rarely over 12 mm | measured (relayed) | Aumond 2018 |
| Curvature | every lash curved from the bulb, any ethnicity | measured (relayed) | Aumond 2018 |
| Direction | upper lashes curve upward, lower downward, so they do not interlace when the lids close | conventional | Gray 1918 |

## Brow

| Quantity | Value | Population | Grade | Source |
| --- | --- | --- | --- | --- |
| Upper brow margin above the intercanthal line, eyes open | MC 26.4, lateral limbus 31.0, LC 28.4, tail end 21.6 mm | Korean women 20-30 | measured | `../sources/park-2017-eyebrow-ageing.md` |
| Same | 24.8, 27.0, 24.7, 18.1 mm | Korean women 50-70 | measured | Park 2017 |
| Vertical travel, highest to lowest | 9.9, 10.6, 8.6, 4.9 mm (young); 5.8, 6.7, 5.0, 2.6 (older) | same | measured | Park 2017 |
| Brow lower margin to lid margin at the pupil | 9.5 to 10.9 mm | Gao groups | measured | Gao 2025 |
| Brow lower margin to exocanthion | 15.9 (M), 18.5 (F) Caucasian; 13.6, 15.2 Chinese | | measured | Gao 2025 |
| Lower brow length (arc) | 69.5 (M), 61.4 (F) Caucasian; 68.5, 62.0 Chinese | | measured | Gao 2025 |
| Brow length | men 5 to 6 cm, women 4.5 to 5 cm; head 10-15 percent, body 60, tail 20-25 | | conventional | `../sources/rajput-2021-eyebrow-restoration.md` |

Brow peak over the lateral limbus in every action. Brow shape and hair direction for the card generator are in `hair.md`.

## Open questions

- Globe and cornea size in children and infants; the face-to-eye proportion of infants depends on it.
- Upper lid crease height on the closed lid, by ancestry and sex; Gao gives pretarsal show only.
- Epicanthic fold geometry and prevalence; no open source read.
- Corneal radius and iris size for African populations; the Nigerian ocular normative study PMC5586704 was fetched but not read.
- Lid margin shape as a curve (peak position of the upper lid over the iris) has no measured source here.


## Orbital envelope construction, campaign 2831

The former geometric course was called a lid sulcus without clinical correspondence. Its symmetric 4 mm widening could exceed the head opening's nominal medial allowance of 0.1 aperture spans. The reference eye courses instead expand much farther laterally than medially. The replacement is explicitly an orbital envelope, not a measured sulcus, orbital rim or malar landmark.

Four reference heads used by the campaign supply a seed aperture and eight successive outward quad strips. At poles the extractor joins a strip by shortest edge paths, so the eighth strip is a topology-relative outer course, not an anatomical boundary. For each head, the course's medial, lateral, superior and inferior excursions are normalized by its own seed's projected transverse width; one shared coefficient per direction is fitted with equal reference weights. Rounded values are 0.0183, 0.2628, 0.0910 and 0.1668. Grade: derived from reference geometry, not a population norm. Product source retains these four numbers and no reference coordinates, mesh or index table.

Twenty-five other native reference heads, both eyes, were held out. Relative to the former symmetric 4 mm horizontal reach, raw-course medial RMS changes from 2.915 to 1.041 mm and lateral RMS from 3.290 to 1.622 mm. The unfitted right eyes of the four training heads were also checked. The 18 fixed-body variants have no extracted eye-loop family and supply no facial validation. Recorded ancestry and apparent-age groups are visual classifications and cannot establish population norms. These geometric fit errors are separate from the generated skin and from observed appearance.

The orbital envelope preserves the existing anterior and posterior lid margins, shared head rings and feature-field amplitudes. Its expansions scale with the generated transverse aperture span. The existing margin uses the palpebral-fissure length input as that span even where its source is a three-dimensional chord; this independent measurement-contract limitation remains. The fixed canthal short edges and their closure behavior also remain unproven.

Candidate numerical runs trace named source nodes through the sampler, joined level-2 limit skin and production displacement dispatcher. Native build, evidence, committed viewer comparison, motion and clinical correspondence are separate gates. A lack of strict noncoplanar intersections in a selected eye region is not a proof about the whole head or about contact surfaces.
