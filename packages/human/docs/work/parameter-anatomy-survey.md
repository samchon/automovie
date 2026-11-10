# Parameter anatomy survey

The Human's public input, `IAutoMovieHumanParameters`, read field by field against anatomy and measurement. Each public parameter needs a published definition (standard and measure number), a unit, a population range by sex, a reader in the construction, and an effect on the figure. This survey lists what the input holds now, who reads it, which fields are measured quantities and which are slider coordinates with no anatomical definition, and the anatomical measures the construction needs and the input lacks.

Population figures are computed from public survey data unless a note says otherwise: ANSUR 1988 working databases (Gordon et al. 1989, NATICK/TR-89/044; 2,208 women, 1,774 men; `docs/sources/ansur-1988.md`), ANSUR II (Gordon et al. 2014, NATICK/TR-15/007; `ansur-ii.md`), and the Heinz et al. 2003 body dimensions data (Heinz G., Peterson L.J., Johnson R.W., Kerk C.J., *Exploring relationships in body dimensions*, J Stat Educ 11(2); 260 women, 247 men, physically active adults; skeletal breadths in that data are the sum of both sides, given here per side). Ranges are mean plus and minus 2.326 SD (the 1st to 99th percentile of a normal fit), which `test_human_anatomy_course` uses for its bands.

## Input structure

| Field | Type | Holds | Reader |
| --- | --- | --- | --- |
| `body.controls` | `IAutoMovieHumanBodyControls`, 28 `{ value, pinned }` records | stature, three shape coordinates, 24 tapes and lengths | `AutoMovieHumanBodyLaw` (`tapes`, `column`, `arms`, `crotch`, head inputs) and `AutoMovieHumanTrunkFixed` |
| `body.measurements` | `IAutoMovieHumanBodyDimensions`, 25 nullable numbers | the same names as the controls, as an independent readout | none |
| `body.diagnostics` | rise, shoulder height | floor-relative readouts | none |
| `head` | `IAutoMovieHumanHeadIdentity` | Farkas and FaceBase craniofacial distances, ears | `AutoMovieHumanHeadConstruction`, `...HeadLandmarks`, `...HeadSolve`, `...HeadPass`, `...EarConstruction`, hair stage |
| `extremities.hands` | hand length, palm length, thumb length, hand breadth per side | ANSUR II hand measures | `AutoMovieHumanBodyLaw.arms` into `AutoMovieHumanArmConstruction` |
| `extremities.feet` | foot length, foot breadth, ankle height per side | ANSUR II and ISO 8559-1 foot measures | `AutoMovieHumanBodyLaw.feet`, `.crotch` into `AutoMovieHumanFootConstruction`, `AutoMovieHumanLegCrotchHeight`, `AutoMovieHumanLegBones` |
| `supplement` | `IAutoMovieHumanCurveSupplement` | construction support dimensions (support depths, reach partitions, recess depths) | passed through by `AutoMovieHuman` only |
| `appearance`, `pigmentation`, `pose`, `expression` | appearance choices, melanin, joint angles, action units | outside this survey | appearance and rig owners |

The structures `IAutoMovieHumanIdentity`, `IAutoMovieHumanBodyIdentity`, `IAutoMovieHumanArmIdentity`, `IAutoMovieHumanLegIdentity`, `IAutoMovieHumanComposition`, `IAutoMovieHumanSubcutaneousFat`, `IAutoMovieHumanTraits` and `IAutoMovieHumanBuildTraits` already describe an anatomical input (ANSUR II heights and breadths, segment lengths, DXA fat and lean mass, regional fat layers), and no generation file reads them. They are the anatomical vocabulary the new set takes its fields from.

### Where the body controls go

`AutoMovieHumanBodyLaw.calibrate` replaces each unknown control by the specimen's value (`AutoMovieHumanBodySpecimenCalibration.controls`, f1's source values) and hands four internal input records to the construction:

| Internal record | Fields | Built in | Pieces that read it |
| --- | --- | --- | --- |
| `AutoMovieHumanLegConstruction.IInputs` | calf, knee, thigh, hip, sex, fat, muscularity, scale | `tapes` | leg law and guides (`leg/AutoMovieHumanLegLaw`, `LegGirth`, `LegSectionLaw`, `LegStations`), `AutoMovieHumanLegPrior`, `AutoMovieHumanSkeletonLeg` (ankle from `prior.ankle.fat`, `.muscularity`) |
| `AutoMovieHumanTrunkConstruction.IInputs` | hip, highHip, waist, underbust, chest, bustSpan, neckBase, acrossShoulder, bicep, neckToWaist, shoulderToApex, frontInterscyeLength, upperArm, sex, fat, muscularity | `column` | `AutoMovieHumanTrunkSolver`, `TrunkClosure`, `TrunkLandmarks`, `TrunkPrior` (per-station `sex`, `fat`, `muscularity` coefficients), `TrunkKeys`, `TrunkFeatures`, breast pieces |
| `AutoMovieHumanArmConstruction.IInputs` | upper, lower, bicep, elbow, forearm, wrist, circumference, sex, left and right hand | `arms` | `arm/AutoMovieHumanArmLaw`, `ArmBones`, `ArmGirth`, `ElbowSpan`, `WristSpan`, `ForearmBelly`, `UpperArmCompartments`, `DeltoidSpan`, hand construction |
| `AutoMovieHumanHeadConstruction.IInputs` | head identity, height, neckLength, neck, sex, fat | `calibrate` | `HeadLandmarks` (mandible plane, nasolabial angle from `sex`), `HeadJawBody.softness` (from `fat`), `HeadPass`, `Mouth` (`sex` share), `NeckConstruction` (`NeckPrior` width, depth and place per `sex`) |
| `AutoMovieHumanFootConstruction.IInputs` | per side length, breadth, ankle; fat, muscularity | `feet` | foot pieces; `expected(stature, sex, scale)` fills a side without measures |

## Present body controls

Unit mm unless stated. "Kind" is anatomical (a published measurement at a published site) or slider (a shape coordinate with no anatomical definition). The four reference columns are the values in the f1, f2, m1 and m2 reference parameter files, M marking a value the file states was measured on the reference by the field's definition.

