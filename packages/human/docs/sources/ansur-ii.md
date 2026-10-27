# ANSUR II (2012 US Army Anthropometric Survey)

Gordon C.C. et al., *2012 Anthropometric Survey of U.S. Army Personnel: Methods and Summary Statistics*, NATICK/TR-15/007 (2014); Paquette S.P. and Parham J.L., *2012 US Army Anthropometric Working Databases*, memorandum for record (14 April 2017).

- Report: https://tools.openlab.psu.edu/publicData/ANSURII-TR15-007.pdf (read: landmarks, chapter IV definitions, sample chapter)
- Memorandum: https://tools.openlab.psu.edu/publicData/ANSURII-MFR.pdf (read in full)
- Data: https://tools.openlab.psu.edu/publicData/ANSUR_II_MALE_Public.csv and `..._FEMALE_Public.csv`- Landing page: https://www.openlab.psu.edu/ansur2/

## Licence

The memorandum states the working databases and the memorandum "have been reviewed and cleared for UNLIMITED PUBLIC RELEASE"; the report is "Approved for public release; distribution is unlimited". Both are US Government works. The 3D whole-body, head and foot scans are not public.

## Population and protocol

The working databases hold 4,082 men and 1,986 women, stratified-random subsamples of 7,435 men and 3,922 women measured October 2010 to April 2012, matched to the 30 September 2011 Army census by age, race and component. Ages 17 to 58 (mean 30.2 men, 28.9 women). Women are 49% White, 33% Black, 12% Hispanic, 3.6% Asian; men 69% White, 16% Black, 11% Hispanic, 2.9% Asian. The memorandum warns the sample is the Army, not the civilian population, and that the sexes must be analysed separately. Military fitness and weight standards narrow the low and high adiposity tails relative to civilians.

Ninety-three directly measured dimensions, right side, in millimetres to the nearest millimetre, standing erect with heels together and measurement at the maximum point of quiet respiration unless stated. Weight is stored as kg x 10 in column `weightkg`. `Heightin` and `Weightlbs` are self-reported.

## Measurement levels and definitions

| Measurement | Level or endpoints (report wording, condensed) |
| --- | --- |
| Chest circumference, depth, breadth, height | Chest point anterior: "the most anterior right point on the chest"; for women this is the most anterior point of the bust. Breadth is taken at maximum inspiration with tissue compressed |
| Waist circumference, breadth, depth, height | Omphalion: "the level at the center of the navel". Not the natural (narrowest) waist |
| Buttock circumference, depth, height | Level of buttock point posterior, the maximum protrusion of the right buttock standing |
| Hip breadth | Between the lateral buttock landmarks, standing |
| Thigh circumference | At the gluteal furrow point, perpendicular to the thigh axis |
| Lower thigh circumference | At suprapatella level |
| Calf circumference | Maximum horizontal |
| Ankle circumference | Minimum horizontal |
| Shoulder circumference | At the deltoid points, the midpoints of the deltoid muscles |
| Biacromial breadth | Between acromion landmarks, seated |
| Bideltoid breadth | Maximum breadth over the deltoids, seated |
| Bicristal breadth | Between iliocristale landmarks, tissue firmly compressed (bony) |
| Neck circumference | At infrathyroid level, perpendicular to the neck axis |
| Biceps circumference, flexed | At biceps point, arm horizontal, elbow 90 degrees, maximally contracted (not relaxed) |
| Forearm circumference, flexed | Across the elbow crease, fist clenched (not the relaxed maximum) |
| Wrist circumference | Over stylion |
| Heights | Acromion, cervicale, suprasternale, chest point, tenth rib, omphalion, iliocristale, trochanterion, buttock, crotch, midpatella, lateral femoral epicondyle, tibiale, lateral malleolus, axilla, wrist (stylion) |
| Segment lengths | Acromion-radiale, radiale-stylion, shoulder-elbow (to olecranon bottom, elbow 90 degrees), hand length (stylion to dactylion III), palm length, foot length, ball-of-foot length |

