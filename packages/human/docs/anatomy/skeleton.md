# Skeleton

Each value holds only for its cited population, posture, coordinate frame and measurement protocol. Derived ratios are research constraints, not generator defaults or clinical identity. A generated support hierarchy maps these definitions to its own frame explicitly, and a reference model's achieved posture is not a straight standing or T-pose rest frame.

## Joint centre heights (adults)

Joint centres from ANSUR II landmark heights plus de Leva's landmark-to-centre offsets ([ansur-ii](../sources/ansur-ii.md), [de-leva-1996](../sources/de-leva-1996.md)). Grade: derived (measured landmarks, offsets measured on another population). Regressions are on stature S in mm, ANSUR II working databases.

| Joint centre | Rule | Women mean (/S) | Women fit | Men mean (/S) | Men fit |
| --- | --- | --- | --- | --- | --- |
| Shoulder | acromial height - 33.7 (F) / 34.5 (M) | 1301 (0.799) | -130.6 + 0.8793 S (resid 13.7) | 1406 (0.801) | -161.4 + 0.8926 S (16.2) |
| Elbow | acromial height - acromion-radiale + 13.9 / 14.3 | 1038 (0.637) | -48.9 + 0.6673 S (14.7) | 1120 (0.638) | -91.6 + 0.6898 S (16.5) |
| Wrist | stylion height - 1.5 | 793 (0.487) | -35.0 + 0.5083 S (19.9) | 846 (0.482) | -67.9 + 0.5204 S (21.5) |
| Hip | trochanterion height + 2.8 / 3.2 | 848 (0.521) | -124.1 + 0.5970 S (23.0) | 904 (0.515) | -166.7 + 0.6098 S (25.9) |
| Knee | tibiale height + 29.4 / 33.5 | 467 (0.287) | -74.2 + 0.3325 S (13.1) | 502 (0.286) | -85.6 + 0.3344 S (13.5) |
| Ankle | lateral malleolus height (de Leva's shank endpoint) | 63 (0.039) | 6.0 + 0.0348 S (4.6) | 73 (0.042) | 5.0 + 0.0387 S (5.0) |

Resulting segment lengths (mm, fraction of stature): upper arm 264 (0.162) F, 286 (0.163) M; forearm 245 (0.151), 274 (0.156); thigh 381 (0.234), 402 (0.229); shank 404 (0.248), 429 (0.244); cervicale to hip centre 548 (0.336), 613 (0.349); vertex to cervicale 233 (0.143), 239 (0.136). Shank / thigh is 1.06 to 1.07 and forearm / upper arm 0.93 F, 0.96 M.

De Leva's joint-centre lengths for his young athletic sample are thigh 368.5 F / 422.2 M, shank 432.3 / 434.0, upper arm 275.1 / 281.7 and forearm 264.3 / 268.9 at stature 1735 / 1741 mm. His men's thigh is 20 mm longer than the ANSUR-derived one (see open questions).

Each fit has a residual SD of 13 to 26 mm: two people of the same stature differ by that much in each height, so stature alone cannot determine an individual support hierarchy.

## Hip joint centre in the pelvis

From Hara et al. 2016 ([hara-2016](../sources/hara-2016.md)), CT, ages 5 to 40, both sexes, one equation. Pelvic frame: origin at the midpoint of the anterior superior iliac spines (ASIS), X anterior, Y lateral, Z superior; LL = ASIS to medial malleolus (mm).

- X = 11 - 0.063 LL; Y = 8 + 0.086 LL; Z = -9 - 0.078 LL (errors 5.2, 4.4, 3.8 mm).
- For LL = 900 mm the centre is 46 mm behind, 85 mm lateral to and 79 mm below the ASIS midpoint, so the hip centres are about 170 mm apart.
- With pelvic depth PD (ASIS to PSIS midpoints) instead: X = 5 - 0.353 PD, Y = 19 + 0.459 PD, Z = -24 - 0.380 PD (errors 4.2, 3.5, 4.3 mm).

## Trunk segmentation and vertebral levels

De Leva's trunk parts have surface-landmark boundaries: upper trunk suprasternale to xiphion, middle trunk xiphion to omphalion, lower trunk omphalion to mid-hip ([de-leva-1996](../sources/de-leva-1996.md)).

Vertebral levels of surface landmarks, measured against imaging:

| Landmark | Level | Source |
| --- | --- | --- |
| Cervicale (most prominent C7 spine) | C7 | ANSUR II definition |
| Inferior angle of the scapula, upright | T8 on average, range T4 to T11 (the T7 rule is conventional) | [cooperstein-2015](../sources/cooperstein-2015.md) |
| Iliac crest tops (bone) | L4 spinous process (men), L4-5 interspace (women) | [cooperstein-2015](../sources/cooperstein-2015.md), [chakraverty-2007](../sources/chakraverty-2007.md) |
| Iliac crest palpated through skin | 0.7 to 1.0 levels higher (L3-4), more in women and at high BMI | same |
| PSIS dimples | S2 (51%) or S1 (44%) | [chakraverty-2007](../sources/chakraverty-2007.md) |
| Umbilicus | 2 to 2.5 cm above the iliac tubercles, above the body's midpoint | [gray-1918](../sources/gray-1918.md) |
| Lower trapezius border | from the root of the scapular spine to the T12 spine | [gray-1918](../sources/gray-1918.md) |

## Sagittal curvature

| Quantity | Young adult | Old age | Source and grade |
| --- | --- | --- | --- |
| Thoracic kyphosis (Cobb) | 20 to 29 deg | 35 to 38 deg at 65+ (35 to 42 across cohorts); 50+ deg is hyperkyphosis, 20 to 40% prevalence in older adults | [koele-2020](../sources/koele-2020.md), measured (cited) |
| Pelvic incidence | 52.6 +- 10.4 deg, no age or sex effect | unchanged | [mac-thiong-2011](../sources/mac-thiong-2011.md), measured |
| Pelvic tilt | 13.0 +- 6.8 deg | rises slightly with age (r 0.16) | same |
| Sacral slope | 39.6 +- 7.9 deg | falls slightly (r -0.10) | same |

PI = PT + SS is a geometric identity: pelvic incidence is a fixed shape parameter of each person's pelvis, and tilt is posture.

## Sex, stature and arm span

Sex-specific ANSUR II regressions keep adult allometry: sitting-height/stature is 0.544 at 0.88 median stature against 0.512 at 1.12, and biacromial/stature 0.233 against 0.217. Head-size stature elasticities are about 0.1 to 0.4, not square-root scaling ([ansur-ii](../sources/ansur-ii.md)). Compare absolute and relative dimensions separately on a common physical scale.

De Leva Table 1 measured acromion-radiale with 90-degree arm abduction at 235.9 mm (women) and 244.8 mm (men), against derived adducted distances of 322.7 and 330.5 mm: reach ratios 0.731 and 0.741. From bone-pin data, the clavicle elevates 6 and retracts 16 degrees about the sternoclavicular joint, and the scapula rotates upward 11 and tilts back 19 degrees about the acromion ([ludewig-2009-shoulder-complex](../sources/ludewig-2009-shoulder-complex.md)). These observations use different postures and populations, so a rigid arm rotation about a stationary shoulder centre cannot reconcile them.

## Breadths and sex differences

ANSUR II means (mm) and ratios ([ansur-ii](../sources/ansur-ii.md), measured):

| Measure | Women | Men |
| --- | --- | --- |
| Biacromial breadth (bony shoulders) | 365.3 (0.224 S) | 415.7 (0.237 S) |
| Bicristal breadth (iliac crests, compressed) | 273.3 (0.168 S) | 275.4 (0.157 S) |
| Biacromial / bicristal | 1.344 (SD 0.110) | 1.513 (SD 0.090) |
| Hip breadth (soft tissue, standing) | 353.8 | 345.7 |

Women's bony pelvis is as wide as men's in absolute terms and wider relative to stature, while their shoulders are 50 mm narrower, so the sex difference in the shoulder-to-hip ratio is mostly shoulder. Bicristal breadth regresses weakly on stature (R2 about 0.5), so it is its own parameter. Duval ([duval-1905](../sources/duval-1905.md)) records that the classical formula giving women hips as wide as shoulders exaggerates the female hip; ANSUR agrees (bideltoid / hip breadth 1.28 in women).

## Palpable landmarks and how they show

From Gray 1918 surface anatomy ([gray-1918](../sources/gray-1918.md)), conventional for a lean adult.

| Landmark | Surface appearance |
| --- | --- |
| Clavicle | Subcutaneous along its whole length; medial part convex forward, lateral third concave; nearly horizontal with the arm down |
| Jugular notch, sternal angle, xiphoid | Notch between sternocleidomastoid tendons; transverse ridge of the sternal angle; xiphoid in the epigastric fossa |
| Acromion | The point of the shoulder; the acromioclavicular joint shows as the clavicle end projecting above it |
| Greater tubercle of humerus | The most lateral bony point of the shoulder, beyond the acromion, with the arm hanging |
| Spine of scapula | An oblique depression ending in a dimple near the spinous processes |
| Inferior scapular angle | Palpable through latissimus |
| Medial and lateral epicondyles, olecranon | Medial epicondyle the more prominent; olecranon tip level with and nearer the medial epicondyle in extension; an equilateral triangle in full flexion |
| Radial head | A dimple below the lateral epicondyle, best seen in extension |
| Ulnar styloid, radial styloid | Ulnar styloid on the medial wrist; the radial styloid a lozenge-shaped subcutaneous area |
| Iliac crest and ASIS | Crest under the oblique roll; ASIS at the front end |
| Greater trochanter | A depression when standing (gluteus medius and minimus bulge above it); an eminence in flexion and adduction |
| Patella, tibial tuberosity, tibial crest and medial surface | Subcutaneous; knee joint line above the patellar apex in extension |
| Fibular head | Slightly above the level of the tibial tuberosity, behind and lateral to the lateral tibial condyle |
| Malleoli | Medial higher and further forward than lateral |

## Derived placement assumptions

- Scaling de Leva's offsets by segment length extends adult measurements to children; child correspondence is an inference.
- Hara's ASIS-to-malleolus length can be solved from its vertical equation and hip-centre height. ASIS lateral placement at 0.41 bicristal breadth inverts the inter-spine relation at ANSUR mean leg lengths; the inversion fails below about 300 mm leg length, so the ratio is conventional outside the calibration.
- Pooled trunk-level fractions of the mid-hip-to-cervicale span are omphalion 0.245 and xiphion 0.617 from de Leva's upper-trunk share, and iliocristale 0.263 and axilla 0.703 (conventional).
- Placing the head joint at subnasale level is a conventional atlas/dens approximation. The 3DFN sn-gn/n-gn ratio is 0.567. Placing the jaw centre 0.264 face heights below a condyle on the Frankfort plane scales Mehl's adult fitted centre and is a derived model assumption.
- Bridgman's equal palmar pads motivate a conventional 2:1:1 phalanx split, not a measured bone-length distribution. Digit and metacarpal measurements are in [hand](hand.md).

## Open questions

- Why de Leva's thigh (HJC to KJC, 422 mm men) is 20 mm longer than the ANSUR-derived 402 mm: a different knee centre definition, a different population, or a trochanterion-to-hip-centre offset that is not purely vertical.
- Segmental angles of the lumbar and thoracic curves: no source distributes measured total curvature across individual levels.
- Posture in infants below 3 years, and transfer between the cited age and population groups.
- Hara's equations need ASIS-to-medial-malleolus leg length, and ANSUR II has no iliospinale height, so the ASIS height must come from another source or a fitted offset from trochanterion and iliocristale heights.
- Clavicle length and scapula dimensions. [Ludewig's adult shoulder measurements](../sources/ludewig-2009-shoulder-complex.md) cover scapulohumeral rhythm under their elevation protocol, not a growth course or the full hanging-to-T conversion.
- Adult carrying angle and knee valgus by sex. [Kaewpornsawan's childhood carrying-angle measurements](../sources/kaewpornsawan-2018-carrying-angle.md) give the age course; holding the final child value in adults is an inference. Goldfarb 2012 reports a larger female carrying angle at abstract level.
- Where the acromion and the shoulder joint centre move during abduction.

## Stickman skeleton

The posable stickman skeleton, its joint-centre rules and the pose type's range-of-motion table are in [Joint range](joint-range.md).
