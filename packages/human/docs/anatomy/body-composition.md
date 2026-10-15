# Body composition

How adiposity, muscularity, sex and age change girths and where volume goes. The generator reads named measurements (stature, mass or BMI, girths); this file gives the relations that turn simple parameters into those measurements and decide which cross-sections grow.

## Girth from stature, BMI and age (adults)

ANSUR II, ordinary least squares per sex, stature S in mm, BMI in kg/m2, age in years (`../sources/ansur-ii.md`, population-fitted, valid within about BMI 17 to 40, age 17 to 58).

| Girth (mm) | Women: per BMI unit | Men: per BMI unit | Women R2 | Men R2 |
| --- | --- | --- | --- | --- |
| Waist (omphalion) | 23.56 | 23.63 | 0.78 | 0.87 |
| Chest (chest point) | 18.68 | 18.79 | 0.75 | 0.88 |
| Buttock | 18.32 | 16.96 | 0.85 | 0.89 |
| Thigh (gluteal furrow) | 13.87 | 13.37 | 0.84 | 0.87 |
| Shoulder (deltoid points) | 10.56 | 12.24 | 0.70 | 0.74 |
| Lower thigh (suprapatella) | 8.00 | 6.75 | 0.71 | 0.79 |
| Biceps, flexed | 7.45 | 7.06 | 0.80 | 0.71 |
| Calf | 6.20 | 6.06 | 0.66 | 0.72 |
| Neck | 3.83 | 4.91 | 0.61 | 0.68 |
| Forearm, flexed | 4.00 | 4.07 | 0.68 | 0.66 |
| Ankle | 2.34 | 2.50 | 0.43 | 0.58 |
| Wrist | 1.16 | 1.22 | 0.55 | 0.56 |

Full intercepts and stature and age terms are in the source file. The per-BMI slopes order where mass goes as it is gained: waist first, then chest and buttock, then thigh, then shoulder and arm, little at the calf and almost nothing at ankle and wrist. Age adds about 1.1 mm (women) and 1.9 mm (men) of waist per year at constant BMI and removes about 0.9 mm of male thigh per year: mass moves from limbs to trunk with age even at constant BMI.

Breadths and depths per BMI unit (mm, women / men): waist breadth 7.28 / 7.21, waist depth 7.28 / 6.96, chest depth 6.08 / 5.35, chest breadth 3.30 / 2.71, buttock depth 5.88 / 5.75, hip breadth 5.59 / 4.59, bideltoid 6.58 / 6.72, biacromial 1.08 / 1.91. Fat moves the trunk forward more than sideways at the chest (depth gains twice breadth), equally at the waist, and the bony biacromial breadth barely moves; this is the evidence for keeping skeletal breadths fixed and putting adiposity into the soft-tissue cross-section.

## Fat distribution by sex and age

| Quantity | Women | Men | Source and grade |
| --- | --- | --- | --- |
| Body fat at 25 (White, US) | 36.0% | 24.6% | `../sources/kelly-2009.md`, measured |
| %fat trunk / %fat legs at 20 | 0.759 | 0.883 | same |
| %fat trunk / %fat legs at 65 | 0.906 | 1.136 | same |
| Trunk / limb fat mass at 20 | 0.745 | 0.926 | same |
| Trunk / limb fat mass at 65 | 1.011 | 1.366 | same |
| Fat mass index matching BMI 25 / 30 at 25 | 9 / 13 kg/m2 | 6 / 9 kg/m2 | same |
| Pattern | Gluteal-femoral (pear) | Central (abdominal) | `../sources/karastergiou-2012.md`, established account |

Rule for the generator: given total fat (from BMI and sex), split it between trunk and limbs by the sex- and age-specific trunk-to-limb ratio, then within the trunk between abdomen, chest, back and hips, and within the limbs between upper and lower segments. Women's limb share is higher and concentrated in hips, buttocks and thighs; men's trunk share is higher and concentrated in the abdomen; both shift toward the trunk until about 65.

## Muscularity