Landmark definitions: acromion, the intersection of the lateral border of the acromial process with a line down the middle of the shoulder; radiale, "the superior palpable point on the outside edge of the radius"; stylion, the inferior point of the radius; trochanterion, the superior point of the greater trochanter standing; tibiale, the superior palpable point on the medial condyle of the tibia; iliocristale, the highest palpable point of the iliac crest; tenth rib, its inferior point; crotch, "the level of the lower edge of the pubis bone"; cervicale, the most prominent point of the C7 spine.

## Fitted values (population-fitted from the working databases)

Ordinary least squares on the public working databases, per sex. Model A: `y = a + b*stature + c*mass`, millimetres and kilograms. Model B: `y = a + b*stature + c*BMI + d*age`. Values are fit within the sample ranges only (stature about 1,400 to 2,000 mm, BMI about 17 to 40, age 17 to 58).

### Means and stature fractions

| Measure (mm) | Female mean | SD | /stature | Male mean | SD | /stature |
| --- | --- | --- | --- | --- | --- | --- |
| Stature | 1628.5 | 64.2 | 1 | 1756.2 | 68.6 | 1 |
| Mass (kg) | 67.8 | 11.0 | | 85.5 | 14.2 | |
| Cervicale height | 1395.7 | 59.5 | 0.857 | 1517.3 | 63.3 | 0.864 |
| Suprasternale height | 1329.7 | 57.2 | 0.817 | 1438.6 | 61.2 | 0.819 |
| Acromial height | 1335.1 | 58.1 | 0.820 | 1440.7 | 63.3 | 0.820 |
| Axilla height | 1239.0 | 55.8 | 0.761 | 1329.1 | 59.5 | 0.757 |
| Chest height | 1171.6 | 55.5 | 0.720 | 1291.1 | 57.0 | 0.735 |
| Tenth rib height | 1056.3 | 50.0 | 0.649 | 1120.7 | 53.6 | 0.638 |
| Iliocristale height | 995.7 | 49.7 | 0.611 | 1061.6 | 52.0 | 0.605 |
| Waist (omphalion) height | 980.1 | 50.0 | 0.602 | 1056.5 | 52.2 | 0.602 |
| Trochanterion height | 845.4 | 44.7 | 0.519 | 900.9 | 49.2 | 0.513 |
| Buttock height | 833.7 | 45.7 | 0.512 | 887.9 | 49.9 | 0.506 |
| Crotch height | 782.3 | 44.6 | 0.480 | 845.9 | 46.5 | 0.482 |
| Wrist (stylion) height | 794.2 | 38.2 | 0.488 | 847.5 | 41.7 | 0.483 |
| Lateral femoral epicondyle height | 465.9 | 27.1 | 0.286 | 491.7 | 26.6 | 0.280 |
| Midpatella height | 449.0 | 26.0 | 0.276 | 488.4 | 28.1 | 0.278 |
| Tibiale height | 437.8 | 25.0 | 0.269 | 468.2 | 26.6 | 0.267 |
| Lateral malleolus height | 62.7 | 5.1 | 0.039 | 72.9 | 5.7 | 0.042 |
| Sitting height | 856.6 | 33.1 | 0.526 | 918.3 | 35.7 | 0.523 |
| Span | 1660.3 | 83.0 | 1.020 | 1814.2 | 84.6 | 1.033 |
| Acromion-radiale | 311.2 | 17.2 | 0.191 | 335.2 | 17.5 | 0.191 |
| Radiale-stylion | 241.3 | 15.2 | 0.148 | 267.9 | 15.4 | 0.153 |
| Hand length | 181.1 | 10.1 | 0.111 | 193.3 | 9.9 | 0.110 |
| Hand breadth | 78.2 | 3.8 | 0.048 | 88.3 | 4.4 | 0.050 |
| Palm length | 108.7 | 5.9 | 0.067 | 116.5 | 6.2 | 0.066 |
| Foot length | 246.3 | 12.4 | 0.151 | 271.2 | 13.1 | 0.154 |
| Foot breadth | 92.7 | 4.8 | 0.057 | 101.9 | 5.2 | 0.058 |
| Biacromial breadth | 365.3 | 18.3 | 0.224 | 415.7 | 19.2 | 0.237 |
| Bideltoid breadth | 450.3 | 28.7 | 0.277 | 510.4 | 32.5 | 0.291 |
| Bicristal breadth | 273.3 | 22.3 | 0.168 | 275.4 | 17.5 | 0.157 |
| Hip breadth | 353.8 | 26.7 | 0.217 | 345.7 | 24.2 | 0.197 |
| Chest breadth / depth | 269.3 / 247.4 | | | 289.4 / 253.8 | | |
| Waist breadth / depth | 299.9 / 213.0 | | | 326.4 / 237.8 | | |
| Buttock depth | 232.9 | 24.3 | | 245.8 | 26.5 | |
| Chest circumference | 946.9 | 82.7 | 0.581 | 1058.7 | 87.4 | 0.603 |
| Waist (omphalion) circumference | 860.9 | 99.9 | 0.529 | 940.6 | 111.7 | 0.536 |
| Buttock circumference | 1021.2 | 75.9 | 0.627 | 1019.5 | 76.7 | 0.581 |
| Thigh circumference (gluteal furrow) | 616.1 | 55.8 | 0.378 | 625.1 | 58.5 | 0.356 |
| Lower thigh circumference | 400.7 | 35.2 | 0.246 | 409.3 | 31.9 | 0.233 |
| Calf circumference | 373.3 | 28.5 | 0.229 | 392.3 | 29.7 | 0.223 |
| Ankle circumference | 215.7 | 14.9 | 0.133 | 229.3 | 14.6 | 0.131 |
| Shoulder circumference | 1028.2 | 52.9 | 0.631 | 1178.6 | 63.6 | 0.671 |
| Biceps circumference, flexed | 305.6 | 30.8 | | 358.1 | 34.6 | |
| Forearm circumference, flexed | 264.1 | 18.5 | | 310.1 | 22.0 | |
| Wrist circumference | 154.8 | 7.8 | | 175.9 | 9.0 | |
| Neck circumference | 329.8 | 19.2 | | 397.6 | 25.8 | |

