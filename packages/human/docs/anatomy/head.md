# Head: cranial vault and face mass

Covers #2798 (cranium, face mass, landmarks as semantic coordinates) and the measurements every face feature in #2799 reads. Jaw articulation is in `jaw.md`, the neck in `neck.md`.

## Landmarks

Soft-tissue landmarks are the semantic coordinates of the face surface: the generator places them first from measurements, then shapes the surface through them, and measures them back for acceptance. Definitions follow the 3D Facial Norms technical notes and the NIOSH survey (`../sources/weinberg-2016-3d-facial-norms.md`, `../sources/zhuang-2010-niosh-facial.md`, `../sources/virdi-2019-kenyan-face.md`). Grade: conventional (Farkas nomenclature).

| Landmark | Code | Definition |
| --- | --- | --- |
| Trichion | tr | Midline point of the hairline |
| Glabella | g | Most prominent midline point between the brows, on the frontal bone between the brow ridges |
| Nasion | n | Midline over the nasofrontal suture, at the level of the upper lid creases |
| Sellion | se | Deepest point of the nasal root (NIOSH; often confused with nasion) |
| Pronasale | prn | Most protruding point of the nasal tip |
| Subnasale | sn | Apex of the nasolabial angle, where the columella meets the upper lip |
| Labiale superius | ls | Upper vermilion border in the midline, between the philtral columns |
| Stomion | sto | Midline of the labial fissure, lips closed |
| Labiale inferius | li | Lower vermilion border in the midline |
| Sublabiale | sl | Midpoint of the labiomental groove |
| Gnathion | gn | Midline point where the chin contour turns downward |
| Menton | me | Lowest midline point of the chin (NIOSH: inferior point of the mandible) |
| Endocanthion | en | Medial corner of the palpebral fissure |
| Exocanthion | ex | Lateral corner of the palpebral fissure |
| Alare | al | Most lateral point of the nasal ala |
| Alar curvature point | ac | Most posterior point of the alar crease |
| Subalare | sbal | Lower end of the alar insertion into the upper lip skin |
| Crista philtri | cph | Where a philtral column meets the vermilion |
| Cheilion | ch | Corner of the mouth |
| Zygion | zy | Most lateral point of the zygomatic arch |
| Gonion | go | Most lateral, inferior and posterior point of the mandibular angle |
| Frontotemporale | ft | Deepest point of the temporal crest of the frontal bone above the brow ridge |
| Tragion | t | Notch above the tragus where the cartilage meets the face |
| Eurion | eu | Most lateral point of the vault above the ears |
| Opisthocranion | op | Most posterior midline point of the vault |

## Vault

| Measure (mm) | Male | Female | Population, protocol | Grade | Source |
| --- | --- | --- | --- | --- | --- |
| Length g-op | 198.3 (7.0) | 187.3 (6.3) | US European ancestry 20-40, caliper | measured | 3DFN |
| Breadth eu-eu | 152.3 (5.6) | 145.8 (5.3) | same | measured | 3DFN |
| Length | 185.7 (5.8) | 176.7 (7.5) | Chinese workers 18-66, caliper | measured | `../sources/du-2008-chinese-workers.md` |
| Breadth | 157.2 (5.3) | 150.5 (7.1) | same | measured | Du 2008 |
| Circumference | 567.0 (13.6) | 546.2 (17.2) | same, tape above the supraorbital ridges | measured | Du 2008 |
| Circumference | 567.9 baseline, female -5.4 at equal stature | | US workers, regression | population-fitted | Zhuang 2010 |
| Cranial base width t-t | 147.9 (5.6) | 139.0 (5.0) | US European ancestry, 3D | measured | 3DFN |

Cephalic index CI = 100 × breadth / length (conventional). Derived from the means: European-ancestry adults 76.8 (men) and 77.8 (women); NIOSH baseline 77.5; Chinese workers 84.7 and 85.2; Chinese children 0-15 measured on CT 86.6 (SD 5.2, range 73.5 to 105.7) with a peak of 90.0 at 4-6 months (`../sources/liang-2024-cephalic-index-china.md`). Vault shape therefore needs its own parameter; it is not implied by sex or face size.

Circumference check (derived here): circumference over the brows ≈ k × P(L, B), where P is the Ramanujan ellipse perimeter π(3(a+b) - √((3a+b)(a+3b))) with a = L/2, b = B/2. From the published means k = 1.04 (NIOSH baseline), 1.051 and 1.061 (Chinese men and women). Use it to reject identities whose length, breadth and circumference cannot coexist.

## Face mass

Adult means, mm (SD). 3DFN distances are straight 3D landmark distances; caliper and direct values are noted.

| Measure | 3DFN M | 3DFN F | Chinese M | Chinese F | Kenyan M | Kenyan F | SA women | Nigerian (both) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Face width zy-zy | 137.6 (6.4) | 129.8 (5.4) | 147.5 (4.7) | 139.9 (6.3) | 133.8 (4.6) | 130.1 (3.5) | 139.2 (6.8) | 139.4 (7.1) |
| Mandibular width go-go | 104.5 (7.5) | 97.0 (7.0) | 119.0 (8.5) | 114.2 (10.6) | 106.6 (5.9) | 96.8 (2.9) | | 124.3 (9.7) |
| Minimum frontal ft-ft | 111.4 (9.1) | 105.5 (8.0) | 108.7 (5.1) | 106.6 (7.5) | 115.3 (3.4) | 111.2 (2.5) | | |
| Morphological face height n-gn | 127.2 (6.6) | 118.6 (6.1) | | | | | | |
| Face length se-me | | | 117.3 (5.6) | 110.3 (7.2) | | | | |
| Upper face height n-sto | 78.2 (4.5) | 74.3 (4.4) | | | | | | |
| Lower face height sn-gn or sn-me | 73.1 (5.4) | 66.4 (5.0) | | | 76.4 (3.6) | 69.5 (4.8) | 67.8 (5.4) | 67.9 (6.1) |
| Forehead height tr-n | | | | | 72.2 (2.3) | 67.5 (2.9) | | 69.1 (5.9) |
| Upper facial depth t-n | 126.7 (5.0) | 118.9 (4.5) | | | | | | |
| Midfacial depth t-sn | 132.8 (5.1) | 123.5 (4.6) | | | | | | |
| Lower facial depth t-gn | 151.7 (6.4) | 139.2 (6.0) | | | | | | |

