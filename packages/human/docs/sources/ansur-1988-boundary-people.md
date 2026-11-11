# ANSUR 1988 boundary people: summary statistics and the conditional-mean method

Derived from the ANSUR 1988 working databases recorded in `ansur-1988.md` (Gordon et al. 1989): https://tools.openlab.psu.edu/publicData/ansurWomen.csv and `ansurMen.csv`, read in full on 2026-11-03. Method context: Young K.S., Margerum S., Barr A., Ferrer M.A., Rajulu S., "Generation of Boundary Manikin Anthropometry", 38th International Conference on Environmental Systems, 2008, NASA NTRS 20080013454, https://ntrs.nasa.gov/citations/20080013454 (read: the abstract; boundary manikins chosen from survey anthropometry by principal components and by posture-based analysis, accommodating the 1st percentile woman to the 99th percentile man).

## Licence

US Government work, approved for public release (see `ansur-1988.md`). Only summary statistics enter the repository; no subject row does.

## Population and protocol

The 2,208 women and 1,774 men of the working databases with all 38 measures below (every subject has them), standing erect, right side, millimetres, weight in kg. Grade: measured; the correlations, conditional means and ratio bands are derived.

## Measures (column, and the Human input it stands for)

| Measure | ANSUR 1988 column | Human input |
| --- | --- | --- |
| stature | STATURE | `height` |
| mass | WEIGHT / 10 | body-mass index for `fat` |
| chest | CHEST_CIRC | `chest` |
| bust span | BUSTPOINT_TO_BUSTPOINT_BRTH | `bustSpan` |
| underbust | CHEST_CIRC-BELOW_BUST_ | `underbust` |
| neck to bust point | NECK_TO_BUSTPOINT_LNTH | `shoulderToApex` |
| natural waist | WAIST_CIRC_NATURAL | `waist` |
| omphalion waist | WAIST_CIRC-OMPHALION | carrier of `highHip` |
| buttock | BUTTOCK_CIRC | `hip` |
| neck base | NECK_CIRC-BASE | `neckBase` |
| neck over the larynx | NECK_CIRC-OVER_LARYNX | `neck` |
| interscye (back) | INTRSCY_DIST | carrier of the former `frontInterscyeLength`, no longer an input |
| natural waist back length | WAIST_NAT_LNTH | carrier of `neckToWaist` |
| biacromial breadth | BIACROMIAL_BRTH | carrier of `acrossShoulder` |
| acromion-radiale | ACR-RADL_LNTH | `upperArmLength` |
| radiale-stylion | RADIALE-STYLION_LNTH | `lowerArmLength` |
| biceps, flexed | ARMCIRCBCPS_FLEX | carrier of `bicep`; muscle driver |
| elbow, extended | ELBOW_CIRC-EXTENDED | `elbow` |
| forearm, flexed | FOREARM_CIRC-FLEXED | carrier of `forearm` |
| wrist at stylion | WRIST_CIRC-STYLION | `wrist` |
| crotch height | CROTCH_HT | carrier of `inseam`; leg driver |
| thigh, proximal | THIGH_CIRC-PROXIMAL | `thigh` |
| knee | KNEE_CIRC | `knee` |
| calf | CALF_CIRC | `calf` |
| hand circumference at metacarpale | HAND_CIRC_AT_METACARPALE | `handCircumference` |
| hand length, breadth at metacarpale | HAND_LNTH, HAND_BRTH_AT_METACARPALE | `handLength`, `handBreadth` |
| foot length, breadth | FOOT_LNTH, FOOT_BRTH | `footLength`, `footBreadth` |
| lateral malleolus height | LATERAL-MALLEOUS_HT | `ankleHeight` |
| head length, breadth, circumference | HEAD_LNTH, HEAD_BRTH, HEAD_CIRC | `length`, `cephalicIndex`, `circumference` |
| bizygomatic breadth | BIZYGOMATIC_BRTH | `faceWidth`; face width scale |
| menton to nasal root depression | MENTON_TO_NASAL_ROOT_DEP_LNTH | face height scale |
| ear length, breadth, protrusion | EAR_LNTH, EAR_BRTH, EAR_PROTRUSION | ear `length`, carrier of `breadth`, `protrusion` |

Means, SDs, sample extremes and the full correlation matrix per sex are the constants of `packages/motions/src/executable/population/HumanPopulationSurvey.ts` (`SURVEY`), to four decimals. Selected means (women / men): stature 1629.4 / 1755.8, mass 62.0 / 78.5, chest 907.1 / 991.4, natural waist 725.5 / 839.9, buttock 966.9 / 983.7, bust span 184.8 / 215.9, underbust 769.7 / 926.1, neck base 346.2 / 408.4, neck 315.7 / 379.6, knee 365.2 / 386.4. Body-mass index: 23.34 (SD 2.65) women, 25.42 (3.00) men.

## Method