### Model B girth regressions (stature mm, BMI kg/m2, age years)

| Measure (mm) | Sex | a | per mm stature | per BMI | per year | R2 | residual SD |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Chest circumference | F | -16.6 | 0.2773 | 18.68 | 1.23 | 0.75 | 41.2 |
| | M | -46.5 | 0.3149 | 18.79 | 1.06 | 0.88 | 30.6 |
| Waist (omphalion) circumference | F | -237.0 | 0.2855 | 23.56 | 1.12 | 0.78 | 47.4 |
| | M | -366.9 | 0.3389 | 23.63 | 1.93 | 0.87 | 40.6 |
| Buttock circumference | F | -88.5 | 0.3939 | 18.32 | 0.05 | 0.85 | 29.0 |
| | M | -96.6 | 0.3770 | 16.96 | -0.52 | 0.89 | 25.6 |
| Thigh circumference | F | -113.1 | 0.2348 | 13.87 | -0.23 | 0.84 | 22.6 |
| | M | -94.6 | 0.2146 | 13.37 | -0.91 | 0.87 | 21.2 |
| Lower thigh circumference | F | -45.2 | 0.1538 | 8.00 | -0.30 | 0.71 | 18.9 |
| | M | -11.8 | 0.1383 | 6.75 | -0.29 | 0.79 | 14.6 |
| Calf circumference | F | 7.8 | 0.1347 | 6.20 | -0.41 | 0.66 | 16.6 |
| | M | 33.3 | 0.1140 | 6.06 | -0.30 | 0.72 | 15.8 |
| Ankle circumference | F | 38.9 | 0.0792 | 2.34 | -0.41 | 0.43 | 11.3 |
| | M | 34.7 | 0.0779 | 2.50 | -0.38 | 0.58 | 9.5 |
| Shoulder circumference | F | 174.3 | 0.3674 | 10.56 | -0.47 | 0.70 | 29.2 |
| | M | 220.1 | 0.3577 | 12.24 | -0.28 | 0.74 | 32.4 |
| Biceps circumference, flexed | F | -46.9 | 0.0965 | 7.45 | 0.19 | 0.80 | 13.8 |
| | M | -3.1 | 0.0958 | 7.06 | -0.08 | 0.71 | 18.8 |
| Forearm circumference, flexed | F | 16.0 | 0.0913 | 4.00 | -0.09 | 0.68 | 10.5 |
| | M | 26.9 | 0.0962 | 4.07 | 0.05 | 0.66 | 12.9 |
| Wrist circumference | F | 24.7 | 0.0629 | 1.16 | -0.07 | 0.55 | 5.3 |
| | M | 28.7 | 0.0639 | 1.22 | 0.04 | 0.56 | 6.0 |
| Neck circumference | F | 101.6 | 0.0766 | 3.83 | 0.20 | 0.61 | 12.0 |
| | M | 124.8 | 0.0732 | 4.91 | 0.28 | 0.68 | 14.6 |
| Biacromial breadth | F | 84.8 | 0.1583 | 1.08 | -0.17 | 0.36 | 14.6 |
| | M | 106.3 | 0.1482 | 1.91 | -0.12 | 0.44 | 14.4 |
| Bideltoid breadth | F | 54.6 | 0.1411 | 6.58 | -0.07 | 0.76 | 14.0 |
| | M | 65.5 | 0.1476 | 6.72 | -0.01 | 0.79 | 14.8 |
| Bicristal breadth | F | -22.7 | 0.1229 | 3.50 | 0.23 | 0.48 | 16.1 |
| | M | -8.4 | 0.1291 | 2.19 | -0.11 | 0.50 | 12.4 |
| Hip breadth | F | -25.7 | 0.1443 | 5.59 | 0.07 | 0.69 | 14.8 |
| | M | -14.9 | 0.1345 | 4.59 | -0.09 | 0.72 | 12.7 |
| Chest breadth | F | 37.2 | 0.0904 | 3.30 | 0.03 | 0.51 | 13.1 |
| | M | 49.3 | 0.0911 | 2.71 | 0.17 | 0.51 | 12.8 |
| Chest depth | F | -46.2 | 0.0795 | 6.08 | 0.32 | 0.70 | 15.0 |
| | M | -52.5 | 0.0842 | 5.35 | 0.35 | 0.79 | 12.0 |
| Waist breadth | F | -88.3 | 0.1193 | 7.28 | 0.28 | 0.70 | 18.0 |
| | M | -100.8 | 0.1257 | 7.21 | 0.22 | 0.80 | 15.7 |
| Waist depth | F | -71.3 | 0.0539 | 7.28 | 0.38 | 0.73 | 16.3 |
| | M | -119.5 | 0.0798 | 6.96 | 0.81 | 0.81 | 15.0 |
| Buttock depth | F | -40.5 | 0.0740 | 5.88 | 0.10 | 0.79 | 11.3 |
| | M | -59.5 | 0.0822 | 5.75 | 0.06 | 0.83 | 11.0 |

