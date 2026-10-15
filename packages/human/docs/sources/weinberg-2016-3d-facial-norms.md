# Weinberg 2016, 3D Facial Norms database (FaceBase)

Weinberg SM, Raffensperger ZD, Kesterke MJ, et al. "The 3D Facial Norms Database: Part 1. A Web-Based Craniofacial Anthropometric and Image Repository for the Clinical and Research Community." *Cleft Palate-Craniofacial Journal* 53(6):e185-e197, 2016, doi:10.1597/15-199. Read as the NIH author manuscript PMC4841760 (via NCBI efetch). Summary statistics read from the FaceBase CSV `https://www.facebase.org/resources/human/facial_norms/summary/tdfn_gui_summary.csv` and measure definitions from `tdfn_measures.JSON` in the same folder (column 5: 1 male, 2 female, 3 pooled).

## Licence

Summary-level data are "non-controlled and open to all users" under the FaceBase Terms of Use and Data Use Certification, with attribution to FaceBase and NIDCR grant U01-DE020078. Individual-level data and the 2,454 surfaces are controlled access and are not used. Means and SDs are facts; Human may cite them as named constants.

## Population and protocol

2,454 participants (952 male, 1,502 female), aged 3 to 40, self-reported white non-Hispanic with all four grandparents of European descent, recruited in Pittsburgh, Seattle, Houston and Iowa City, screened for craniofacial conditions. 24 soft-tissue landmarks were placed on 3dMDface stereophotogrammetry surfaces; 29 inter-landmark distances are Euclidean distances (not projections). Five head measurements were taken with spreading calipers. Grade: measured. Ages 14 to 17 are thinly sampled.

## Measurement definitions

| Measure | Landmarks | Method |
| --- | --- | --- |
| Maximum cranial width | eu-eu | caliper |
| Maximum cranial length | g-op | caliper |
| Minimum frontal width | ft-ft | caliper |
| Maximum facial width | zy-zy | caliper |
| Mandibular width | go-go | caliper |
| Cranial base width | t-t | 3D |
| Upper / middle / lower facial depth | t-n / t-sn / t-gn | 3D |
| Morphological facial height | n-gn | 3D |
| Upper facial height | n-sto | 3D |
| Lower facial height | sn-gn | 3D |
| Intercanthal / outercanthal width | en-en / ex-ex | 3D |
| Palpebral fissure length | en-ex | 3D |
| Nasal width / subnasal width | al-al / sbal-sbal | 3D |
| Nasal protrusion | sn-prn | 3D |
| Nasal ala length | ac-prn | 3D |
| Nasal height / bridge length | n-sn / n-prn | 3D |
| Labial fissure width | ch-ch | 3D |
| Philtrum width / length | cph-cph / sn-ls | 3D |
| Upper / lower lip height | sn-sto / sto-sl | 3D |
| Upper / lower vermilion height | ls-sto / sto-li | 3D |
| Cutaneous lower lip height | li-sl | 3D |

Landmark definitions (FaceBase technical notes): nasion at the nasofrontal suture at the level of the upper lid creases; subnasale at the apex of the nasolabial angle; stomion on the labial fissure midline; gnathion where the chin contour turns downward; alar curvature point on the alar crease; crista philtri where the philtral columns meet the vermilion; tragion at the notch above the tragus.

## Adult values, ages 20 to 40 pooled (derived from the published per-age means)

Pooled with the exact formula N = Σn, M = Σ(n·m)/N, V = Σ((n-1)s² + n(m-M)²)/(N-1). Millimetres; paired left and right measures are averaged.

