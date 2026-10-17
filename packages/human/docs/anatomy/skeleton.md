# Skeleton

The skeleton is generated first (#2793): joint centres, bone lengths and palpable landmarks from named measurements, on `AutoMovieHumanoidBone`. Measurements are taken in the anthropometric standing posture (arms hanging, palms in), so joint centres are solved there and then expressed in `HUMANOID_REST_FRAME` (T-pose), never measured in it.

## Joint centre heights (adults)

Joint centres from ANSUR II landmark heights plus de Leva's landmark-to-centre offsets (`../sources/ansur-ii.md`, `../sources/de-leva-1996.md`). Grade: derived (measured landmarks, offsets measured on another population). Regressions are on stature S in mm, ANSUR II working databases.

| Joint centre | Rule | Women mean (/S) | Women fit | Men mean (/S) | Men fit |
| --- | --- | --- | --- | --- | --- |
| Shoulder | acromial height - 33.7 (F) / 34.5 (M) | 1301 (0.799) | -130.6 + 0.8793 S (resid 13.7) | 1406 (0.801) | -161.4 + 0.8926 S (16.2) |
| Elbow | acromial height - acromion-radiale + 13.9 / 14.3 | 1038 (0.637) | -48.9 + 0.6673 S (14.7) | 1120 (0.638) | -91.6 + 0.6898 S (16.5) |
| Wrist | stylion height - 1.5 | 793 (0.487) | -35.0 + 0.5083 S (19.9) | 846 (0.482) | -67.9 + 0.5204 S (21.5) |
| Hip | trochanterion height + 2.8 / 3.2 | 848 (0.521) | -124.1 + 0.5970 S (23.0) | 904 (0.515) | -166.7 + 0.6098 S (25.9) |
| Knee | tibiale height + 29.4 / 33.5 | 467 (0.287) | -74.2 + 0.3325 S (13.1) | 502 (0.286) | -85.6 + 0.3344 S (13.5) |
| Ankle | lateral malleolus height (de Leva's shank endpoint) | 63 (0.039) | 6.0 + 0.0348 S (4.6) | 73 (0.042) | 5.0 + 0.0387 S (5.0) |

Resulting segment lengths (mm, fraction of stature): upper arm 264 (0.162) F, 286 (0.163) M; forearm 245 (0.151), 274 (0.156); thigh 381 (0.234), 402 (0.229); shank 404 (0.248), 429 (0.244); cervicale to hip centre 548 (0.336), 613 (0.349); vertex to cervicale 233 (0.143), 239 (0.136). Shank / thigh 1.06 to 1.07 and forearm / upper arm 0.93 F, 0.96 M. De Leva's joint-centre lengths for his young athletic sample: thigh 368.5 F / 422.2 M, shank 432.3 / 434.0, upper arm 275.1 / 281.7, forearm 264.3 / 268.9 at stature 1735 / 1741 mm; his thigh is 20 mm longer than ours for men, an unresolved difference (see open questions).

Each fit has a residual SD of 13 to 26 mm: two people of the same stature differ by that much in each height, so the generator takes segment proportions as their own parameters (sitting height ratio, leg length) and uses these fits only as defaults.

## Hip joint centre in the pelvis

From Hara et al. 2016 (`../sources/hara-2016.md`), CT, ages 5 to 40, both sexes, one equation. Pelvic frame: origin at the midpoint of the anterior superior iliac spines (ASIS), X anterior, Y lateral, Z superior; LL = ASIS to medial malleolus (mm).

- X = 11 - 0.063 LL; Y = 8 + 0.086 LL; Z = -9 - 0.078 LL (errors 5.2, 4.4, 3.8 mm).
- For LL = 900 mm: the centre is 46 mm behind, 85 mm lateral to and 79 mm below the ASIS midpoint, so the hip centres are about 170 mm apart.
- With pelvic depth PD (ASIS to PSIS midpoints) known instead: X = 5 - 0.353 PD, Y = 19 + 0.459 PD, Z = -24 - 0.380 PD (errors 4.2, 3.5, 4.3 mm).

The skeleton therefore places the pelvis landmarks (ASIS, PSIS, iliac crest) first and hangs the hip centres from them, which keeps the iliac crest and ASIS where the surface shows them.

## Trunk segmentation and the VRM spine

De Leva's trunk parts give boundaries that are surface landmarks: upper trunk suprasternale to xiphion, middle trunk xiphion to omphalion, lower trunk omphalion to mid-hip (`../sources/de-leva-1996.md`). A proposed mapping to the four torso bones:

| Bone | Proposed span | Landmark basis |
| --- | --- | --- |
| `hips` | mid-hip (between hip centres) up to omphalion level | lower trunk part; iliac crest top at L4 (imaged) |
| `spine` | omphalion to xiphion | middle trunk part; lumbar lordosis lives here |
| `chest` | xiphion to the level of the inferior scapular angle (T8) | lower thoracic cage |
| `upperChest` | T8 to cervicale (C7) | upper cage, shoulder girdle base |
| `neck` | C7 to the skull base | |

Vertebral levels of surface landmarks, all measured against imaging:

| Landmark | Level | Source |
| --- | --- | --- |
| Cervicale (most prominent C7 spine) | C7 | ANSUR II definition |
| Inferior angle of the scapula, upright | T8 on average, range T4 to T11 (the T7 rule is conventional) | `../sources/cooperstein-2015.md` |
| Iliac crest tops (bone) | L4 spinous process (men), L4-5 interspace (women) | `../sources/cooperstein-2015.md`, `../sources/chakraverty-2007.md` |
| Iliac crest palpated through skin | 0.7 to 1.0 levels higher (L3-4), more in women and at high BMI | same |
| PSIS dimples | S2 (51%) or S1 (44%) | `../sources/chakraverty-2007.md` |
| Umbilicus | 2 to 2.5 cm above the iliac tubercles, above the body's midpoint | `../sources/gray-1918.md` |
| Lower trapezius border | from the root of the scapular spine to the T12 spine | `../sources/gray-1918.md` |

## Sagittal curvature

| Quantity | Young adult | Old age | Source and grade |
| --- | --- | --- | --- |
| Thoracic kyphosis (Cobb) | 20 to 29 deg | 35 to 38 deg at 65+ (35 to 42 across cohorts); 50+ deg is hyperkyphosis, 20 to 40% prevalence in older adults | `../sources/koele-2020.md`, measured (cited) |
| Pelvic incidence | 52.6 +- 10.4 deg, no age or sex effect | unchanged | `../sources/mac-thiong-2011.md`, measured |
| Pelvic tilt | 13.0 +- 6.8 deg | rises slightly with age (r 0.16) | same |
| Sacral slope | 39.6 +- 7.9 deg | falls slightly (r -0.10) | same |

PI = PT + SS is a geometric identity: pelvic incidence is a fixed shape parameter of the pelvis per identity, and tilt is posture.

### Sex, stature and arm-span correspondence

Sex-specific ANSUR II regressions retain adult allometry: sitting-height/stature is 0.544 at 0.88 median stature versus 0.512 at 1.12; biacromial/stature is 0.233 versus 0.217. Head-size stature elasticities are about 0.1 to 0.4, not square-root scaling (`../sources/ansur-ii.md`). Absolute and relative dimensions need separate comparisons on a common physical scale.

De Leva Table 1 measured acromion-radiale with 90-degree arm abduction at 235.9 mm (women) and 244.8 mm (men), against derived adducted distances 322.7 and 330.5 mm: reach ratios 0.731 and 0.741. From bone-pin data, the clavicle elevates 6 and retracts 16 degrees about the sternoclavicular joint; the scapula rotates upward 11 and tilts back 19 degrees about the acromion (`../sources/ludewig-2009-shoulder-complex.md`). These are posture-specific observations, not a rigid arm rotation about a stationary shoulder centre.

The span-constrained model still needs an unexplained medial shoulder residual of 50 to 51 mm per side in women, 59 mm in men and 21 to 49 mm in children. This is a model discrepancy, not a measured anatomical translation. The source means give span/stature 1.019 for women and 1.033 for men; derived age courses give 0.98 to 1.00 in children and 1.05 to 1.06 at 80 as the spine shortens. The physical source of the residual remains open.

### Sagittal curvature model

The posture model uses pelvic tilt (PT), sacral slope (SS), thoracic kyphosis T2-T12 (TK), sagittal vertical axis (SVA) and craniovertebral angle (CVA), by age and sex. Angles below are degrees; SVA is millimetres:

| Source | Ages | Values |
| --- | --- | --- |
| `../sources/mac-thiong-2011-pediatric.md` | 3-10, 10-18 (pooled) | PT 5.5, 7.7; SS 38.2, 39.1; TK 42.0, 45.8; SVA (Cil 2005) +25 at 3-6 down to -9 mm at 13-15 |
| `../sources/asai-2017-wakayama.md` | under 50 to 80+, by sex | PT 11.5 to 19.7 (men), 14.5 to 25.2 (women); SS = PI - PT; TK 33 to 40-44; SVA -11/-19 to +39/+52 mm |
| `../sources/zarate-tejero-2024-cva.md` | 18-75, by sex | CVA 47.5 (men), 50.1 (women) at 45, -1.6 a decade |

Geometry (`curveAutoMovieHumanSpine`): column heights from the identity (sacral plate 1.25 lumbar segments under the crest, lumbar segment 18/46/5 of the C7-S1 height from Gray's column lengths, C7 at cervicale); the plate's midpoint behind the hip axis by PT; tangent SS at the plate; Roussouly's arcs (`../sources/roussouly-2011-biomechanical.md`) with the lumbar apex at L3-4, the inflection at mid-T12 and the thoracic apex at T7 (Gray 1918: thoracic curve from mid-T2 to mid-T12, most prominent behind at T7; lumbar curve from mid-T12, lower three vertebrae most convex; the lumbar curve forms at 12 to 18 months with walking). Lordosis is solved so C7 stands at the identity's SVA over the plate's posterior superior corner. The head is carried so the line from the cervicale skin point to tragion rises at the CVA; the shoulders stand in the coronal plane of the jugular notch (conventional).

Finding: with Asai's angles the arc model needs a lordosis 15 to 20 degrees larger than Asai measured (solved 64-73 against 48-52 in adults under 50; 47-53 against 39 at 80+) to put C7 at the measured SVA. The measured balance and kyphosis are honoured and the lordosis absorbs the model's error; a measured distribution of curvature per level (segmental angles) would remove it. The rib cage and pelvis are rigid masses that bend, twist and tilt against each other through the lumbar spine (`../sources/bridgman-1920.md`, conventional); at rest the thorax leans back over the lordosis while the pelvis tilts forward, which gives the counter-tilt the trunk generator expects.

## Breadths and sex differences

ANSUR II means (mm) and ratios (`../sources/ansur-ii.md`, measured):

| Measure | Women | Men |
| --- | --- | --- |
| Biacromial breadth (bony shoulders) | 365.3 (0.224 S) | 415.7 (0.237 S) |
| Bicristal breadth (iliac crests, compressed) | 273.3 (0.168 S) | 275.4 (0.157 S) |
| Biacromial / bicristal | 1.344 (SD 0.110) | 1.513 (SD 0.090) |
| Hip breadth (soft tissue, standing) | 353.8 | 345.7 |

Women's bony pelvis is as wide as men's in absolute terms and wider relative to stature, while their shoulders are 50 mm narrower; the sex difference in the shoulder-to-hip ratio is mostly shoulder, not pelvis. Bicristal breadth regresses weakly on stature (R2 about 0.5), so it is its own parameter. Duval (`../sources/duval-1905.md`) records that the classical formula giving women hips as wide as shoulders exaggerates the female hip; ANSUR agrees (bideltoid / hip breadth 1.28 in women).

## Palpable landmarks and how they show

From Gray 1918 surface anatomy (`../sources/gray-1918.md`), conventional for a lean adult. These become named skeleton coordinates for later parts.

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

## Bone hierarchy constraints from `interface`

`AutoMovieHumanoidBone` has one clavicle bone (`leftShoulder`) and no scapula, so scapular protraction, elevation and upward rotation must be expressed by the shoulder bone; the inferior angle and vertebral border must still move on the rib cage. The spine has four torso bones for 24 vertebrae, so lumbar lordosis and thoracic kyphosis are distributed over `spine`, `chest` and `upperChest` as rest rotations. The rest frame is a T-pose with the shoulders at 90 deg abduction, while every landmark above is measured with the arms hanging; de Leva notes acromion-radiale is markedly shorter with the arm abducted 90 deg, because the acromion moves toward the radiale.

## Derived placement assumptions

- Scaling de Leva's offsets by segment length extends adult measurements to children; child correspondence remains an inference.
- Hara's ASIS-to-malleolus length can be solved from its vertical equation and hip-centre height. ASIS lateral placement at 0.41 bicristal breadth inverts the inter-spine relation at ANSUR mean leg lengths; the inversion fails below about 300 mm leg length, so that ratio is conventional outside the calibration.
- Pooled trunk-level fractions of mid-hip-to-cervicale span are omphalion 0.245, xiphion 0.617 from de Leva's upper-trunk share, iliocristale 0.263 and axilla 0.703 (conventional).
- Placing the head joint at subnasale level is a conventional atlas/dens approximation. The 3DFN sn-gn/n-gn ratio is 0.567; placing the jaw centre 0.264 face heights below a condyle on the Frankfort plane scales Mehl's adult fitted centre and remains a derived model assumption.
- Bridgman's equal palmar pads motivate a conventional 2:1:1 phalanx split; this is not a measured bone-length distribution. Digit and metacarpal measurements are retained in `hand.md`.
- Vertical leg axes and parallel feet define the canonical rest stance, which differs from ANSUR's measurement stance.

## Open questions

- Why de Leva's thigh (HJC to KJC, 422 mm men) is 20 mm longer than our ANSUR-derived 402 mm: different knee centre definition, different population, or a trochanterion-to-hip-centre offset that is not purely vertical.
- Segmental angles of the lumbar and thoracic curves (where the arcs really turn): no source read; the solved lordosis exceeds the survey's.
- Old-age posture in children's and European samples, and infants below 3 years standing: not read; the youngest child group holds below 3 years.
- Hara's equations need ASIS-to-medial-malleolus leg length; ANSUR II has no iliospinale height, so the ASIS height must come from another source or a fitted offset from trochanterion and iliocristale heights.
- Clavicle length, scapula dimensions and the scapulohumeral rhythm (ratio of glenohumeral to scapulothoracic elevation): no source read.
- Carrying angle of the elbow and knee valgus by sex: no numeric source read (Goldfarb 2012 reports a larger carrying angle in females, abstract only).
- Whether `interface` needs a scapula bone or a Human-internal scapula driven by the shoulder bone.
- How the T-pose rest frame relates to the measured standing posture, including where the acromion and the shoulder joint centre move during abduction.
