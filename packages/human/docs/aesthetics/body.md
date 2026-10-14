# Body aesthetics

The campaign's premise is that beauty follows from anatomy and proportion done well. This file separates what is measured about attractive bodies from canons and from myths, and lists the form rules that make a generated body read as well made. Facial attractiveness belongs to the face workspace.

## Proportion canons against measurement

| Canon | Claim | Measured | Verdict |
| --- | --- | --- | --- |
| Vitruvius (`../sources/vitruvius.md`) | hand 1/10, foot 1/6, cubit 1/4, breast breadth 1/4 of stature; span = stature; navel the centre | ANSUR II: hand 0.111, foot 0.151 to 0.154, olecranon to fingertip 0.270 to 0.273, biacromial 0.224 to 0.237, span 1.02 to 1.03 | Each fraction misses the mean by 7 to 10%; a historical canon |
| Eight heads (Gerdy, Leonardo) | stature = 8 head heights | 1977 US adolescents at 17 to 18: 8.03 (boys, 177 cm), 7.95 (girls, 163 cm) (`../sources/snyder-1977.md`); Duval: eight heads only at 74 inches and over, 7 to 7.5 below 72 inches (`../sources/duval-1905.md`) | Heads per stature rises with stature and age; eight is a tall ideal, not a rule |
| Equal hips and shoulders in women (Salvage and Malgaigne) | the female trunk an ellipse | ANSUR II women: bideltoid / hip breadth 1.28, biacromial / bicristal 1.34 | Exaggerates the female hip, as Duval says |
| Egyptian canon, Polykleitos | stature 19 middle-finger lengths; Blanc thought the Doryphoros followed it | only Duval's report of Blanc was read; Polykleitos' Kanon itself is lost and no account of it was read | Unverified |

Human derives proportions from measured distributions, so canons become checks that should fail in the measured way (a generated adult man of 176 cm has about 7.5 to 8 heads, not exactly 8).

## The golden ratio claim

The popular claim is that the navel divides stature in the golden ratio, navel height / stature = 1/phi = 0.618. ANSUR II (our fit, `../sources/ansur-ii.md`): navel (omphalion) height / stature is 0.6017 (SD 0.0135) in women and 0.6014 (SD 0.0129) in men; 1/phi lies 1.2 to 1.3 SD above the mean, and only 11.6% of women and 9.6% of men reach it. Grade: measured, population-fitted. The claim is false for the average body and Human never targets it. Markowsky's 1992 critique of golden-ratio claims was not readable (archive behind a browser check).

## Measured attractiveness findings

| Finding | Value | Source and grade |
| --- | --- | --- |
| Female waist size is the key cue | Attractiveness correlates with waist/stature -0.73, BMI -0.67, WHR -0.52 in 106 college women; with waist/stature in the model, BMI and WHR add nothing | `../sources/lassek-gaulin-2016.md`, measured |
| Attractive women's measured shape | Top-quartile college women: WHR 0.72, waist/stature 0.40, BMI 19.6; Playmates: WHR 0.68, waist/stature 0.36, BMI 18.5, bust/waist 1.51 | same |
| Hip size | Hip/stature varies little across attractiveness groups (0.60 to 0.53) | same |
| WHR preference band | 0.60 to 0.70 most consistently rated highly attractive, above 0.85 less so (as summarised by Lassek and Gaulin from Singh 1993 and others) | secondary; Singh's papers not read |
| BMI | BMI, not WHR, is the primary determinant once their covariation is removed; silhouette perimeter-area ratio is a visible cue to BMI | `../sources/attractiveness-abstracts.md` (Tovée 1999), measured |
| Men | Rated upper-body strength explains over 70% of men's bodily attractiveness, with tallness and leanness 80%; no peak, the strongest were most attractive | same (Sell 2017) |
| Leg-to-body ratio | Men: optimum about +0.5 SD above the mean (ANSUR 1988 men LBR 0.491, SD 0.015); arm-to-body ratio no effect; intra-limb ratio a weak peak at the mean | `../sources/versluys-2018.md`, measured |
| Leg-to-body ratio, Japan | Inverted U peaking at the mean LBR; higher LBR preferred in female figures, lower in male | `../sources/attractiveness-abstracts.md` (Kiire 2016) |
| Symmetry and dimorphism | Bodily attractiveness correlates negatively with fluctuating asymmetry in both sexes; sex-typical size and shape are rated attractive | same (Brown 2008) |