| Measure | Male n | Male mean (SD) | Female n | Female mean (SD) |
| --- | --- | --- | --- | --- |
| Maximum cranial length | 580 | 198.3 (7.0) | 1047 | 187.3 (6.3) |
| Maximum cranial width | 579 | 152.3 (5.6) | 1049 | 145.8 (5.3) |
| Minimum frontal width | 581 | 111.4 (9.1) | 1047 | 105.5 (8.0) |
| Maximum facial width | 563 | 137.6 (6.4) | 996 | 129.8 (5.4) |
| Mandibular width | 574 | 104.5 (7.5) | 1038 | 97.0 (7.0) |
| Cranial base width | 589 | 147.9 (5.6) | 1062 | 139.0 (5.0) |
| Upper facial depth (t-n) | 592 | 126.7 (5.0) | 1074 | 118.9 (4.5) |
| Middle facial depth (t-sn) | 592 | 132.8 (5.1) | 1074 | 123.5 (4.6) |
| Lower facial depth (t-gn) | 569 | 151.7 (6.4) | 1060 | 139.2 (6.0) |
| Morphological facial height | 573 | 127.2 (6.6) | 1081 | 118.6 (6.1) |
| Upper facial height (n-sto) | 596 | 78.2 (4.5) | 1096 | 74.3 (4.4) |
| Lower facial height (sn-gn) | 573 | 73.1 (5.4) | 1081 | 66.4 (5.0) |
| Intercanthal width | 595 | 32.7 (3.0) | 1095 | 31.3 (2.8) |
| Outercanthal width | 586 | 88.9 (3.9) | 1082 | 85.4 (3.8) |
| Palpebral fissure length | 586 | 28.8 (1.9) | 1082 | 27.8 (2.0) |
| Nasal width | 595 | 36.1 (2.6) | 1098 | 32.6 (2.3) |
| Subnasal width | 595 | 19.4 (2.7) | 1097 | 17.4 (2.3) |
| Nasal protrusion | 597 | 21.0 (2.0) | 1098 | 20.2 (1.9) |
| Nasal ala length | 596 | 35.5 (2.2) | 1096 | 31.7 (1.9) |
| Nasal height | 597 | 56.6 (3.9) | 1098 | 54.7 (3.9) |
| Nasal bridge length | 597 | 49.9 (3.9) | 1098 | 47.4 (3.6) |
| Labial fissure width | 596 | 50.9 (3.8) | 1097 | 48.1 (3.5) |
| Philtrum width | 594 | 13.3 (1.8) | 1097 | 11.8 (1.7) |
| Philtrum length | 596 | 16.4 (2.7) | 1097 | 14.3 (2.4) |
| Upper lip height | 596 | 22.7 (2.7) | 1096 | 20.5 (2.5) |
| Lower lip height | 584 | 19.2 (2.8) | 1094 | 17.6 (2.3) |
| Upper vermilion height | 595 | 7.5 (1.7) | 1096 | 7.4 (1.4) |
| Lower vermilion height | 596 | 8.7 (2.3) | 1094 | 8.5 (1.9) |
| Cutaneous lower lip height | 584 | 12.5 (2.6) | 1094 | 10.8 (2.2) |

## Growth, pooled bands (derived), mean (SD) mm

| Measure | M 3-4 | F 3-4 | M 6-7 | F 6-7 | M 10-11 | F 10-11 | M 14-15 | F 14-15 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Maximum cranial length | 173.6 (7.2) | 171.7 (6.0) | 178.6 (6.0) | 175.9 (7.0) | 186.3 (7.1) | 175.6 (7.6) | 192.5 (11.1) | 187.3 (6.7) |
| Maximum cranial width | 141.2 (5.7) | 135.4 (4.5) | 141.7 (4.7) | 138.2 (5.9) | 143.7 (5.8) | 141.4 (5.4) | 150.2 (5.2) | 145.6 (5.5) |
| Maximum facial width | 114.0 (5.7) | 109.6 (6.2) | 117.9 (5.3) | 116.0 (8.0) | 124.5 (3.3) | 122.4 (5.4) | 131.3 (6.7) | 128.1 (3.9) |
| Mandibular width | 80.7 (6.3) | 78.6 (5.1) | 86.8 (4.0) | 84.9 (4.5) | 91.2 (4.1) | 88.8 (6.5) | 98.0 (6.0) | 92.6 (5.5) |
| Morphological facial height | 93.1 (6.2) | 93.3 (5.8) | 103.0 (5.4) | 100.3 (4.5) | 109.9 (5.6) | 105.7 (5.8) | 120.8 (7.7) | 109.6 (6.7) |
| Intercanthal width | 27.9 (1.9) | 28.2 (2.2) | 30.0 (2.0) | 29.5 (2.5) | 31.4 (2.6) | 31.5 (2.0) | 32.3 (2.0) | 31.3 (2.1) |
| Outercanthal width | 74.3 (3.0) | 73.0 (3.3) | 78.5 (3.4) | 77.1 (3.7) | 84.1 (3.7) | 81.1 (3.0) | 87.9 (3.4) | 85.2 (2.7) |
| Nasal width | 27.2 (1.6) | 26.9 (1.6) | 28.6 (1.9) | 27.8 (1.9) | 30.9 (2.1) | 30.8 (2.6) | 34.2 (2.9) | 33.0 (2.1) |
| Nasal protrusion | 13.8 (1.1) | 14.1 (1.3) | 15.5 (1.3) | 15.5 (1.2) | 17.3 (1.9) | 16.9 (1.3) | 20.4 (1.6) | 18.5 (1.4) |
| Nasal height | 40.9 (3.3) | 40.7 (2.8) | 45.8 (3.9) | 44.9 (3.0) | 50.0 (4.0) | 48.4 (2.6) | 54.5 (3.2) | 51.1 (3.8) |
| Labial fissure width | 36.2 (3.1) | 34.3 (3.3) | 37.9 (3.0) | 37.2 (3.0) | 42.9 (3.0) | 42.5 (4.0) | 45.1 (5.2) | 45.0 (3.2) |

## What Human takes

The default adult and child face and vault for European ancestry, and the growth shape of each measure from 3 to 40: the cranium is about 88 percent of adult length at age 3 while morphological face height is about 73 percent, nose protrusion 66 percent and mouth width 71 percent, so the face grows out of a large vault. Every 3D measure is a straight landmark distance, so a generated surface is checked by the same distance, not a projection.

## Limits

One ancestry. No ages under 3 or over 40. The 3D measures carry no angles and no ear dimensions.