Sources: `../sources/weinberg-2016-3d-facial-norms.md`, `../sources/du-2008-chinese-workers.md`, `../sources/virdi-2019-kenyan-face.md` (direct caliper), `../sources/wilson-2023-south-african-women.md` (photogrammetry), `../sources/adekunle-2022-nigerian-3d.md` (3D). Different landmark protocols (gonion by palpation versus surface, menton versus gnathion) explain part of the spread; compare within a source before across.

The tragion-based depths place the face in front of the ear: t-n, t-sn and t-gn with t-t fix three triangles that orient the midline profile relative to the ears without any cephalometric head frame.

Sex effect at equal stature and weight (NIOSH regression, population-fitted): face width -6.0 mm, bigonial -7.6 mm, face length -5.3 mm, head breadth -4.7 mm, head length -4.6 mm. Bigonial and face width are the strongest sex signals of the face frame after the neck.

## Growth

From the 3DFN per-age means (derived fractions of the 20-40 male mean): at age 3-4 the vault is 88 percent of adult length and 93 percent of breadth, but face height is 73 percent, face width 83 percent, nasal protrusion 66 percent and mouth width 71 percent. The child face is small under a large vault; the vault nearly finishes early while the face grows downward and forward through adolescence (male face height 109.9 mm at 10-11 to 120.8 at 14-15). Head circumference from the WHO standard rises from 34.5 cm (boys) and 33.9 cm (girls) at birth to 46.1 and 44.9 at one year and 50.7 and 49.9 at five, reaching 61, 81 and 89 percent of the adult male circumference (`../sources/who-2006-head-circumference.md`). Mendelson relays Enlow: with growth the glabella protrudes, the supraorbital ridges expand and the orbits move laterally (`../sources/mendelson-2012-facial-skeleton-ageing.md`).

| Measure (mm, M / F) | 3-4 | 6-7 | 10-11 | 14-15 | 20-40 |
| --- | --- | --- | --- | --- | --- |
| Vault length | 173.6 / 171.7 | 178.6 / 175.9 | 186.3 / 175.6 | 192.5 / 187.3 | 198.3 / 187.3 |
| Vault breadth | 141.2 / 135.4 | 141.7 / 138.2 | 143.7 / 141.4 | 150.2 / 145.6 | 152.3 / 145.8 |
| Face width | 114.0 / 109.6 | 117.9 / 116.0 | 124.5 / 122.4 | 131.3 / 128.1 | 137.6 / 129.8 |
| Mandibular width | 80.7 / 78.6 | 86.8 / 84.9 | 91.2 / 88.8 | 98.0 / 92.6 | 104.5 / 97.0 |
| Face height n-gn | 93.1 / 93.3 | 103.0 / 100.3 | 109.9 / 105.7 | 120.8 / 109.6 | 127.2 / 118.6 |

Under age 3 no face norms were found; only head circumference (WHO) covers infancy.

## Ageing

- Skeleton (`../sources/mendelson-2012-facial-skeleton-ageing.md`, relayed CT studies, measured): orbital aperture widens, receding at the superomedial and inferolateral rims; the maxilla retrudes, maxillary angle about 10 degrees smaller over 60 than under 30; the lower piriform rim recedes so the alar base moves back; the mandibular angle opens and ramus and body heights shrink while bigonial width holds; the prejowl becomes concave.
- Framework (`../sources/farkas-2004-adult-ageing.md`, abstract): face width is the most stable adult measure; soft tissue over the jaw thickens in early adulthood and thins late.
- Soft tissue (`../sources/schenck-2018-fat-compartments.md`, abstract): superficial compartments are distinct; nasolabial, middle cheek and jowl compartments slide down under volume, medial and lateral cheek and temporal compartments project.
- NIOSH (population-fitted): after 45 face length +2.1 mm, nose length +2.3 mm, interpupillary +1.4 mm, nose breadth +2.0 mm at equal stature and weight.

## Form rules for the generator

- Parameters: vault length, breadth and circumference (with the k-band check), minimum frontal width, face width, mandibular width, morphological face height, the three tragion depths and the mid-face heights. Every other landmark position follows from these plus feature parameters.
- The vault is one smooth closed surface; the face mass attaches to it at the frontal and temporal regions, and the ear attachment ring sits at tragion.
- Brow ridge, zygomatic prominence and mandibular angle are bony landmarks that should show through the skin at sites of thin soft tissue (face width has the thinnest cover per Farkas 2004).
- Age acts on bone (orbit, maxilla, piriform, mandibular angle) and on fat compartments separately; a single "age" morph cannot express both.

## Open questions

- No East Asian or African 3D norms with landmark distances were found open; Size Korea was not accessed, and the Chinese survey is caliper-based.
- No norms from birth to 3 years except head circumference; infant face shape needs another source.
- Trichion has no growth or ageing data here; forehead height of children is unknown.
- Gonion and gnathion definitions differ between sources; the generator must choose one and convert.
- Cephalic index of European-ancestry children and of adults over 40 is not covered.
