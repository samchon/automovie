# Growth and ageing

Human must build a person of any age from the same parameters, with age-dependent proportions taken from growth data rather than from scaling an adult (#2793). This file collects how stature, proportions, breadths and posture change from birth to old age.

## Stature for age

WHO medians (SD), cm, from the LMS workbooks (`../sources/who-child-growth-standards.md`); recumbent length to 2 years, standing height after. Grade: measured, population-fitted.

| Age (y) | 0 | 0.5 | 1 | 2 | 3 | 5 | 8 | 10 | 12 | 14 | 16 | 19 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Boys | 49.9 (1.9) | 67.6 (2.1) | 75.7 (2.4) | 87.8 (3.1) | 96.1 (3.7) | 110.0 (4.6) | 127.3 (5.6) | 137.8 (6.4) | 149.1 (7.1) | 163.2 (7.7) | 172.9 (7.8) | 176.5 (7.3) |
| Girls | 49.1 (1.9) | 65.7 (2.3) | 74.0 (2.6) | 86.4 (3.2) | 95.1 (3.8) | 109.4 (4.8) | 126.6 (5.8) | 138.6 (6.4) | 151.2 (6.8) | 159.8 (6.9) | 162.5 (6.8) | 163.2 (6.5) |

US NHANES 2015–2018 means agree within about 2 cm at most ages (boys 112.8 at 5, 141.7 at 10, 175.0 at 19; girls 111.9, 143.0, 162.2; `../sources/nhanes-2015-2018.md`). The generator takes the WHO LMS curve as the default stature for age and its z-score as the identity's stature parameter, so a tall child stays tall through growth.

## Proportions for age

From the 1977 US child survey, means of individual ratios (`../sources/snyder-1977.md`), grade population-fitted; adult columns from ANSUR II (`../sources/ansur-ii.md`).

| Age (y) | 2 | 4 | 6 | 8 | 10 | 12 | 14 | 16 | 17–18 | Adult (ANSUR II) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Sitting height / stature, boys | 0.593 | 0.566 | 0.548 | 0.532 | 0.522 | 0.512 | 0.511 | 0.518 | 0.520 | 0.523 |
| Sitting height / stature, girls | 0.585 | 0.560 | 0.548 | 0.531 | 0.521 | 0.519 | 0.522 | 0.527 | 0.529 | 0.526 |
| Stature / head height, boys | 5.29 | 5.82 | 6.31 | 6.79 | 7.17 | 7.42 | 7.76 | 8.03 | 8.03 | |
| Stature / head height, girls | 5.36 | 5.91 | 6.36 | 6.86 | 7.19 | 7.63 | 7.89 | 7.93 | 7.95 | |
| Head height (mm), boys | 173 | 181 | 189 | 192 | 197 | 202 | 210 | 217 | 220 | |
| Tibiale height / stature, boys | 0.230 | 0.241 | 0.252 | 0.261 | 0.264 | 0.270 | 0.265 | 0.263 | 0.264 | 0.267 |
| Trochanter height / stature, boys | 0.438 | 0.468 | 0.493 | 0.498 | 0.514 | 0.524 | 0.519 | 0.515 | 0.513 | 0.513 |
| Trochanter height / stature, girls | 0.447 | 0.475 | 0.491 | 0.507 | 0.515 | 0.515 | 0.513 | 0.505 | 0.503 | 0.519 |
| Biacromial / stature, boys | 0.228 | 0.226 | 0.223 | 0.218 | 0.217 | 0.216 | 0.217 | 0.218 | 0.222 | 0.237 |
| Bispinous / stature, girls | 0.157 | 0.145 | 0.142 | 0.143 | 0.136 | 0.142 | 0.141 | 0.145 | 0.148 | |
| Natural waist / hip, girls | 0.920 | 0.900 | 0.854 | 0.834 | 0.810 | 0.766 | 0.736 | 0.732 | 0.717 | |
| Natural waist / hip, boys | 0.908 | 0.921 | 0.888 | 0.878 | 0.874 | 0.867 | 0.861 | 0.839 | 0.848 | |

Readings:

- Legs drive childhood growth. The sitting height ratio falls from about 0.59 at 2 to its minimum near 0.51 (boys, 12 to 14) and 0.52 (girls, 10 to 12), then rises slightly as the trunk grows late in puberty. Bogin and Varela-Silva (`../sources/bogin-varela-silva-2010.md`) give the same cephalo-caudal gradient: legs, especially the tibia, grow fastest from birth to about 7.
- The head nearly stops growing while the body grows: head height rises only 27% from 2 to 18 while stature nearly doubles, so heads per stature goes from about 5.3 at 2 to 8.0 in late adolescence. At birth head length is about a quarter of body length (conventional, as stated by Bogin and Varela-Silva). The infant head proportion is therefore a head-size curve plus a stature curve, not a scale factor.
- Shoulders stay a nearly constant fraction of stature in childhood and widen in late male puberty (0.218 at 16 to 0.237 adult).
- The female waist-to-hip ratio falls from 0.92 at 2 to 0.72 at 17 to 18 as the pelvis and hips widen at puberty; boys fall only to about 0.84. Natural waist here is the narrowest waist, unlike ANSUR's omphalion waist.
- Adult proportions depend on stature: in ANSUR II, sitting height = 215 + 0.394 S (both sexes), so a taller adult has relatively longer legs; Duval (`../sources/duval-1905.md`) states the same for the spine (longer relative to stature in infants, women and short people).
- Population: adult sitting height ratio ranges from about 0.47 to 0.56 between populations (Bogin and Varela-Silva), wider than the ANSUR II spread (SD 0.014).

## Shoulder and neck height for age

Vertex to suprasternale, fitted by us from the 1977 individual records (`../sources/snyder-1977.md`), means of per-subject (stature − suprasternale height) / stature by bin, then in head heights with the bin's heads per stature. Grade: population-fitted.

| Age (y) | 2 | 4 | 6 | 8 | 10 | 12 | 14 | 16 | 17–18 | Adult (ANSUR II) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| / stature, boys | 0.243 | 0.224 | 0.213 | 0.204 | 0.195 | 0.190 | 0.189 | 0.185 | 0.190 | 0.181 |
| / stature, girls | 0.236 | 0.223 | 0.215 | 0.202 | 0.193 | 0.191 | 0.191 | 0.191 | 0.191 | 0.183 |
| head heights, boys | 1.28 | 1.30 | 1.34 | 1.38 | 1.40 | 1.41 | 1.47 | 1.49 | 1.52 | 1.45 |
| head heights, girls | 1.27 | 1.32 | 1.36 | 1.39 | 1.39 | 1.46 | 1.50 | 1.51 | 1.52 | 1.46 |

Bins hold 11 to 53 children (the notch was measured on one of the survey's two measurement sets). The 1975 survey (`../sources/snyder-1975.md`) agrees independently: its sitting mid-shoulder height subtracted from crown-rump sitting height puts the top of the shoulder 203 mm (girls) and 205 mm (boys) below the vertex at 25 to 30 months, about 1.2 head heights, rising to 272 mm (girls, 1.33 head heights) at 13.

ANSUR II adult means place acromion 5.4 mm above suprasternale in women and 2.1 mm in men; cervicale is 66.0 and 78.7 mm above it. Holding those adult offsets in head heights for children (cervicale/acromion 0.322/0.026 women, 0.360/0.010 men) and holding the youngest measured notch course below 2.5 years are modelling conventions, not measured infant neck/shoulder proportions.

## Old age

| Change | Value | Source and grade |
| --- | --- | --- |
| Stature | Women 162.7 cm at 30–39 to 155.6 at 80+; men 176.3 to 170.4 (cross-sectional, includes cohort effects) | `../sources/nhanes-2015-2018.md`, measured |
| Upper arm length (bone landmarks) | Flat across adult ages (women 35.9 to 35.6 cm; men 39.0 to 39.0) | same; the bones do not shorten |
| Thoracic kyphosis | 20 to 29 deg young, 35 to 38 deg at 65+, 50+ deg in 20 to 40% of older adults | `../sources/koele-2020.md`, measured (cited) |
| Pelvic tilt | Small rise with age (r 0.16), pelvic incidence constant | `../sources/mac-thiong-2011.md`, measured |
| Mid-upper arm circumference | Peaks at 40–49 (women 33.3, men 35.6 cm), falls to 29.6 and 30.8 at 80+ | `../sources/nhanes-2015-2018.md`, measured |
| Waist at the iliac crest | Rises from 92.1 (women) and 94.2 (men) cm at 20–29 to 101.5 and 107.4 at 70–79 | same |
| Appendicular lean mass / height2 (men) | 9.12 kg/m2 at 40 to 7.72 at 85 | `../sources/kelly-2009.md`, measured |
| Trunk-to-leg fat ratio | Rises until about 65 in both sexes | same |

Stature loss in old age is spinal (discs, kyphosis, vertebral fractures), not limb shortening, so the skeleton keeps limb bone lengths and shortens and curves the trunk. Limbs thin (muscle loss) while the abdomen grows, which `body-composition.md` turns into cross-section changes.

## Open questions

- Infant proportions before 2 years: sitting height (crown-rump) ratio and head height per length were not read from a measured source; only the conventional "head a quarter of length at birth".
- WHO head circumference (read by the face workspace in `../sources/who-2006-head-circumference.md`) gives head size from birth; a head-height-to-circumference relation for infants is needed to join it to stature.
- The 1977 children are leaner and shorter than today's; whether their ratios hold for current children is untested (no modern child segment data read; Size Korea covers children but was not downloaded).
- A longitudinal source for adult stature loss (separating ageing from cohort) was not read.
- Puberty timing as a parameter: the growth curve of a single identity should follow its own maturity tempo; no tempo model was read.
- Old-age posture: kyphosis, pelvic retroversion and the forward neck now come from Asai 2017 and the forward head from Zárate-Tejero 2024 (see `skeleton.md`); knee flexion in old age has no numeric source read.
- Acromion and cervicale height in children: neither child survey measured them standing; the adult distances above the notch are held.
