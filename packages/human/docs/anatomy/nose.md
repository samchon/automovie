# Nose

Covers the bridge, dorsum, tip, alae and nostrils.

## Dimensions by population

Mean (SD) mm. Landmark pairs: nasal width al-al, nasal height n-sn, protrusion sn-prn, bridge length n-prn.

| Measure | 3DFN M | 3DFN F | Chinese M | Chinese F | Kenyan M | Kenyan F | SA women | NIOSH baseline (US man) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Nasal width al-al | 36.1 (2.6) | 32.6 (2.3) | 39.2 (2.4) | 36.1 (3.1) | 43.2 (3.8) | 40.7 (3.7) | 42.9 (3.1) | 34.3 |
| Alar base (crease to crease) | | | | | 41.3 ac-ac | 33.5 ac-ac | 39.5 (3.2) | |
| Subnasal width sbal-sbal | 19.4 (2.7) | 17.4 (2.3) | | | | | | |
| Nasal height n-sn | 56.6 (3.9) | 54.7 (3.9) | 50.7 (se-sn) | | 51.0 (1.9) | 47.6 (3.1) | | 50.5 (se-sn) |
| Protrusion sn-prn | 21.0 (2.0) | 20.2 (1.9) | 18.9 (1.9) | 17.7 (2.4) | | | | 20.7 |
| Bridge length n-prn | 49.9 (3.9) | 47.4 (3.6) | | | | | 38.8 (3.8) | |
| Ala length ac-prn | 35.5 (2.2) | 31.7 (1.9) | | | | | | |
| Tip projection (alar crease to tip) | | | | | | | 21.5 (2.9) | |
| Columella length | | | | | | | 8.2 (1.7) | |
| Lobule width | | | | | | | 25.0 (2.5) | |
| Nasal root breadth | | | 18.3 (1.9) | 17.3 (2.2) | | | | 16.4 |

Sources: `../sources/weinberg-2016-3d-facial-norms.md` (3D, measured), `../sources/du-2008-chinese-workers.md` (caliper, measured), `../sources/virdi-2019-kenyan-face.md` (caliper, measured), `../sources/wilson-2023-south-african-women.md` (photogrammetry, measured), `../sources/zhuang-2010-niosh-facial.md` (caliper, population-fitted). The NIOSH regression puts African-American noses 7.6 mm wider, 2.3 mm less protruding and 1.2 mm shorter than the Caucasian baseline at equal stature, and the mainly Asian group 3.5 mm wider and 2.1 mm less protruding. Farkas 2005 (abstract) names nose width as the strongest contrast of Asian and Black groups with North American whites (`../sources/farkas-2005-international.md`). Nose width is the largest single ancestry signal on the face.

## Angles

| Angle | Value (degrees) | Population | Grade | Source |
| --- | --- | --- | --- | --- |
| Nasofrontal | 127.3 (M), 127.9 (F) | Kenyan | measured | Virdi 2019 |
| Nasofrontal | 130.3 (M), 134.3 (F) | North American white, Farkas as quoted | measured | Virdi 2019 |
| Nasofrontal | 141.0 (5.8) | South African women, photographs | measured | Wilson 2023 |
| Nasolabial | 85.5 (M), 85.2 (F) | Kenyan | measured | Virdi 2019 |
| Nasolabial | 99.8 (M), 104.2 (F) | North American white, Farkas as quoted | measured | Virdi 2019 |
| Nasolabial | 71.4 (M), 73.9 (F) | African American, Farkas as quoted | measured | Virdi 2019 |
| Nasolabial | 85.6 (10.8) | South African women | measured | Wilson 2023 |
| Nasolabial ideal | 90 to 95 (M), 95 to 110 (F) | aesthetic guidance | conventional | `../sources/brito-2020-nasal-analysis.md` |
| Nasofacial | 31.3 (3.0) | South African women | measured | Wilson 2023 |
| Nasomental | 134.8 (4.4) | South African women | measured | Wilson 2023 |

Angle definitions differ: Virdi and Farkas use the standard soft-tissue profile; Wilson defines nasofrontal as glabella-nasion-tip and nasolabial as columellar break-subnasale-labrale superius.

## Nostrils and tip

- Nostril types after Porter 2003, South African women: oval base with horizontal axis 55.1 percent, trapezoidal base with inverted axis 26.3 percent, triangular base with vertical axis 18.6 percent (Wilson 2023, measured). The axis is the nostril's long axis seen from below; a vertical axis means a narrow, upright nostril under a projecting tip.
- Tip form (Brito 2020, conventional): two tip-defining points 5 to 6 mm apart, divergence angle about 30 degrees, domal arc 4 mm or less; broader and less defined in men.
- Alar base ideal about equal to the intercanthal width (Brito 2020, conventional); measured populations break it: nasal width al-al exceeds intercanthal width in every Kenyan subject (Virdi 2019) and by 24.5 percent on average in South African women (Wilson 2023).
- Nasalis compresses the ala toward the septum, the dilatators flare the nostril margin, depressor septi pulls the ala down (Gray 1918); AU38 and AU39 act here.

## Growth and ageing

- 3DFN growth (M / F): nasal width 27.2 / 26.9 mm at 3-4, 30.9 / 30.8 at 10-11, 36.1 / 32.6 adult; protrusion 13.8 / 14.1 to 21.0 / 20.2; height 40.9 / 40.7 to 56.6 / 54.7. Protrusion is the latest to mature (66 percent of adult at 3-4): children's noses are short, low and wide relative to their length.
- Ageing (`../sources/mendelson-2012-facial-skeleton-ageing.md`): the lower piriform rim recedes, so the alar base moves back relative to the medial canthus; the nose lengthens and the tip droops as the columella and lateral crura move back. NIOSH: nose length +2.3 mm and breadth +2.0 mm after 45.

## Form rules for the generator

- Inputs: nasal width, subnasal width, nasal height (n-sn), protrusion (sn-prn), bridge length (n-prn) and ala length (ac-prn) fix the six key points; the nasofrontal and nasolabial angles and the nostril axis type are closed or bounded choices.
- n-prn, n-sn and sn-prn form a triangle; an identity whose three values violate the triangle inequality, or give a dorsum angle outside the measured range, is rejected (derived admission rule).
- The nose shapes the shared face surface; the alar crease and nostril are concave features of that surface, not a separate mesh.

## Open questions

- East Asian nasal angles, columella and tip projection were not found in open sources read.
- Dorsal profile (hump, saddle) has no measured distribution here; only the n-prn chord.
- Nostril-type frequencies exist only for South African women.
- Nasal growth before age 3 is not covered.