Population references for the same ratios (`../sources/ansur-ii.md`): navel-waist / buttock circumference 0.842 (women) and 0.921 (men), not comparable with the WHR studies, which measure the narrowest waist; natural waist / hip in 17- to 18-year-old girls 0.717 (`../sources/snyder-1977.md`); bideltoid / hip breadth 1.276 and 1.479; shoulder / buttock circumference 1.010 and 1.159; chest / navel-waist circumference 1.105 and 1.132.

## Rules the generator can take

1. Admission stays inside the living range: a WHR of 0.48 or a waist/stature of 0.22 (imaginary characters) belongs to a stylised profile, never the realistic one.
2. A beauty-oriented simple parameter moves detailed parameters toward measured attractive values within that range: for women a smaller natural waist at an ordinary hip (WHR toward 0.68 to 0.72, waist/stature toward 0.36 to 0.40) and a lean-normal BMI; for men broader shoulders and arms relative to the waist, lower body fat, and stature.
3. Leg length slightly above the population mean (about +0.5 SD) for men; at or slightly above the mean for women.
4. Arm-to-body and intra-limb ratios stay at the population mean.
5. Bilateral symmetry is exact by default; asymmetry is an explicit parameter.
6. Sex-typical proportions (shoulder-to-hip, waist-to-hip, fat placement) are kept rather than averaged across sexes.

## Form rules (art anatomy)

Grade: conventional, each grounded where possible in an anatomical fact from Gray 1918.

- Staggered contour peaks. Opposite contours of a limb never peak at the same height, because the muscles under them start and end at different levels: on the calf the medial gastrocnemius head is thicker and extends lower than the lateral, and the lateral soleus edge runs longer; on the thigh the vastus medialis bulges in the lower third while vastus lateralis and tensor fill the upper lateral thigh; at the elbow the lateral brachioradialis mass starts above the joint and stands higher than the medial flexor mass; at the ankle the medial malleolus is higher than the lateral (`../sources/gray-1918.md`, `../sources/bridgman-1920.md`).
- Convex and concave alternation. A contour alternates convex bellies with concave transitions at tendons and bony landmarks (the deltoid insertion depression, the cubital fossa, the popliteal fossa, the depression behind the greater trochanter), and twists around the limb axis. Hogarth's "line of beauty" (two contrasted curves) and "line of grace" (a serpentine line twisting round a cone) state the aesthetic preference (`../sources/hogarth-1753.md`); the anatomy supplies the reason.
- Masses and wedges. Head, rib cage and pelvis are rigid blocks joined by the spine that bend, twist and tilt against each other; limb masses interlock by wedges (deltoid apex into the arm, brachioradialis wedge over the elbow) rather than meeting end to end (`../sources/bridgman-1920.md`).
- Counter-tilt. In a standing body the rib cage and pelvis are not stacked level; their tilts oppose, and in contrapposto the shoulder line and hip line slope in opposite directions. No measured source for the angles was read.
- Overlap order. Pectoralis over serratus, serratus interlocking with the external oblique, latissimus over the inferior scapular angle, trapezius over the upper scapula, gluteus maximus over the posterior gluteus medius (`../anatomy/trunk.md`).
- Torso rhythm. Front profile in three nearly equal curves broken at the lower pectoral border and the navel; back profile a sharp forward waist curve between the long chest curve and the short buttock curve.
- Muscles grow toward the trunk: hand, forearm, arm, shoulder in increasing size.

## Open questions

- Bammes, Zarins (Anatomy for Sculptors), Loomis, Richer and Bridgman's later books were not read (copyright or not found); their form rules may add to the list above.
- Singh's original WHR studies and Markowsky 1992 were not read.
- Measured preferences for male shoulder-to-waist or chest-to-waist ratios as numbers (beyond Sell's strength ratings) were not read.
- Attractiveness across ages (children are out of scope; adults over 40) has no source read.
- Counter-tilt angles of rib cage and pelvis in relaxed standing and in contrapposto: no measured source.
- Whether averageness of body shape (as for faces) is attractive: not read for bodies.