Length regressions use ordinary least squares on stature alone: sitting height = 215.8 + 0.3935 S (F, R2 0.58, resid 21.3) and 205.8 + 0.4057 S (M, 0.61, 22.4); acromion-radiale = -34.0 + 0.2120 S (F, 0.63, 10.5) and -20.9 + 0.2028 S (M, 0.63, 10.6); radiale-stylion = -24.5 + 0.1632 S (F, 0.47, 11.1) and -14.4 + 0.1608 S (M, 0.51, 10.8); tibiale height = -103.6 + 0.3325 S (F, 0.73) and -119.1 + 0.3344 S (M, 0.74); trochanterion height = -126.9 + 0.5970 S (F, 0.74) and -169.9 + 0.6098 S (M, 0.72); lateral malleolus height = 6.0 + 0.0348 S (F) and 5.0 + 0.0387 S (M); acromial height = -96.9 + 0.8793 S (F, 0.94) and -126.9 + 0.8926 S (M, 0.93); cervicale height = -90.4 + 0.9126 S (F, 0.97) and -78.1 + 0.9084 S (M, 0.97); suprasternale height = -93.6 + 0.8740 S and -101.4 + 0.8769 S; iliocristale height = -158.0 + 0.7085 S and -150.4 + 0.6901 S; axilla height = -130.5 + 0.8410 S and -148.4 + 0.8413 S. Hand and foot on stature and mass: foot length = 37.9 + 0.118 S + 0.239 m (F, 0.55) and 44.9 + 0.120 S + 0.173 m (M); hand length = 30.8 + 0.0847 S + 0.181 m (F, 0.45) and 30.0 + 0.0883 S + 0.097 m (M). Bimalleolar breadth means 67.0 (F) and 74.8 (M) mm; ball-of-foot length 182.1 and 200.9 mm. The slopes below 1 times the mean fraction mean taller adults have relatively shorter trunks and longer legs (sitting height slope 0.39 to 0.41 against a 0.52 mean fraction).