A boundary person holds a few driving measures at a standard deviate of plus or minus 2.326 (the 1st and 99th percentiles) and sets every other measure to its conditional mean under the sex's multivariate normal, `mu_x + S_xk S_kk^-1 (v_k - mu_k)`. Drivers are fixed in order, each at its conditional mean plus the deviate times its conditional SD given the drivers before it: stature; body-mass index at the person's stature (mass = BMI x stature squared); flexed biceps given stature and mass (muscle at a given mass); crotch height given stature (leg length); biacromial breadth given stature and mass; acromion-radiale (arm length), hand length and foot length, each given the drivers before it, so the proportion at a given stature is the end; head length; head breadth. A person with no driver of a kind is the conditional mean of it. The ends are: each driver alone at plus and minus 2.326, the four stature-by-mass corners, lean-muscular and heavy-unmuscular, the small and large corners, the mean person and the plus and minus one deviate bodies (31 per sex). The survey is adults only and the Human domain starts at 1,450 mm, so no child is built. The body fat percentage follows from the body mass index by Deurenberg et al.'s relation (1991) at ANSUR II's mean age of the sex, so the shape priors' adiposity is the body-mass-index deviate over 2.326, clamped to -1 to 1, and the sex is declared.

Courses the survey does not define are carried by the nearest surveyed measure: the course is that measure times the mean ratio, over the sex's two reference people, of the reference's course to the survey's conditional expectation of the measure given the reference's own surveyed inputs. This is a calibration of the definition offset on two people per sex, not a population statistic.

The face inputs the survey lacks take the FaceBase adult means (`weinberg-2016-3d-facial-norms.md`) scaled isometrically with the survey's face breadth (widths) or face height (heights, nasal protrusion), which assumes a correlation of each with its scale equal to the ratio of their coefficients of variation. Palm length is ANSUR II's palm over hand length of means (`ansur-ii.md`).

## Per-subject ratio bands (mean and SD; band = mean plus and minus 3 SD)

| Ratio | Women mean (SD) | Men mean (SD) |
| --- | --- | --- |
| Natural waist / buttock | 0.7503 (0.0431) | 0.8533 (0.0418) |
| Chest / buttock | 0.9389 (0.0474) | 1.0082 (0.0408) |
| Chest / natural waist | 1.2530 (0.0547) | 1.1831 (0.0503) |
| Underbust / chest | 0.8492 (0.0290) | 0.9343 (0.0169) |
| Bust span / chest | 0.2041 (0.0158) | 0.2179 (0.0136) |
| Neck to bust point / stature | 0.1646 (0.0134) | 0.1552 (0.0096) |
| Neck base / neck | 1.0968 (0.0238) | 1.0762 (0.0228) |
| Neck / chest | 0.3490 (0.0185) | 0.3837 (0.0189) |
| Thigh / buttock | 0.5998 (0.0199) | 0.6059 (0.0201) |
| Knee / thigh | 0.6306 (0.0285) | 0.6496 (0.0315) |
| Calf / knee | 0.9657 (0.0410) | 0.9788 (0.0415) |
| Wrist / elbow | 0.6354 (0.0230) | 0.6294 (0.0218) |
| Acromion-radiale / stature | 0.1914 (0.0065) | 0.1941 (0.0059) |
| Radiale-stylion / stature | 0.1494 (0.0071) | 0.1537 (0.0064) |
| Radiale-stylion / acromion-radiale | 0.7808 (0.0327) | 0.7921 (0.0309) |
| Hand circumference / hand breadth | 2.3444 (0.0304) | 2.3646 (0.0343) |
| Hand breadth / hand length | 0.4407 (0.0201) | 0.4672 (0.0213) |
| Hand length / stature | 0.1108 (0.0046) | 0.1104 (0.0043) |
| Foot breadth / foot length | 0.3673 (0.0183) | 0.3734 (0.0171) |
| Foot length / stature | 0.1500 (0.0056) | 0.1536 (0.0054) |
| Lateral malleolus height / stature | 0.0372 (0.0030) | 0.0382 (0.0028) |
| Head length / stature | 0.1150 (0.0048) | 0.1124 (0.0048) |
| Head breadth / head length | 0.7723 (0.0352) | 0.7704 (0.0368) |
| Head circumference / half Ramanujan perimeter of the length-breadth ellipse | 2.0881 (0.0238) | 2.0633 (0.0207) |
| Bizygomatic / head breadth | 0.9093 (0.0281) | 0.9264 (0.0290) |
| Ear length / head length | 0.3196 (0.0215) | 0.3284 (0.0231) |

The 1st and 99th sample percentiles agree with mean plus and minus 2.326 SD within 0.01 for every ratio but the body-mass index (empirical 99th percentile 30.36 women and 33.18 men against 29.50 and 32.40), so the bands are not an artefact of a normal assumption. Three SD (99.73 %) rather than 2.326 is used for input consistency: a real adult misses one of 26 relations by chance in about 7 % of cases at that width, while the combinations the check exists for lie beyond 3.5 SD.

## Limits

One army of 1987-1988, adults 17 to about 50, under fitness and weight standards that narrow the adiposity tails; ancestry mostly White and Black American. Head shape varies by ancestry beyond this sample (`du-2008-chinese-workers.md` gives Chinese cephalic indices of about 85), so the cephalic band is united with Du 2008's. The neck is over the larynx, not ISO 8559-1's just below it. The multivariate normal is an approximation; body mass is skewed, which the normal conditioning of mass ignores. The courses calibrated on two reference people per sex inherit those people's definition offsets.