| Control | Definition source | Population, F / M (mean, SD) | Readers | Kind | Verdict |
| --- | --- | --- | --- | --- | --- |
| `height` | stature, ISO 7250-1 6.1.2; ANSUR II | 1628.5 (64.2) / 1756.2 (68.6), ANSUR II | everything through `statureOf` | anatomical | keep, as a plain number |
| `fat` | none: "zero and scale belong to the authoring model" | none | `LegPrior`, `TrunkPrior`, `SkeletonLeg`, `HeadJawBody.softness`, `FootConstruction` | slider | replace by body fat percentage (DXA, Kelly et al. 2009) and the regional subcutaneous fat layers (`IAutoMovieHumanSubcutaneousFat`, skinfold sites of Durnin and Womersley 1974) |
| `masculineFeminine` | none: a continuous coordinate, "does not select a sex statistics table" | none | `NeckPrior`, `TrunkPrior`, `LegPrior`, `LegLaw`, `HeadLandmarks`, `HeadJawBody`, `Mouth`, `FootConstruction.expected`, `ArmConstruction` | slider | replace by `sex` (closed choice selecting the statistics table) and the measured quantities that carry the dimorphism: biacromial and bicristal breadth, bust depth, thyroid angle, carrying angle |
| `muscularity` | none: "not a lean-mass index" | none | `LegPrior`, `TrunkPrior`, `SkeletonLeg`, `FootConstruction` | slider | replace by the appendicular lean mass index (kg/m2, DXA, Kelly et al. 2009); limb muscle follows from each girth less its fat layer |
| `chest` | ISO 8559-1 5.3.4 bust girth; ANSUR II chest circumference | 946.9 (82.7) / 1058.7 (87.4), ANSUR II | trunk solver, closure, breast pieces | anatomical | keep |
| `bustSpan` | ISO 8559-1 5.2.3 bust point width; ANSUR 1988 bustpoint-to-bustpoint breadth | 184.8 (16.2) / 215.9 (18.9), ANSUR 1988 | `TrunkClosure`, `TrunkFeatures`, `TrunkKeys`, `TrunkSolver` | anatomical, not readable on a bare skin | keep, with the ANSUR 1988 definition and range |
| `underbust` | ISO 8559-1 5.3.8 | none surveyed in ANSUR II; ANSUR 1988 chest below bust | trunk solver, breast pieces | anatomical | keep |
| `frontInterscyeLength` | intended ISO 8559-1 5.4.7 across front width, between armpit front fold points set by a rule under the arm | ANSUR 1988 measures only the back's interscye distance, 352.0 (26.5) / 401.5 (31.4) | `TrunkClosure`, `TrunkFixed`, `TrunkPrior.bodyLengths` | MetaHuman course; its landmark is fixed by a contact the skin lacks | replace by ANSUR II chest breadth (caliper across the rib cage at the chest level) and axilla height |
| `neckToWaist` | ISO 8559-1 5.4.5; ANSUR 1988 natural waist back length | 367.3 (25.0) / 412.0 (23.2), ANSUR 1988 | `TrunkClosure`, `TrunkLandmarks`, `TrunkPrior` | anatomical | keep (references corrected, M) |
| `acrossShoulder` | ISO 8559-1 5.4.3 across back shoulder width, shoulder point over the back neck point | ANSUR 1988 shoulder length 144.7 (10.8) / 150.5 (11.0) per side, biacromial 362.6 (17.4) / 397.0 (18.0) | `TrunkClosure`, `TrunkLandmarks`, `TrunkSolver` | anatomical, its shoulder point taken from the rig | keep (references corrected to the path, M); add the bony shoulder tip it hangs on, below |
| `shoulderToApex` | ISO 8559-1 5.4.10; ANSUR 1988 neck to bust point length | 268.0 (22.3) / 272.4 (18.1), ANSUR 1988 | `TrunkClosure`, `TrunkLandmarks`, `TrunkPrior` | anatomical | keep |
| `waist` | natural waist, ANSUR 1988; ISO 8559-1 5.3.10 level | 725.5 (63.0) / 839.9 (74.0), ANSUR 1988 | trunk | anatomical | keep |
| `hip` | ISO 8559-1 5.3.13; ANSUR II buttock circumference | 1021.2 (75.9) / 1019.5 (76.7), ANSUR II | trunk, leg | anatomical | keep |
| `highHip` | ISO 8559-1 5.3.12 | no survey | trunk | anatomical | keep |
| `neckBase` | ISO 8559-1 5.3.3; ANSUR 1988 neck circumference, base | 346.2 (16.3) / 408.4 (20.5), ANSUR 1988 | `NeckConstruction`, `SkeletonLaw`, `TrunkFixed` | anatomical | keep |
| `neck` | ISO 8559-1 5.3.2; ANSUR II neck circumference | 329.8 (19.2) / 397.6 (25.8), ANSUR II | head inputs, `NeckConstruction` | anatomical | keep |
| `neckLength` | none: neither ISO 8559-1 nor ANSUR II defines it | none | `HeadConstruction`, `HeadLandmarks`, `HeadPass`, skeleton | MetaHuman course | replace by cervicale height (ANSUR II 1395.7 (59.5) / 1517.3 (63.3); ISO 7250-1 takes cervicale height only sitting, 6.2.3), which with stature and head height fixes the neck's span |
| `upperArmLength` | ANSUR II acromion-radiale | 311.2 (17.2) / 335.2 (17.5), ANSUR II | `ArmBones`, `TrunkFixed`, `BodyLaw.column` | anatomical name; the references' values follow the source course (skin reads 300.8, 310.2, 326.8 against 321.2, 326.6, 368.4) | keep the definition; the references' values await a reading independent of the rig's joints |
| `lowerArmLength` | ANSUR II radiale-stylion | 241.3 (15.2) / 267.9 (15.4), ANSUR II | `ArmBones` | anatomical name, source-course values (skin 212.1, 222.3, 247.4 against 241.3, 246.3, 270.1) | keep the definition, rename `forearmLength` as `IAutoMovieHumanArmIdentity` names it |
| `bicep` | NHANES relaxed mid-upper arm circumference | NHANES 2015-2018, 20-29 y: 315 / 341 (means) | arm law, deltoid, compartments, trunk solver | anatomical | keep, rename `upperArmCircumference` |
| `elbow` | ANSUR 1988 elbow circumference, extended | 238.3 (13.4) / 277.1 (15.3), ANSUR 1988 | arm girth, elbow span | anatomical | keep |
| `wrist` | ANSUR II wrist circumference over stylion | 154.8 (7.8) / 175.9 (9.0), ANSUR II | arm girth, wrist span, hand | anatomical | keep |
| `forearm` | relaxed maximum forearm girth | Heinz 2003 (extended, palm up, maximum): 237.6 (16.8) / 282.4 (17.8) | arm girth, forearm belly | anatomical | keep |
| `inseam` | ISO 8559-1 5.7.6 inside leg length | ANSUR 1988 crotch height 771.4 (44.1) / 837.2 (46.2) | `LegCrotchHeight`, `LegPrior` | anatomical (reference row holds on all four) | keep |
| `thigh` | declared ISO 8559-1 5.3.20, horizontal widest below the gluteal fold | Heinz 2003 (below the gluteal fold): 572.0 (46.4) / 565.0 (42.5); ANSUR 1988 proximal thigh 580.3 (45.1) / 596.5 (49.3) | leg law, guides, trunk closure, groin width | anatomical name, source-course values on all four references | keep; measure the references at the 5.3.20 site |
| `knee` | ISO 8559-1 5.3.22 | ANSUR 1988 365.2 (23.3) / 386.4 (22.1) | leg law, patella | anatomical | keep |
| `calf` | ISO 8559-1 5.3.24; ANSUR II | 373.3 (28.5) / 392.3 (29.7), ANSUR II | leg law | anatomical | keep |
| `handCircumference` | ANSUR 1988 hand circumference at metacarpale | 186.2 (8.5) / 213.8 (9.7), ANSUR 1988 | `ArmConstruction.expected` | anatomical | keep |
| every `pinned` | a solver pin; no solver exists | none | none | MetaHuman authoring state | remove |
| `measurements.*`, `diagnostics.*` | readouts of the same names | none | none | MetaHuman readout | remove |