### Head and hand allometry

Ordinary least squares on stature alone, per sex (women / men); elasticity is the slope times mean stature over the mean dimension, the percent change of the dimension per percent of stature.

| Measure | Fit (mm, S in mm) | Elasticity | R2 |
| --- | --- | --- | --- |
| Head length | 122.2 + 0.0415 S / 133.1 + 0.0378 S | 0.356 / 0.333 | 0.13 / 0.14 |
| Head breadth | 127.2 + 0.0126 S / 143.7 + 0.0061 S | 0.139 / 0.069 | 0.02 / 0.01 |
| Head circumference | 406.7 + 0.0948 S / 433.5 + 0.0802 S | 0.275 / 0.245 | 0.10 / 0.12 |
| Tragion to top of head | 90.2 + 0.0223 S / 99.8 + 0.0178 S | 0.287 / 0.239 | 0.05 / 0.04 |
| Menton-sellion length | 67.1 + 0.0282 S / 71.0 + 0.0294 S | 0.407 / 0.421 | 0.09 / 0.09 |
| Bizygomatic breadth | 107.1 + 0.0164 S / 120.0 + 0.0129 S | 0.199 / 0.159 | 0.04 / 0.02 |
| Hand length | 16.2 + 0.1012 S / 21.7 + 0.0977 S | 0.910 / 0.888 | 0.42 / 0.45 |
| Hand breadth | 32.1 + 0.0283 S / 35.8 + 0.0298 S | 0.589 / 0.594 | 0.22 / 0.22 |

Hand breadth on stature and mass: 41.6 + 0.0176 S + 0.118 m (women), 46.6 + 0.0176 S + 0.126 m (men). Heads scale with stature at a third of isometry or less, so a tall adult has a relatively small head; the hand narrows relative to its length as stature rises.

### Ratio distributions

| Ratio | Female mean (SD; p5 to p95) | Male mean (SD; p5 to p95) |
| --- | --- | --- |
| Waist (omphalion) / buttock circumference | 0.842 (0.060; 0.749 to 0.946) | 0.921 (0.059; 0.830 to 1.020) |
| Biacromial / bicristal breadth | 1.344 (0.110; 1.169 to 1.532) | 1.513 (0.090; 1.376 to 1.669) |
| Bideltoid / hip breadth | 1.276 (0.071; 1.162 to 1.395) | 1.479 (0.072; 1.366 to 1.599) |
| Shoulder / buttock circumference | 1.010 (0.053) | 1.159 (0.056) |
| Chest / waist circumference | 1.105 (0.069) | 1.132 (0.067) |
| Sitting height / stature | 0.526 (0.014; 0.502 to 0.548) | 0.523 (0.014; 0.500 to 0.544) |
| Span / stature | 1.019 (0.029) | 1.033 (0.027) |
| Crotch height / stature | 0.480 (0.015) | 0.482 (0.014) |
| Waist depth / breadth | 0.709 (0.057) | 0.727 (0.054) |
| Chest depth / breadth | 0.918 (0.076) | 0.877 (0.075) |
| Buttock depth / hip breadth | 0.658 (0.047) | 0.710 (0.050) |
| BMI | 25.5 (3.5; 20.3 to 31.7) | 27.7 (4.0; 21.4 to 34.8) |

## Limits

Army sample, adults 17 to 58 only, no children or old age. Waist is at omphalion, so its waist-to-hip ratio is not comparable with attractiveness studies that measure the narrowest waist. Flexed biceps and forearm girths are contracted, not relaxed. No upper-arm relaxed girth, no mid-thigh girth, no knee girth.