Appendicular lean mass index (men, White): 8.87 kg/m2 at 20, 9.12 at 40, 8.44 at 70, 7.72 at 85; women 6.81 at 20 (`../sources/kelly-2009.md`). Mid-upper arm circumference (relaxed, NHANES) peaks at 40 to 49 and falls by about 4 cm by 80+ (`../sources/nhanes-2015-2018.md`). BMI mixes fat and lean: a muscular identity at BMI 27 must not be built as a fat one, so the detailed parameters carry fat mass and lean mass (or muscularity) separately, and BMI is a derived quantity.

## Fat and lean apart

Adiposity and muscularity each move body fat and the appendicular lean mass index by two of their DXA reference's standard deviations per unit (Kelly et al. 2009 σ columns; Zemel et al. 2023 S times M), and BMI follows as FFMI / (1 - fat) with FFMI scaled from the median person by limb lean mass. Girths read fat and lean apart: our NHANES fits (2017-2018 waist, hip, arm; 1999-2004 thigh, calf; adults 18 to 40) of girth on stature, fat mass index and appendicular lean mass index, as multiples of the girth's BMI slope:

| Site | Men fat / lean | Women fat / lean |
| --- | --- | --- |
| Waist (iliac crest) | 1.60 / 0.64 | 1.39 / 0.82 |
| Hip | 1.36 / 1.31 | 1.38 / 0.92 |
| Mid-upper arm | 0.85 / 2.61 | 1.10 / 1.89 |
| Mid-thigh | 0.89 / 2.40 | 0.91 / 2.38 |
| Calf | 0.94 / 2.22 | 0.92 / 2.32 |

Gate identity targets are in `../sources/gate-identity-targets.md`.

## Children

Children take their own medians (`estimateAutoMovieHumanComposition`): body fat from the NHANES pediatric DXA tables (Kelly et al. 2009, Table S9, White medians: boys 26.5% at 8, 23.8 at 14, 21.3 at 16; girls 31.6 at 8 rising to 34.3 at 18), extended to 5.5 years by the BMDCS fat mass index course, and the appendicular lean mass index from the BMDCS (`../sources/zemel-2023-bmdcs-body-composition.md`: 4.2 girls and 4.55 boys at 5, 6.7 and 8.6 at 19), which meets Kelly's adults at 20. Below 5.5 both hold. A child no longer receives an adult's lean mass and muscle relief.

## Breast and gluteal volume

Breast and buttock are body volume on the trunk cross-sections, not separate parts.

- Breast base: in the adult nulliparous woman it extends vertically from the second to the sixth rib and transversely from the side of the sternum to the midaxillary line (`../sources/gray-1918.md`, conventional).
- ANSUR II chest circumference, depth and height for women are taken at chest point anterior, the most anterior point of the bust (`../sources/ansur-ii.md`); women's chest depth / chest breadth is 0.918 against 0.877 for men, the bust adding depth.
- Bust-to-underbust ratio in 106 US college women: 1.17 on average; bust / waist 1.26; bust circumference (cm) / BMI 4.15 (`../sources/lassek-gaulin-2016.md`, measured). Bust circumference per BMI unit in ANSUR II (chest girth) is 18.7 mm.
- Buttock: ANSUR II buttock depth / hip breadth is 0.658 (women) and 0.710 (men); buttock circumference per BMI unit 18.3 (women) and 17.0 (men) mm. Women carry their hip breadth wider and flatter relative to depth.

## Open questions

- Subcutaneous fat thickness per site (skinfolds or ultrasound by region) was not read; the trunk-to-limb ratios split fat by region only coarsely.
- A breast volume relation to bust and underbust girths and to age (ptosis) has no measured source read.
- ANSUR II is a military sample with narrowed adiposity tails; NHANES microdata (thigh, calf and arm girths for 1999 to 2006 with DXA) would extend the fits to the civilian range but were not downloaded.
- Women's appendicular lean mass index past 65 was unreadable in the supplement (20 to 65 now read: 6.81 to 6.67); infant composition below 5 years was not read.
- How muscularity (lean mass) should be distributed across muscles: no regional muscle-volume source read.