The control set is MetaHuman Creator's body measurement list, name for name (Height to Hand Circumference, then Rise and Shoulder Height as readouts, a pin per value), with MetaHuman's three body shape sliders on top. The trunk, neck and leg priors (`TrunkPrior`, `NeckPrior`, `LegPrior`) are regressions fitted over source samples (512 trunk, 280 neck) with per-station coefficients on those three sliders, so the sliders act as morph weights inside the priors.

## Present head and extremity fields

| Field | Definition source | Population | Kind | Verdict |
| --- | --- | --- | --- | --- |
| `head.length`, `cephalicIndex`, `circumference`, `height` | Farkas g-op, eu-eu over g-op, head circumference, Snyder 1977 no. 25 | ANSUR II head length and breadth; Weinberg 2016 | anatomical | keep |
| `head.faceHeight`, `faceWidth`, `mandibularWidth`, `minimumFrontalWidth` | FaceBase n-gn, zy-zy, go-go, ft-ft | Weinberg et al. 2016 | anatomical | keep |
| `head.mouthOpening`, `mandibularLaterotrusion` | Verkouteren et al. 2022 | 42.8 to 55.3, 9.1 to 10.4 | anatomical range of motion | keep |
| `head.face.*`, `head.earPair.*` | Farkas/FaceBase; Cho et al. 2025 | Weinberg 2016; Cho 2025 | anatomical | keep |
| `extremities.hands.*.handLength` | ANSUR II stylion to dactylion III | 181.1 (10.1) / 193.3 (9.9) | anatomical | keep, give a derived default |
| `extremities.hands.*.palmLength` | ANSUR II | 108.7 (5.9) / 116.5 (6.2) | anatomical | keep, derived default |
| `extremities.hands.*.handBreadth` | ANSUR II at metacarpale | 78.2 (3.8) / 88.3 (4.4) | anatomical | keep; default 0.427 / 0.414 of hand circumference (ANSUR 1988, R2 0.93 / 0.90) |
| `extremities.hands.*.thumbLength` | Snyder 1977 thumb crease to tip | children's survey | anatomical | keep |
| `extremities.feet.*.footLength` | ISO 8559-1 5.5.5; ANSUR II | 246.3 (12.4) / 271.2 (13.1) | anatomical | keep |
| `extremities.feet.*.footBreadth` | ISO 8559-1 5.5.6; ANSUR II | 92.7 (4.8) / 101.9 (5.2) | anatomical | keep |
| `extremities.feet.*.ankleHeight` | lateral malleolus height, ANSUR II; ISO 8559-1 5.1.17 outer ankle height | 62.7 (5.1) / 72.9 (5.7) | anatomical; the references' values carry no measurement note | keep; their values await a reading |
| `supplement.*` | construction support dimensions with no published site (support depths, partitions, recesses, a fillet's drop) | none | construction state | remove from the public input; the pieces derive them |

## Measures anatomy requires that the input lacks

Each row is a published measurement the construction needs to place a structure, with the piece that would read it.

| Measure | Definition | F / M mean (SD), mm | Range used, mm | Default when absent | Reader | Readable on a reference skin |
| --- | --- | --- | --- | --- | --- | --- |
| Biacromial breadth | ISO 7250-1 6.2.7; ANSUR II, acromion to acromion, bony | 365.3 (18.3) / 415.7 (19.2), ANSUR II | 300 to 470 | ANSUR II model B on stature | shoulder point: `TrunkLandmarks`, `SkeletonShoulder`, `ShoulderRing` | yes as the straight breadth of the shoulder points (f1 355.4, f2 363.2 by `test_human_anatomy_course`) |
| Acromial height | ISO 7250-1 6.1.4 shoulder height; ANSUR II | 1335.1 (58.1) / 1440.7 (63.3) | stature 0.80 to 0.84 | -96.9 + 0.8793 S / -126.9 + 0.8926 S | shoulder tip height: trunk landmarks, skeleton | yes, with the shoulder point |
| Humerus biepicondylar breadth (elbow breadth) | ISAK, epicondyles, caliper with firm pressure; NHANES III elbow breadth | 61.9 (4.2) / 72.3 (4.4), Heinz 2003 | 52 to 83 | from forearm girth: 23.05 + 0.1633 g / 29.23 + 0.1525 g (R2 0.43 / 0.38) | epicondyle and olecranon windows: `ElbowSpan`, `ArmGirth` | no: a caliper breadth compresses tissue |
| Bistyloid breadth (wrist breadth) | ISAK, radial to ulnar styloid | 49.4 (3.3) / 56.3 (3.2), Heinz 2003 | 41 to 64 | from wrist girth: 5.41 + 0.2919 g / 18.20 + 0.2213 g (R2 0.56 / 0.40) | styloid windows: `WristSpan`, hand wrist | no |
| Femur biepicondylar breadth (knee breadth) | ISAK, femoral epicondyles | 90.5 (6.0) / 97.8 (5.4), Heinz 2003 | 75 to 111 | from knee girth: 28.10 + 0.1770 g / 47.85 + 0.1343 g (R2 0.59 / 0.33) | condyle windows: `LegPatella`, `LegGirth`, knee guides | no |
| Bimalleolar breadth | ANSUR 1988 and ANSUR II, malleolus to malleolus | 64.4 (3.1) / 72.8 (3.9), ANSUR 1988; 67.0 / 74.8, ANSUR II | 56 to 82 | 20.24 + 0.0271 S / 19.45 + 0.0304 S (R2 0.30 / 0.27) | malleolar sides, ankle ring: `LegAnkleSpan`, foot ankle column | no |
| Ankle circumference | ANSUR II minimum horizontal above the malleoli | 215.7 (14.9) / 229.3 (14.6), ANSUR II | 175 to 265 | ANSUR II model B | supramalleolar span: leg ankle section | yes, a skin tape |
| Heel breadth | ANSUR 1988, the heel's maximum breadth behind the malleoli | 63.0 (4.8) / 70.1 (5.3) | 50 to 85 | from foot breadth: 11.94 + 0.5695 b / 14.59 + 0.5521 b (R2 0.34 / 0.31) | heel column: foot pieces (`IAutoMovieHumanFootSupplement.heelBreadthMm` today) | yes, a light-contact caliper breadth |
| Gluteal furrow height | ANSUR 1988, the gluteal fold's lowest point above the floor | 744.3 (43.0) / 814.4 (45.6) | stature 0.43 to 0.49 | -168.19 + 0.5600 S / -203.63 + 0.5798 S (R2 0.69 / 0.72) | the thigh girth site and the infragluteal fold: `LegInfraglutealFold`, `GlutealProfile` | yes |
| Thigh girth at ISO 8559-1 5.3.20 | horizontal widest below the gluteal fold | 572.0 (46.4) / 565.0 (42.5), Heinz 2003 | 450 to 700 | the present `thigh` | leg law | yes (`HumanAnatomyLegSites`) |
| Thumb breadth | ANSUR 1988, the interphalangeal joint's breadth | 20.7 (1.3) / 24.1 (1.4) | 17 to 29 | 5.39 + 0.1923 hand breadth / 7.62 + 0.1827 (R2 0.33 / 0.32) | thumb digit: hand pieces | no (caliper) |
| Ball-of-foot length | ANSUR II, heel to the first metatarsal head | 182.1 / 200.9 (means) | 0.70 to 0.78 of foot length | 0.74 of foot length | metatarsal heads: foot pieces | partly |
| Instep length | ANSUR 1988, heel to the instep's highest point | 179.4 (9.6) / 196.0 (10.5) | | | instep: foot pieces | partly |
| Body fat percentage | DXA fat over mass (Kelly et al. 2009) | NHANES 20-29 y means about 37 / 26 | 8 to 55 | US Navy circumference estimate from neck, waist, hip and stature (Hodgdon and Beckett 1984) | replaces `fat` in every prior | estimated from the reference's own tapes |
| Subcutaneous fat layers | skinfold sites (triceps, biceps, subscapular, suprailiac, abdomen, thigh, calf), layer about half a skinfold | Durnin and Womersley 1974 | `IAutoMovieHumanSubcutaneousFat` bounds | from body fat percentage by sex | relief windows: muscle borders and grooves in every region | no |
| Appendicular lean mass index | DXA limb lean mass over stature squared (Kelly et al. 2009) | 6.81 / 8.87 at age 20 | 4 to 13 | from the limb girths less their fat layers | replaces `muscularity` | no |

## Known modeler demands

- `acrossShoulder`: the ISO 8559-1 5.4.3 path over the back neck point (modeler 2). The four reference values were corrected to the path (395.6, 401.7, 426.7, 451.9 class values from `test_human_anatomy_course`); the shoulder point still comes from the rig, so the biacromial breadth is the bony measure that fixes the shoulder tip independently.
- `thigh`: ISO 8559-1 5.3.20, just below the gluteal fold (modeler 4). The reference values are the source's own course; the observer `HumanAnatomyLegSites.legSites` reads the 5.3.20 site on a skin.
- `ankleHeight`: lateral malleolus height (modeler 3 and 4), recomputed by the input owner since the crotch reads the inseam definition; the reference values carry no measurement note.
- Elbow and wrist bone breadths (modeler 2, who removed eight elbow and wrist pieces because a circumference over the olecranon or the styloids already holds the bones' excess and cannot separate bone from tube): humerus biepicondylar breadth and bistyloid breadth.
- Hand and foot breadths and lengths (modeler 3): present in `extremities` without defaults; heel breadth, bimalleolar breadth, thumb breadth and ball-of-foot length are missing.

## Design

### New parameter set

The public body input becomes one record of measured quantities, each optional with a survey default, grouped as the construction reads them:

| Group | Fields | Status |
| --- | --- | --- |
| Sex and stature | `sex` (closed choice), `height` (stature) | `sex` added in `body.anatomy`; `height` kept |
| Trunk tapes | chest, underbust, waist, highHip, hip, neckBase, neck (ISO 8559-1 girths) | kept |
| Trunk courses | neckToWaist (5.4.5), acrossShoulder (5.4.3), shoulderToApex (5.4.10), bustSpan (5.2.3) | kept |
| Shoulder girdle | biacromialBreadth, acromialHeight, chestBreadth, axillaHeight, cervicaleHeight | added in `body.anatomy` |
| Arm | upperArmLength (acromion-radiale), forearmLength (radiale-stylion), upper arm, elbow, forearm and wrist girths, elbowBreadth, wristBreadth | breadths added; `lowerArmLength` renamed in phase 4 |
| Leg | inseam, thigh (5.3.20), knee, calf, ankleCircumference, glutealFurrowHeight, kneeBreadth, bimalleolarBreadth | added in `body.anatomy` |
| Hand and foot | `extremities` lengths and breadths, handCircumference, thumbBreadth, heelBreadth | thumb and heel breadth added |
| Composition | bodyFatPercentage; then the regional subcutaneous fat layers and the appendicular lean mass index | percentage added; the layers and lean mass index follow once a published site share and lean-mass model are recorded |

`AutoMovieHumanBodyAnatomy.resolve(params)` returns every field filled, so a piece reads one complete record. A supplied value is the person's measure. An omitted one is the survey regression on the same person's own inputs, listed below. `sex` is supplied or follows the sign of the present `masculineFeminine` control.

### Defaults

| Field | Default, women / men | Survey, R2 |
| --- | --- | --- |
| biacromialBreadth | 137.22 + 0.1383 S / 167.13 + 0.1309 S | ANSUR 1988, 0.26 / 0.24 |
| acromialHeight | -96.9 + 0.8793 S / -126.9 + 0.8926 S | ANSUR II, 0.94 / 0.93 |
| cervicaleHeight | -90.4 + 0.9126 S / -78.1 + 0.9084 S | ANSUR II, 0.97 / 0.97 |
| sideNeckPointHeight | -81.84 + 0.9073 S / -85.89 + 0.9086 S; 62.9 (11.1) / 67.0 (11.7) above the acromion | ANSUR 1988 lateral neck height, 0.98 / 0.97 |
| suprasternaleHeight | -79.86 + 0.8655 S / -89.26 + 0.8701 S | ANSUR 1988, 0.97 / 0.96 |
| axillaHeight | -130.5 + 0.8410 S / -148.4 + 0.8413 S | ANSUR II |
| chestBreadth | 43.06 + 0.2608 chest / -8.67 + 0.3330 chest | ANSUR 1988, 0.71 / 0.81 |
| elbowBreadth | 23.05 + 0.1633 forearm / 29.23 + 0.1525 forearm | Heinz 2003, 0.43 / 0.38 |
| wristBreadth | 5.41 + 0.2919 wrist / 18.20 + 0.2213 wrist | Heinz 2003, 0.56 / 0.40 |
| kneeBreadth | 28.10 + 0.1770 knee / 47.85 + 0.1343 knee | Heinz 2003, 0.59 / 0.33 |
| bimalleolarBreadth | 20.24 + 0.0271 S / 19.45 + 0.0304 S | ANSUR 1988, 0.30 / 0.27 |
| ankleCircumference | 62.18 + 0.4062 calf / 66.38 + 0.4108 calf | ANSUR 1988, 0.61 / 0.64 |
| heelBreadth | 11.94 + 0.5695 foot breadth / 14.59 + 0.5521 foot breadth | ANSUR 1988, 0.34 / 0.31 |
| glutealFurrowHeight | 25.72 + 0.9316 crotch / 29.79 + 0.9372 crotch, crotch = inseam + ankle height | ANSUR 1988, 0.91 / 0.90 |
| thumbBreadth | 5.39 + 0.1923 hand breadth / 7.62 + 0.1827 hand breadth | ANSUR 1988, 0.33 / 0.32 |
| ballOfFootLength | 2.61 + 0.7286 foot length / 0.46 + 0.7393 foot length | ANSUR II, 0.88 / 0.86; means 182.1 (9.6) / 200.9 (10.5) |
| bodyFatPercentage | US Navy: women from natural waist, hip, neck and stature; men from the navel abdomen (the natural waist through ANSUR 1988's natural-on-omphalion fit), neck and stature | Hodgdon and Beckett 1984 |

Heinz 2003 measures the knee girth over the patella with the knee slightly flexed and the forearm girth at its maximum with the palm up, so those two predictors are near, not equal, to ISO 8559-1 5.3.22 and the relaxed forearm control.

### Conversion of the four reference inputs

| Old | New on f1, f2, m1, m2 |
| --- | --- |
| `masculineFeminine` 0.94, 0.94, -0.93, -0.97 class values | `sex` female, female, male, male, written in each file |
| `fat` | `bodyFatPercentage` takes its Navy estimate from the reference's own measured tapes (f1 about 24, m1 about 20); the slider stays until its readers move |
| `muscularity` | limb muscle follows the measured girths less their fat layers; the slider stays until its readers move |
| `neckLength` | cervicaleHeight by default from stature, until a reference reading of cervicale exists |
| `frontInterscyeLength` | chestBreadth and axillaHeight by default |
| skin-readable new fields | glutealFurrowHeight written from HumanAnatomyLegFold on f1 (768.9), f2 (764.6) and m2 (855.1); m1 shows no fold notch and keeps its default |
| caliper breadths (elbow, wrist, knee, bimalleolar, heel, thumb, biacromial) | defaults: a caliper compresses tissue, so a skin does not give the bony value |

### Readers

| Field | Owner | Piece |
| --- | --- | --- |
| elbowBreadth | modeler 2 | `arm/AutoMovieHumanElbowSpan`, `ArmGirth` epicondyle and olecranon windows |
| wristBreadth | modeler 2, modeler 3 | `arm/AutoMovieHumanWristSpan` styloid windows; hand wrist |
| biacromialBreadth, acromialHeight | modeler 2 | `TrunkLandmarks`, `SkeletonShoulder`, `ShoulderRing`: the shoulder tip |
| chestBreadth, axillaHeight | modeler 2 | `TrunkClosure`, `TrunkPrior.bodyLengths`, replacing frontInterscyeLength |
| cervicaleHeight | modeler 1 | `HeadConstruction`, `HeadLandmarks`, `HeadPass`, the skeleton's neck, replacing neckLength |
| glutealFurrowHeight | modeler 4 | `leg/AutoMovieHumanLegInfraglutealFold`, the 5.3.20 thigh site |
| kneeBreadth | modeler 4 | `leg/AutoMovieHumanLegMedialCondyle`, `LegLateralCondyle`, `LegPatella` |
| ankleCircumference | modeler 4 | the supramalleolar span's least girth |
| bimalleolarBreadth | modeler 3, modeler 4 | `foot/AutoMovieHumanFootMedialMalleolus`, `FootLateralMalleolus`, `FootMalleolusWindow`, the ankle ring |
| heelBreadth | modeler 3 | `foot/AutoMovieHumanFootHeelCorner`, heel pieces, replacing `supplement.footPair.*.heelBreadthMm` |
| thumbBreadth | modeler 3 | the thumb digit |
| bodyFatPercentage, sex | every modeler | the priors (`TrunkPrior`, `NeckPrior`, `LegPrior`), `SkeletonLeg`, `HeadJawBody`, `Mouth`, `FootConstruction.expected`, replacing the three sliders |
| sex | skin owner | `appearance/AutoMovieHumanSkin` (the milky-skin share, line 124), which reads `masculineFeminine` today |

`test_human_input_anatomy_defaults` resolves every person's anatomy and holds each default inside its sex's survey band (mean plus and minus 4 SD), each supplied value unchanged, and the resolved sex equal to the person's statistics' sex.

### Removal, phase 4

Once each reader moves, the input loses `pinned` (every control becomes a number), `measurements`, `diagnostics`, `supplement`, `fat`, `muscularity`, `masculineFeminine`, `neckLength` and `frontInterscyeLength`. The priors' slider coefficients go with them, and the overall tester's input-response rows prove that each remaining public field changes the figure monotonically.

### One record for every reader

`AutoMovieHumanBodyAnatomy.resolve(params)` returns `IAutoMovieHumanBodyMeasures`: the anatomy fields above and every body tape and length under its published name (stature, chestCircumference, underbustCircumference, waistCircumference, highHipCircumference, hipCircumference, neckBaseCircumference, neckCircumference, bustPointWidth, backNeckToWaist, acrossBackShoulderWidth, sideNeckToBustPoint, upperArmLength, forearmLength, upperArmCircumference, elbowCircumference, forearmCircumference, wristCircumference, handCircumference, inseam, thighCircumference, kneeCircumference, calfCircumference). `AutoMovieHumanBodyLaw` (`tapes`, `column`, `arms`, `crotch`, the head's neck) and `AutoMovieHumanTrunkFixed` read it, value for value as before, so the public input's shape can change while every reader keeps one record.

An unknown tape or length takes its line on stature by sex (`TAPE_ON_STATURE`): ANSUR 1988 for the trunk girths and courses, the elbow, wrist, hand, knee and calf girths and the inseam (crotch height less lateral malleolus height); ANSUR II for the neck girth below the larynx and the two arm segments; ANSUR 1988 for the proximal thigh just below the gluteal furrow; Heinz 2003 for the forearm; NHANES 2015-2018 means over mean stature for the relaxed upper arm. The top hip girth takes the mean of the waist and hip girths, its ISO 8559-1 5.3.12 level lying midway between theirs. The across back shoulder width takes 1.11 times the biacromial breadth, the ISO path over the straight shoulder-point breadth read on f1 and f2, since no survey takes the ISO path. An unknown stature takes ANSUR II's mean by sex. Girths follow stature weakly (R2 0.04 to 0.26), so these defaults place a person near the population mean for the stature, not near any one body.

### The public shape after phase 4

Once the pieces read only the resolved record, the public body input becomes one record of optional measured numbers under the published names above: `sex`, `stature`, the trunk, arm and leg tapes and lengths, the skeletal breadths, the landmark heights and the composition. Each field has its definition, unit, survey range and default. `controls` with its `{ value, pinned }` wrappers goes. The reference files, the parameter editor and the tests that build or perturb inputs (`HumanPopulationBuild`, `HumanInputResponse*`, the anatomy audits) move with it in one batch.

### Head defaults

`AutoMovieHumanHeadAnatomy.resolve(params)` returns the complete head identity from a head input in which any measure may be omitted (`AutoMovieHumanHeadAnatomy.IInput`). The vault follows stature by ANSUR II's lines (head length, head breadth through the cephalic index, head circumference, bizygomatic breadth). Facial distances take their sex's adult mean from the 3D Facial Norms (Weinberg et al. 2016, ages 20 to 40), the palpebral fissure height Gao et al. 2025's Caucasian adults, mouth opening and laterotrusion Verkouteren et al. 2022's 18-year values, the auricle Cho et al. 2025's adults, and the head height stature over 8.0 (Snyder et al. 1977). When the head pieces read the resolver, `head` becomes optional field by field in the public input.

## Progress

| Step | State |
| --- | --- |
| New measures in `body.anatomy` with sources, ranges and defaults | done: tapes and lengths under their published names, skeletal breadths, landmark heights (acromion, cervicale, side neck point, suprasternale, axilla, gluteal furrow), chest breadth, heel, thumb, ball of foot, body fat percentage |
| One resolved record for every reader | done: `AutoMovieHumanBodyAnatomy.resolve`, `AutoMovieHumanHeadAnatomy.resolve`; BodyLaw and TrunkFixed read it |
| Survey defaults for unknown tapes | done: `TAPE_ON_STATURE`; f1 specimen values no longer stand for unknown inputs in the resolver |
| Reference files | sex and gluteal furrow height written from measurement; bone breadths stay at their defaults (caliper measures) |
| Removed | `body.measurements`, `body.diagnostics`, `supplement` |
| Readers wired | sex (TrunkClosure), biacromialBreadth, acromialHeight, axillaHeight (TrunkSolver), glutealFurrowHeight (LegGirth, LegReliefs) |
| Waiting for readers | elbowBreadth, wristBreadth, kneeBreadth, ankleCircumference, bimalleolarBreadth, heelBreadth, ballOfFootLength, thumbBreadth, chestBreadth, cervicaleHeight, sideNeckPointHeight, suprasternaleHeight, bodyFatPercentage |
| Waiting for removal | `fat`, `muscularity`, `masculineFeminine`, `neckLength`, `frontInterscyeLength` (their readers move to the measures), then `controls` and `pinned` once the tests read `body.anatomy`; `head` optional field by field once the head readers use the head resolver |
| Not yet designed | regional subcutaneous fat defaults from the fat percentage, and the appendicular lean mass index, which need a published site share and lean-mass model |

## State at hand-off (2026-11-04)

Done since the progress table:

- `body.controls`, `pinned`, `fat`, `masculineFeminine`, `muscularity`, `neckLength` and `frontInterscyeLength` are removed. The public body is `body: { anatomy: IAutoMovieHumanBodyAnatomy }`, and every reader (generation, debug pieces, the editor and the tests) reads the anatomy record or its resolved measures.
- The shape priors' three coordinates are derived inside `AutoMovieHumanBodyLaw.slider`. The sex coordinate is the sex's end (±1). Adiposity is the BMI implied by the fat percentage (Deurenberg et al. 1991), as an ANSUR 1988 BMI z score over 2.326, clamped. Muscularity is 0, the priors' mean body. The neck length follows from the cervicale height, and the anterior axillary folds keep their population share.
- The reference files hold measured values only, under their anatomy names. Their own meshes, read without any generated joint by `test_human_reference_inputs`, show no gluteal notch, so the gluteal furrow height and the ISO 8559-1 5.3.20 thigh girth take their defaults. The ANSUR II minimum ankle circumference is written as read: 205.1 (f1), 208.5 (f2), 237.4 (m1) and 260.7 (m2).
- The population ends declare their sex and carry the fat percentage that their BMI implies.

Remaining:

- **Reference bodies have changed.** The sex coordinate moves from 0.79 to 0.94 to ±1, adiposity is re-derived, muscularity goes to 0, and the thigh girths go to their defaults. The four references therefore generate slightly different bodies, and the renders and seam tests need a fresh round.
- **Readers not yet wired.** No piece reads `elbowBreadth`, `wristBreadth`, `kneeBreadth`, `ankleCircumference`, `bimalleolarBreadth`, `heelBreadth`, `ballOfFootLength`, `thumbBreadth`, `chestBreadth`, `sideNeckPointHeight` or `suprasternaleHeight` yet. The pieces that should read each are in the reader table above.
- **Input-response rows.** The tester's rows for those fields are waiting on the same pieces.
- **Prior coefficients.** The shape priors' sex, fat and muscularity coefficients are still the fitted slider terms. The muscle term should go once the limb pieces read their girths less a fat layer.
- **Gluteal fold observer.** The fold does not read as a notch on the standing references, so the furrow height and the 5.3.20 thigh site need another published landmark rule.
- **Head inputs.** `head` stays a required full record, although `AutoMovieHumanHeadAnatomy.resolve` already gives every field a default. Making it optional field by field means moving the population builder and the head tests onto the resolver.
- **Not designed.** Regional subcutaneous fat defaults and the appendicular lean mass index.

## Trunk breadths and depths and their boxes

Every published breadth and depth of the trunk is a public input in `body.anatomy`, optional, with its definition, unit and population figures in `IAutoMovieHumanBodyAnatomy`, and `IAutoMovieHumanBodyIdentity` (with the arm and leg identities) now takes every measure the anatomy also declares from that declaration, so no measure has two ranges.

| Field | Definition | Site, the outline knot it is | F / M, mm (ANSUR II) |
| --- | --- | --- | --- |
| `chestBreadth` | across the rib cage under the arms, caliper, tissue compressed | front outline at the chest circumference's level | 269.3 / 289.4 (means) |
| `chestDepth` | most anterior point of the chest (the bust) to the back | side outline at the chest circumference's level | 247.4 / 253.8 (means) |
| `waistBreadth`, `waistDepth` | the torso's breadth and depth at the natural waist | front and side outlines at the natural waist | no survey at that level; at the navel 299.9 / 326.4 and 213.0 / 237.8 |
| `hipBreadth` | the most lateral points of the buttocks, standing (ISO 7250-1 6.1.12) | front outline at its own widest level | 353.8 (26.7) / 345.7 (24.2) |
| `buttockDepth` | abdomen to the buttocks' greatest posterior protrusion | side outline at the buttock circumference's level | 232.9 (24.3) / 245.8 (26.5) |
| `bideltoidBreadth` | across the deltoids, upper arms hanging (ISO 7250-1 6.2.8) | the arms' lateral outline at the deltoids | 450.3 (28.7) / 510.4 (32.5) |
| `bicristalBreadth` | iliac crest to iliac crest, tissue firmly compressed | the skeleton's iliac crests, not a skin knot | 273.3 (22.3) / 275.4 (17.5) |

Sources corrected (owner-approved derivations): ANSUR 1988's public data takes its waist breadth and depth at the navel (`WAIST_BRTH_OMPHALION`, `WAIST_DEPTH-OMPHALION`), as ANSUR II does, so no survey gives the natural waist's; ANSUR 1988 takes no bicristal breadth (`BISPINOUS_BRTH` is between the anterior superior iliac spines).

### The box check

At the chest, the natural waist and the hip (hip breadth with buttock depth and the hip girth), a convex section touching all four sides of its W by D box has a taut-tape girth from `2 sqrt(W^2 + D^2)` (the rhombus through the touch points, the shortest closed path visiting the four sides) to `2 (W + D)` (the box). `AutoMovieHumanBodyBox` holds the three boxes:

- `place`: every omitted measure is placed inside the range the supplied ones leave. A defaulted girth is held in the box; both sides defaulted beside a supplied girth are scaled together; one side defaulted is held in `G / 2 - W` to `sqrt(G^2 / 4 - W^2)`; all supplied, nothing moves.
- `diagnose`: one diagnostic per level whose supplied measures contradict (producer `human.inputs`, level 1), seeded into the calibration's diagnostics by `AutoMovieHumanBodyLaw.calibrate`; the figure is still made.
- `of`: each box's tape held at the nearest end of the range and its fullness in it, 0 at the rhombus and 1 at the box, for the trunk's fullness solve.

`test_human_input_box_consistency` reads every person and the made cases (consistent, each sign of contradiction, each omission) against the range it computes from its own geometry.

### Defaults

Each is an ordinary least squares line by sex on the girth of its own level, printed by `test_human_survey_trunk_breadths` and `test_human_survey_waist_section` (run 14:26 to 14:30 on 2026-11-04 by the supervisor in the owner's test window), and held in its box.

| Field | Default, women / men | Survey, R2 |
| --- | --- | --- |
| `chestBreadth` | 43.06 + 0.2608 chest / -8.67 + 0.3330 chest | ANSUR 1988, 0.71 / 0.81 |
| `chestDepth` | -31.82 + 0.2990 chest / -32.32 + 0.2779 chest | ANSUR 1988, 0.81 / 0.80 |
| `waistBreadth` | 31.41 + 0.3261 waist / 34.50 + 0.3186 waist | ANSUR 1988 navel section on its own girth, 0.91 / 0.92, evaluated at the natural girth (derivation) |
| `waistDepth` | -15.40 + 0.2770 waist / -12.23 + 0.2765 waist | ANSUR 1988 navel section, 0.85 / 0.87, at the natural girth (derivation) |
| `hipBreadth` | 13.45 + 0.3406 hip / 52.60 + 0.2940 hip | ANSUR 1988, 0.84 / 0.81 |
| `buttockDepth` | -42.22 + 0.2785 hip / -39.29 + 0.2927 hip | ANSUR 1988, 0.64 / 0.77 |
| `bideltoidBreadth` | 185.09 + 0.2729 chest / 180.94 + 0.3135 chest | ANSUR 1988, 0.59 / 0.70 (the shoulder circumference, not an input, would give 0.86 / 0.87) |
| `bicristalBreadth` | 67.19 + 0.5825 hip breadth / 96.96 + 0.5162 hip breadth | ANSUR II, 0.49 / 0.51 (buttock girth 0.45 / 0.42) |

The natural waist's derivation, evaluated at every surveyed natural girth, gives breadth 268.0 (20.6) / 302.1 (23.6) and depth 185.6 (17.5) / 220.0 (20.5), and no subject's natural girth falls outside the derived box; the natural level stands 74.4 (21.0) / 68.3 (17.7) mm above the navel's.

### The survey's own girths in their boxes

`test_human_survey_box_consistency` reads every subject's girth against the box of their own breadth and depth. ANSUR 1988: chest, navel waist and hip all inside, but one woman's navel girth under its rhombus; fullness (0 the rhombus, 1 the box) 0.567 (0.071) / 0.575 (0.070) at the chest, 0.298 (0.054) / 0.314 (0.046) at the navel, 0.457 (0.053) / 0.412 (0.047) at the hip. ANSUR II: 577 of 4,082 men's chest girths above the box, because its chest breadth is taken at maximum inspiration with tissue compressed; navel and hip inside, fullness 0.432 / 0.413 and 0.535 / 0.512. The Human's `chestBreadth` therefore carries ANSUR 1988's definition and line.

The references f1, f2, m1 and m2 keep the new fields at their defaults: the reference tests are retired, and the tester's input-identity audit reads each skin measure (chest depth, waist breadth and depth, hip breadth, buttock depth, bideltoid breadth once the arms hang) on the generated skin within 7 mm, ANSUR II's allowable error for chest breadth.

### Natural waist height

`waistHeight` (ANSUR 1988 waist height, natural indentation; 1056.5 (51.7) / 1127.1 (52.0)) is the site of the waist's breadth, depth and girth, now a public input. Omitted, it stands at ANSUR 1988's per-subject share of the span from trochanterion to cervicale, 0.3564 (SD 0.0335) / 0.3361 (0.0218) (`docs/sources/ansur-1988.md`), with trochanterion on ANSUR II's stature line (-126.9 + 0.5970 S / -169.9 + 0.6098 S, R2 0.74 / 0.72) and the person's cervicale. `test_human_survey_pelvis` prints its stature, tenth rib and iliocristale lines for when a direct line is wanted.

### Foot girths and the crotch's course

New optional inputs in `body.anatomy`, each defaulting by its best surveyed predictor among the Human's inputs (`AutoMovieHumanBodyCourses`; `test_human_survey_foot`, `test_human_survey_pelvis`):

| Field | Definition | F / M mean (SD), mm | Default, women / men | R2 |
| --- | --- | --- | --- | --- |
| `ballOfFootCircumference` | ANSUR II, over the first and fifth metatarsal heads | 228.1 (11.8) / 252.0 (12.9) | 32.00 + 2.1153 foot breadth / 33.53 + 2.1450 | 0.74 / 0.75 |
| `heelAnkleCircumference` | ANSUR II, round the heel and over the ankle's front | 310.3 (15.3) / 343.5 (16.6) | 66.90 + 0.9883 foot length / 70.49 + 1.0067 | 0.64 / 0.63 |
| `instepLength` | ANSUR 1988, heel to the instep's highest point | 179.4 (9.6) / 196.0 (10.5) | -2.44 + 0.7440 foot length / -1.65 + 0.7329 | 0.90 / 0.84 |
| `crotchLength` | ANSUR II, navel level front through the crotch to the navel level back | 620.8 (42.4) / 622.3 (46.7) | 256.23 + 0.3570 hip girth / 179.88 + 0.4340 | 0.41 / 0.51 |
| `posteriorCrotchLength` | ANSUR II, the crotch length's part behind the crotch point | 341.9 (28.6) / 355.9 (29.5) | 0.5509 / 0.5728 of the crotch length (SD 0.033 / 0.037) | lines 0.13 to 0.16 |

A posterior part supplied alone sets the whole by the same share. The perineum's forward place is a derivation the trunk applies: the point of the median section where the two arc lengths from the navel's level, front and back, meet.

### Limb sites and the thigh's depth

- Calf's greatest girth (ISO 8559-1 5.3.24 site): ANSUR 1988 calf height, 316.1 (24.0) / 353.4 (23.7) mm, stands at 0.6414 (0.0345) / 0.6537 (0.0269) of the way from the lateral malleolus to mid-patella (`test_human_survey_calf_site`; on stature R2 0.46 / 0.55).
- Thigh depth: the surveys take one limb depth, the thigh clearance (seated, the thigh's thickness from the seat). On the ANSUR 1988 proximal thigh girth (the Human's `thighCircumference`): 32.27 + 0.2183 g / 37.12 + 0.2197 g, R2 0.66 / 0.74; it is 0.862 / 0.887 of the depth a circle of that girth would have (seated and compressed under the thigh; ANSUR II 0.857 / 0.908) (`test_human_survey_thigh_depth`).

### Lower thigh girth

`lowerThighCircumference` (ANSUR II, at suprapatella, perpendicular to the thigh; 400.7 (35.2) / 409.3 (31.9)) is a public input for the thigh's tape above the knee. Omitted, it is ANSUR II's model B on stature, the BMI the fat percentage implies (Deurenberg et al. 1991) and ANSUR II's mean age: -45.2 + 0.1538 S + 8.00 BMI - 0.30 age / -11.8 + 0.1383 S + 6.75 BMI - 0.29 age, R2 0.71 / 0.79 (`AutoMovieHumanBodyCourses.lowerThigh`).
