# Rule basis of the joints campaign

The basis of every number that shapes the figure or decides admission in the code the joints campaign of #3151 changed: the breast's footprint and fold, the nails, the joints' folds, rails and blends, the digit tips, the layer and phase rules, the junction fairing and the group fit. Under the owner's acceptance principle of 2026-11-22 each rule, coefficient and constant cites a primary source with its definition, derives from the person's own fields or geometry, or is marked ESTIMATE with its reasoning; coefficients fitted to f1 alone stay provisional.

Audited on 2026-11-23 against the working tree of PR #3604 (base `9925030e437a`). Line numbers are that tree's and move with later edits.

## Evidence for the replacement construction

The geometry comparison starts from the CC0 MakeHuman HM08 body and its associated rig markers. The development reader pins the revision and checks the exact OBJ bytes before extracting the `body` group. The baseline stands with its arms partly abducted. Match the comparison pose to that chart, and use standing neutral clinical measurements only for cross-checking segment orientation in their published joint-relative frames. [MPFB asset license](https://github.com/makehumancommunity/mpfb2/blob/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a/LICENSE.ASSETS.md), [Yoshida et al. 2022](https://doi.org/10.1186/s13018-022-03113-5).

Wang's mannequin construction locates the underarm through the front and rear contour turns and builds the cross tangent from the supporting normal and the boundary tangent. The child may use a polar port only where its angular traversal is directed and its radial projection is transverse. When those premises fail, its proximal curves can be described by a parametric cross-tangent construction and joined to the regular distal chart. Preserve the parent's published position and tangent plane and the child's independently authored distal curves. [Wang 2005, sections 3.1 and 4.1](https://mewangcl.github.io/pubs/CADParaHuman.pdf), [Gabrielides et al., sections 3 and 4](https://users.math.uoc.gr/~mkaravel/files/papers/bransurf.pdf).

## Verdicts

| Verdict | Meaning |
| --- | --- |
| SOURCED | A primary source was read; its definition matches the code's quantity and covariates |
| DERIVED | Follows from the person's fields, the construction's geometry or a stated numerical-method rule |
| ESTIMATE | Reasoned in the code or its note; no source found and read yet |
| F1-FITTED | Read or tuned on f1 alone; provisional and owed to #3205 |
| UNSOURCED | No basis, or a citation whose numbers or definition do not match the code's quantity |

A row whose source was read but whose definition or subgroup differs from the code is classed by what the code actually holds, and its proposal says what would make it SOURCED.

## Summary

| Verdict | Rows |
| --- | --- |
| SOURCED | 9 |
| DERIVED | 33 |
| ESTIMATE | 58 |
| F1-FITTED | 26 |
| UNSOURCED | 3 |

Twenty-six code changes were requested from the supervisor in five batches on 2026-11-23; all were accepted, the thumb root's plane with the thenar kept on the hand's wall. The proposals under each part restate them with their sources. The largest visible effects are the inframammary fold's level (about 19 mm on f1 from the sex-mismatched umbilicus share), the fold widths and rails held in absolute millimetres at every joint, and the f1-traced armscye and thumb landmarks.

## Breast footprint and fold

Files: `AutoMovieHumanF1Mammary.ts` (M), `AutoMovieHumanMoundLaw.ts` (ML), `AutoMovieHumanF1.ts` (F1).

| Constant | Value | Role | Basis stated | Verdict |
| --- | --- | --- | --- | --- |
| `CSL_MM` (M:39) | 100.5 mm | Up extreme, with `CNL_MM` | Demiroz 2021, CSL | SOURCED |
| `CNL_MM` (M:42) | 192.5 mm | Up extreme | Demiroz 2021, CNL | SOURCED |
| Up extreme on the oblique line (M:136) | `CSL/CNL` along midclavicular to bust | Placement | Demiroz 2021 | ESTIMATE |
| Midclavicular point (M:135) | Midpoint of suprasternale and shoulder point | Up extreme's origin | Clavicle's middle | ESTIMATE |
| `XIPHION_SHARE` (M:49) | 0.700 | Sternum length for the medial reach | de Leva via SkeletonLaw | UNSOURCED |
| `OMPHALION_SHARE` (M:55) | 0.278 | Umbilicus height for the fold | de Leva via SkeletonLaw | UNSOURCED |
| `TAP_INDEX` (M:64) | 0.590 | Fold's lowest point | Fujisawa 2021 | SOURCED |
| Surface distances as heights (M:141) | Height ratio | Fold level | Stated as ESTIMATE | ESTIMATE |
| `STERNUM_HALF_SHARE` (M:73) | 25.8 / 2 / 133.1 | Medial reach | Atesoglu 2018 | SOURCED |
| Lateral extreme (M:143) | Anterior axillary line through the armpit front fold point | Lateral reach | UCLA Health web page | ESTIMATE |
| Quarter ellipses (M:160) | Four quarters on the reaches | Footprint outline | Stated as ESTIMATE | ESTIMATE |
| `FOLD_SHARE.lower` (M:84) | 0.03 of footprint height | Fold radius, lower third | Judged on frames | ESTIMATE |
| `FOLD_SHARE.upper` (M:84) | 0.18 | Fold radius, upper half | Judged on frames | ESTIMATE |
| `FOLD_SHARE.reach`, `cap`, `bound` (M:84) | 0.0075, 0.3, 0.04 | Band half width, chord cap, bound reach | Judged on frames | ESTIMATE |
| Clock bands (M:100) | 120 to 240 deg lower, 270 to 90 upper, mean at 105 and 255 | Where each radius holds | Judged on frames | ESTIMATE |
| `CLOCKS` (M:108) | 240 | Loop samples before its spline | Sampling | DERIVED |
| Three-turn natural cubic (M:209) | Middle turn read | C2 closure of the loop | Spline end effects | DERIVED |
| Breast carried back (F1:2369) | 2 mm behind the loop's deepest station | Every loop point has a section plane | Geometric margin | ESTIMATE |
| `BASE_EXPONENT` (ML:38) | 0.17 | Base radius growth with volume | "Breast CT study, 219 women", unnamed; per-cup numbers from summaries | ESTIMATE |
| Under-bust site (`AutoMovieHumanF1NativeSites.ts`:272) | Lowest station of the stored reference loop | ISO 8559-1 5.3.8 level for calibration | The reference mammary control | F1-FITTED |

### Breast proposals

- `OMPHALION_SHARE`: read the person's own umbilicus, the `omphalion` site of `AutoMovieHumanF1NativeSites` (ANSUR II, the navel pit), and place the fold at `TAP_INDEX` of the way from suprasternale to it. Fujisawa measures to the umbilicus's superior border, so state the border-to-centre offset as ESTIMATE or read the navel net's upper rim. Fallback for a person without the site: de Leva's women, 181.5 / 529.3 = 0.343 of mid-hip to suprasternale. The current 0.278 is the sexes' average, which de Leva's table does not hold, and puts f1's fold about 19 mm lower than the women's value.
- Fold level along the skin: Fujisawa's SN-IMFM and SN-UB are distances on the body, so take the fold's level at arc length `TAP_INDEX x L(SN to umbilicus)` down the trunk's anterior median line, which removes the heights ESTIMATE. ANSUR II's waist front length is the same tape (women 355.1 mm, SD 23.9, sitting).
- `TAP_INDEX`: keep 0.590 and state its covariate. Fujisawa's Table 2 gives 0.582 under 50 years and 0.603 from 50, age the only independent factor; f1 has no age field, so 0.590 is the sample mean (age 48.2, BMI 22.4).
- `XIPHION_SHARE`: 1 - 142.5 / 529.3 = 0.731, de Leva's women's suprasternale-to-xiphion over suprasternale-to-mid-hip, with no cervicale conversion.
- `STERNUM_HALF_SHARE`: the breast's medial extreme lies at the 4th and 5th interspaces, so take Atesoglu's width there, 27.8 mm, giving 27.8 / 2 / 133.1 = 0.104. The widths are bone breadths between the costal notches' midpoints and the lengths straight MDCT distances; the comment says so.
- Up extreme: Demiroz's Figure 1 draws CSL as a vertical drop from the midclavicular point, so place the up extreme `CSL/CNL x |CNL|` vertically below that point (accepted by the supervisor).
- `BASE_EXPONENT`: the study is Huang SY, Boone JM, Yang K et al., The characterization of breast anatomical metrics using dedicated breast CT, Med Phys 2011;38(4):2180-2191 (219 datasets; its abstract, read through Europe PMC, states that diameter and length grow with cup size). Name it in the comment. The per-cup volumes and effective diameters the slope uses were not found in the abstract and the full text was not reachable, so the exponent stays a provisional ESTIMATE until the table and the diameter's definition (prone, dedicated breast CT) are read.
- Under-bust site: ISO 8559-1 5.3.8 places the under-bust level directly below the breast, which the footprint now generates. Its fold level depends only on suprasternale and the umbilicus site, not on the calibrated girths, so the site can read that level instead of the stored f1 loop without the circularity the code's comment guards against.

- Clock bands: the crisp fold is the inframammary fold's zone of adherence, where the superficial fascia's collagen bundles insert into the dermis at or just below the fold (Boutros 1998: an intradermal structure of regular collagen arrays parallel to the fold; Muntan 2000, 12 cadavers: no ligament, insertions "consistently from the sternum to the middle axillary line"). The tethered crease therefore runs along the footprint's whole lower border, from the medial extreme through the lowest point to the lateral extreme, not only over the lower third. Proposed: the lower radius over the clocks 90 to 270 degrees, the upper radius over the upper half, their mean at 75 and 285 degrees. The extent then has a source; the radii stay ESTIMATE.

The fold radii stay ESTIMATE: no published radius, crease profile or band width of the inframammary fold, and no measure of how the upper pole runs onto the chest, was found and read. The 45:55 pole proportion and the "straight or mildly concave" upper slope attributed to Mallucci and Branford (J Plast Reconstr Aesthet Surg 2012;65:8-16) describe a preferred ideal judged on photographs, were reached only through secondary summaries, and give no radius. Expressing the radii as shares of the footprint's height already makes them scale with the person.

## Nails

Files: `AutoMovieHumanF1Nails.ts` (N), `AutoMovieHumanNail.ts` (L).

| Constant | Value | Role | Basis stated | Verdict |
| --- | --- | --- | --- | --- |
| Finger `width` (N:80-84) | 13.2/18.8, 11.1/15.4, 11.5/15.1, 10.7/14.4, 8.8/12.0 | Nail width over DIPJ breadth | Jung JW 2015, women | SOURCED |
| Finger `aspect` (N:69) | 0.91 | Width over fold-groove-to-fingertip length | Jung JW 2015, women | SOURCED |
| Finger `radius` (N:80-84) | 9.6/13.2, 7.4/11.1, 7.3/11.5, 6.8/10.7, 5.2/8.8 | Crown radius over width | Jung JW 2015, women | SOURCED |
| Finger `thickness` (N:80-84) | 0.48, 0.47, 0.47, 0.45, 0.42 mm | Plate thickness, free edge, cap | Bellinato 2023, sexes not separated | ESTIMATE |
| `PLATE`, `fold` (N:63) | 0.46 mm | Fold lip over the plate | One mean plate thickness | ESTIMATE |
| `lunula` (N:69) | 1 | Fold arc radius over width | Estimate | ESTIMATE |
| `wrap` (N:69, 85-89) | 0.40, 0.343, 0.317 | Edge depth bound midway | Ha 2024 D:Y | ESTIMATE |
| Toe `width` (N:75) | 0.65 | Nail width over toe breadth | Estimate | ESTIMATE |
| Hallux `aspect` (N:85) | 1.1 | Width over length | Estimate | ESTIMATE |
| Hallux `thickness` (N:85) | 0.585 mm | Plate thickness | Lopez Ripado 2024, women, table 3 | SOURCED |
| Lesser toe `aspect` (N:86-89) | 8.8 / 5.68 | Width over length | Palomo-Lopez 2020, matrix width over bed length | UNSOURCED |
| Lesser toe `thickness` (N:86-89) | 0.46 mm | Plate thickness | Fingernails' mean | ESTIMATE |
| `CHORD_MM` (N:93) | 0.23 mm | Merge blend chord cap | A quarter of the bed's ramp | DERIVED |
| `SKIN.before` (N:96) | 3 mm | Skin chart opening before the last joint | Aperture margin | ESTIMATE |
| `SKIN.station`, `phases` (N:96) | 0.25 mm, 360 | Skin net sampling | Chord error about 2 um | DERIVED |
| `TURN` (N:223) | 0.145 rad | Roll prior's spread | RMS of seven f1 tilts | F1-FITTED |
| `CURVE_MM`, `COLUMNS` (N:291-294) | 40 mm, 96 | Fold join's columns | f1's fold curve length | ESTIMATE |
| Merge `grazing`, seed window (N:352-361) | 0.04 rad, shares 0 to 0.7 | Fold merge trace | Admission on f1 | ESTIMATE |
| Curvature width `share` (N:354) | 0.5 | Rail chord over turn radius | Rail never runs backward | DERIVED |
| Side margin (N:210) | 3 x `CHORD_MM` | Side extreme outside the edge | Room for the merge's rail | DERIVED |
| `NET` (L:196) | 0.5 | Net cell over ramp half width | Lofting skill's quarter rule | DERIVED |
| `UNDER` (L:199) | 0 | Bed depth under the face | Geometry | DERIVED |
| `RAMP` (L:202) | 2 | Ramp half width over fold depth | Room for the blend | ESTIMATE |
| `RING` (L:205) | 180 | Ring read before refinement | 2 deg a phase | DERIVED |
| `ELLIPSE` (L:208) | sqrt(2) - 1 | Lower face shoulder | Quarter ellipse's conic shoulder | DERIVED |
| `BED`, 0.9 (L:247, 413) | 9 stations over 0.9 of the bed | Frame fit window | Fit design | ESTIMATE |
| `FIT_RMS` (L:253) | 0.17 mm | Error of the skin's levelling evidence | Largest rms of f1's tip fits | F1-FITTED |
| Weight bounds (L:273) | 0.03, 0.85 | Conic shoulder search | Section model's bounds | DERIVED |
| Half-breadth limits (L:473, 556) | 0.45, 0.49 of the breadth | Edges kept on the skin | Geometry guard | ESTIMATE |
| Secant restart (L:517) | 8 x the asked step | Frame solve | Contraction read on f1 | ESTIMATE |
| Free edge (L:594) | Crown one thickness over the skin | Plate's end | Definition | DERIVED |
| Three cells before the tip (L:575) | 3 net cells | Pitch floor on short toes | Net's zero rings | DERIVED |
| Arch (L:618) | Bed's own arch | Lengthwise convexity | Geometry | DERIVED |
| Hidden root (L:631) | Two ramps, 1.84 mm | Plate under the fold | Published 3.9-4.1 mm not modelled | ESTIMATE |
| Flat floor (L:664) | Radius of 1000 widths | Flat bed guard | Numerical floor | DERIVED |
| Cap (L:691) | One thickness, halved to fit | Free edge's end face | Pole covered by skin | ESTIMATE |
| Twist (L:681) | One rate, least squares | Plate twist | Rigid plate | ESTIMATE |
| Net cell (L:820) | `NET / 2` x narrowest transition | Bed sampling | Quarter rule | DERIVED |

### Nail proposals

- Finger `thickness`: f1 is a woman, and Szymoniak-Lipska gives women's plates by finger: index 0.405, middle 0.39, ring 0.37 and little 0.355 mm (dominant and non-dominant averaged). The thumb was not measured there; 0.41 mm keeps Bellinato's thumb-to-index ratio (ESTIMATE). `PLATE` then follows the women's mean, 0.38 mm. This makes the fingers SOURCED.
- `TURN`: Clarke 2012 measured the nail plate's tilt to the bench on 30 volunteers with the fingers flat: index 13, middle 10, ring 5 and little 12 degrees, without SD or direction. Their rms, 10.5 degrees (0.183 rad), replaces f1's spread; toes take it as ESTIMATE.
- `wrap`: Ha's D:Y divides by Y, the plate's apex to the bottom of the distal phalanx, while the code divides by the whole skin ring's height midway, pulp included, so the bound is looser than published. No f1 digit reaches it; relabel or convert with a stated bone-to-skin share.
- Lesser toe `aspect`: the law's aspect is width over the length from the proximal fold's groove to the digit's tip (Jung JW's Figure 1B). Palomo-Lopez's distal matrix width over nail bed length leaves out the matrix's visible part and the pulp past the hyponychium, so it is another quantity. Relabel as ESTIMATE with that reasoning until a toenail width-over-length is read.
- File comment of `AutoMovieHumanF1Nails`, lines 39 and 40: the Ha sentence is cut off and runs into the next list.

The Ha D:Y values themselves (40.1, 40.2, 34.3 and 31.7 %) and their definition were read only through a search summary in this audit; the repository's earlier reading is the extracted text named in `nails.md`. The hallux nail width of 13.9 mm (Jung DJ 2015) used as a check comes from a pincer-nail study of 20 cases and 30 controls; whether that number is the controls' was not verified.

## Joint folds, rails and blends

File: `AutoMovieHumanF1.ts` (F1), with `AutoMovieHumanF1Armscye.ts` (A), `AutoMovieHumanF1ThumbRoot.ts` (T), `AutoMovieHumanF1Divide.ts` (D) and `AutoMovieHumanF1ArmEnd.ts` (E).

| Constant | Value | Role | Basis stated | Verdict |
| --- | --- | --- | --- | --- |
| Armscye fold (F1:2547) | radius 6, cap 30, reach 6 mm | Shared-loop blend | Provisional geometric prior | ESTIMATE |
| Armscye bound reach (F1:2548) | 6 mm | Bound section's reach into the arm | Same | ESTIMATE |
| `THUMB_CHORD_MM` (F1:613, 2425) | 0.5 mm, fold and bound | Thumb's shared-loop blend | Folded at 1 mm in the web | F1-FITTED |
| `FANS.*.rail` (F1:557-570) | 3 mm | Finger and toe band rail | None | ESTIMATE |
| `RAIL_MM` (F1:665) | arm 10, leg 6, breast 1 mm | Band rails | Arm's first station geometry on f1 | F1-FITTED |
| `WRIST.rail` (F1:606) | 10 mm | Hand's band rail | f1 fit's first knot interval | F1-FITTED |
| `EAR_FAIR_MM` (F1:622) | root 4, helix 1, antihelix 1 mm | Fair width about the ear's merges | Judged on f1 | F1-FITTED |
| Ear chords (F1:2579, 2599) | 0.25 and 0.5 mm | Ridge and root blends | Judged on f1 | ESTIMATE |
| Concha curvature width (F1:2630) | share 0.5, cap 0.25 mm | Concha cut's blend | Rail runs forward | DERIVED |
| `NOSTRIL_RIM_MM` (F1:875) | 1.5 mm | Nostril blend and draw-in | Reference rim roll 1.5 to 2 mm | F1-FITTED |
| `NOSTRIL_MOUTH_MM`, `SPREAD_MM` (F1:906-907) | 9, 2 mm | Nostril flare | Read on f1's fit | F1-FITTED |
| `NOSE_PROFILES`, `NOSE_RAILS_MM` (F1:692-746) | Tabled | Nose band | Read on the reference skin | F1-FITTED |
| `ARM_RAILS_MM` (F1:654) | Tabled | Arm band rail round the clock | Read on f1 | F1-FITTED |
| Attachment tolerance (F1:2200) | 1e-6 m | Column gap of a shared loop | Engine tolerance | DERIVED |
| Attachment grazing (F1:2201) | 0.2 rad | Shared-loop trace | Admission on f1 | ESTIMATE |
| Pelvis end plane (F1:2323) | Midway between the trunk's foot and hip centres' height | Crotch split plane | Registry plane | ESTIMATE |
| Arm carried to its course's start (F1:2470) | Humerus lead, 60 mm proximal | Cap's top gets a section plane | Measured on f1, loop at 17.3-23.7 mm | ESTIMATE |
| Armscye `LANDMARKS_MM` (A:55) | Four f1-traced points | Divider through the landmarks | f1's traced skin | F1-FITTED |
| Thumb root `LANDMARKS_MM` (T:26) | Three f1-traced points | Divider | f1's joint centres and skin | F1-FITTED |
| `RING_MM`, `NEAR_MM`, `CARRIED_MM` (A:36-46) | 31, 8, 22 mm | Legacy armscye contact | f1 crossings | F1-FITTED |
| `FAIR_RAD` (A:118) | 15 deg | Legacy contact smoothing | f1 skins' weave | F1-FITTED |
| `ARMSCYE_MM`, `ROW_MM`, `WEB_MM` (D:55-61) | 190, 60, 30 mm | Dividing surfaces' reach | Past f1's widest hand and foot | ESTIMATE |
| `TO_MM` (E:22) | 445 mm | Arm's face end on its course | f1's stored fit | F1-FITTED |
| Legacy port numbers (F1:952-995) | `ARMSCYE_MARGIN_MM` 6, `ARMPIT_*`, `BREAST_CHEST_MM`, `NOSE_*` | Legacy port loops | Read on f1 | F1-FITTED |

### Joint proposals

- Fold widths and rails in absolute millimetres: give each the mammary fold's rule, a share of its own joint's measured size, with the share chosen so f1 keeps today's millimetres and stated as ESTIMATE. The armscye's radius, cap and reach become shares of the master loop's station extent on the trunk (f1 130.4 mm: 0.046, 0.23, 0.046); the thumb's a share of its loop's length; each band rail a share of its child's mean section reach at the root.
- Armscye landmarks: a law from the person's own fields replaces f1's traced points, which become the plausibility check. The armpit point stands at the person's axilla height (ANSUR II; women's ratio to stature 0.7607 as the fallback), the posterior fold points at half the person's Interscye I as an arc across the back (women 373.4 mm, SD 29.8), the shoulder point at the acromion once #3187 stores it, and the anterior fold point at the armpit's level on the anterior axillary line (ISO 8559-1 3.1.13; its lateral place ESTIMATE). The thumb's root needs the same kind of law; no published thenar landmark set was read.
- Web floor: joints-one-shot.md withdrew the web proportion as unverified. A peer-reviewed review states it: the normal web slopes 45 degrees from dorsal to palmar, from the metacarpal head to the middle of the proximal phalanx, and covers about two thirds of the proximal phalanx (Braun 2016, citing Kozin 2001 and Green's, which were not read). It serves as the web floor's plausibility check, graded as a review.

## Digit tips

| Constant | Value | Role | Basis stated | Verdict |
| --- | --- | --- | --- | --- |
| `FINGER_DOME` (F1:119) | 1.5 | Dome length over reach | f1's fingers 1.36 to 1.78 | F1-FITTED |
| `THUMB_DOME` (F1:120) | 1.1 | Same, thumb | f1's thumb 1.09 | F1-FITTED |
| `TOE_DOME` (F1:121) | 0.8 | Same, toes | f1's toes 0.73 to 1.08 | F1-FITTED |
| `CAP_KNOTS` (`AutoMovieHumanConicLoft.ts`:88) | 12 | Cap knots | Ripple falls 0.27 a knot, 1e-7 left | DERIVED |
| `TAPER` (ConicLoft:95) | 0 to 0.95 | Cap taper bounds | Nose swelled 14 % past its bulb at -0.5 | ESTIMATE |
| `OWN_LEAST` (ConicLoft:81) | 0.05 | Cap coordinate share | None | ESTIMATE |
| `HALVINGS` (`AutoMovieHumanTipDome.ts`:22) | 60 | Bisection | Double precision | DERIVED |

No published fingertip pulp length over its reach was found and read. Dzidek et al. 2017 (J R Soc Interface, supplement) tabulate an index fingertip's ellipsoid semi-axes and are the candidate; the file was refused (403). The dome shares stay F1-FITTED and go to #3205.

## Layer pitch, phases and turn

| Constant | Value | Role | Basis stated | Verdict |
| --- | --- | --- | --- | --- |
| `FOLD.turn` (F1:828), `AutoMovieHumanLayerTurn` | 4 deg | Largest chord angle along the course | Piegl and Tiller, The NURBS Book, ch. 9 | ESTIMATE |
| `FOLD.sagitta`, `least` (F1:825-826) | 0.15, 0.5 mm | Relief layer insertion, floor | Judged on f1 | ESTIMATE |
| `FOLD.phases`, `fine` (F1:827-829) | 96, 192 | Rings read by the rules | Sampling | DERIVED |
| `LAYER_MM` (F1:642) | 4 mm | Base layer pitch | Engine admission on f1 at 2 and 8 mm | ESTIMATE |
| `WEB_LAYER_MM` (F1:752) | 1 mm | Layers at roots | Root facets at 4 mm | ESTIMATE |
| `FINGER_LAYER_MM` (F1:794) | 2 mm | Digit layers | Stripes at 4 mm | ESTIMATE |
| `FINGER_TURN`, `PHASE_TURN` (F1:801, 582) | 0.1; arm 0.1, leg 0.2 rad | Phase turn bound | Terraces on f1 frames | ESTIMATE |
| `BREAST_LAYER_MM`, `BREAST_PITCH_MM` (F1:855, 862) | 0.5, 1.5 mm | Breast tessellation | Facets on f1 frames | ESTIMATE |
| `TRUNK_FACE_LAYERS`, `TRUNK_PHASE` (F1:767-768) | 690 to 830 at 1 mm; 0.016 rad | Face tessellation | Earlier nets' pitch | F1-FITTED |
| `NET_LAYER_ROWS`, `NOSE_PHASE` (F1:777, 787) | Earlier row counts | Kept tessellation | Last accepted mesh | F1-FITTED |
| `THIGH_COLUMNS`, `SHOULDER_COLUMNS`, `ARMSCYE_ROWS`, `BAND` (F1:833-848) | 288, 192, 24, 96 x 8 | Band sampling | Columns under about 2 mm | ESTIMATE |
| `NOSE_COLUMNS`, `NOSTRIL_BLEND`, `NOSTRIL_LAYER_MM` (F1:868-895) | 192; 48 x 4; 0.5 mm | Nose sampling | Clip crossing and fold angles | ESTIMATE |
| `REFINE` (ConicLoft:102) | 0.5 mm, 0.05, 0.25 mm | Station insertion | Triangle budget | ESTIMATE |
| `PHASE_MM` (ConicLoft:113) | 4 mm | Phase pitch at the widest section | Steps against relief nets | ESTIMATE |

The chord-angle criterion is the standard one: the Open CASCADE mesher's angular deflection "limits the angle between subsequent segments in a polyline", with a default of 12 to 20 degrees. The cited chapter 9 of The NURBS Book is Curve and Surface Fitting and holds no tessellation tolerance, so the citation is replaced by the Open CASCADE guide. Four degrees, stricter than the CAD default because flat shading shows each facet's turn, stays an ESTIMATE judged on the heel and breast frames. The other tessellation numbers change sampling, not the generated shape, and are recorded for completeness.

## Junction fairing and the group fit

Files: `FamilyConicFairing.ts` (Fa), `FamilyConicBody.ts` (B), `FamilyConicFit.ts` (Fi), all in `test/src/reference-conics`. They decide the stored root stretches that the figure reads.

| Constant | Value | Role | Basis stated | Verdict |
| --- | --- | --- | --- | --- |
| Minimum-variation energy (Fa:22) | Sum of `((k[i+1] - k[i]) / ds)^2 ds` | Fairing objective | Moreton and Sequin 1992; Moreton thesis | SOURCED |
| Length-cubed scaling (Fa:44) | Energy x `L^3` | Scale-free energy | Dimensional analysis | DERIVED |
| Unsigned turning angle (Fa:39) | `atan2(|u x w|, u.w)` | Discrete curvature | None | ESTIMATE |
| `FAIR_LINES` (B:81) | 8 | Guide-phase lines | Four extremes and four shoulders | DERIVED |
| `FAIR_RING` (B:84) | 64 | Ring samples | None | ESTIMATE |
| Parent window (B:2369) | 40 mm before the end plane | Faired parent rings | Amendment A | ESTIMATE |
| Lines past the mark (B:2365) | Two stations | Line window | Amendment A | ESTIMATE |
| Ring and line weights (B:2563) | One each, any station spacing | Energy weighting | None | ESTIMATE |
| `TARGET_MM` (B:67) | 0.5 mm | Fork allowance, reproduction only | Campaign 1 target | F1-FITTED |
| `GAP_MM`, `STEP_MM`, `SKIN_RAYS` (B:70-90) | 12 mm, 4 mm, 720 | Fit knots and sections | Fit design | ESTIMATE |
| Whittaker weight (Fi:2088-2092) | `1 / (2 sin(pi h / FAIR_MM))^4` | Smoother halving `FAIR_MM` | Eilers 2003 | DERIVED |
| `FAIR_MM` (`FamilyConicFair.ts`:33) | 20 mm | Fairing cutoff | Trunk's narrowest kept feature | F1-FITTED |
| `RIDGE` (Fi:136) | 1e-4 | Regularisation | Decides open directions only | ESTIMATE |
| `EDGE`, `BARRIER_MM` (Fi:139-142) | 0.06, 50 mm | Share barrier | None | ESTIMATE |
| `ADMISSIBLE_MARGIN` (Fi:171) | 0.1 | Tangent-meeting margin | Trunk refusal on f1 | F1-FITTED |
| `CONSTRUCT_MARGIN` (Fi:178) | 0.02 | Constructed family margin | f1 armpit vault | F1-FITTED |
| `DENSE_MM`, `SEED_NEAR_MM`, `KNOT_LEAST_MM` (Fi:145-160) | 0.25, 1, 2 mm | Admission grid, start, knots | Section spacing | DERIVED |
| `BARRIER_SHARE`, `BARRIER_LEVELS`, `HOMOTOPY_STEPS`, `HEADING_STEP` (Fi:181-186) | 0.01, 4, 4, 0.01 | Continuation schedules | None | ESTIMATE |

### Fairing proposals

- Weighting: each ring counts once whatever the station spacing, so refining stations raises the rings' weight against the eight lines. Weight each ring's scale-free energy by its station interval over the window's length, a discrete integral along the stations, so the energy approximates a surface integral independent of sampling.
- Ring samples: 64 samples put a thigh ring of 565 mm a sample every 8.8 mm, coarser than the forms the fairing should keep. Sample by ring length at the figure's phase pitch or finer.
- Parent window: 40 mm is absolute; take a stated share of the parent's end-ring reach.
- Signed curvature: on a planar ring an inflection that falls between two samples reads as no change of unsigned curvature, where the signed curvature changes by twice its value. Use the signed curvature in the ring's section plane for closed rings, unsigned only for space lines.
- Citation: Moreton's thesis is UCB/CSD-93-732, 1993; the 1992 report is UCB/CSD-92-664. Only the reports' abstracts were read: the functional is "based on the variation of curvature"; the integrand was not opened.

## Side-join addresses and numerical tolerances

`AutoMovieHumanJoinLoop.ts` (J), `AutoMovieHumanLayerTurn.ts` and `AutoMovieHumanConicLoft.ts`. These are numerical-method constants with stated derivations; none shapes the form beyond its tolerance.

| Constant | Value | Role | Basis stated | Verdict |
| --- | --- | --- | --- | --- |
| `PHASES` (J:68) | 360 | Part phases the cut is read at | One a degree | DERIVED |
| `ADDRESS_MM` (J:75) | 1e-12 mm | Point in its section plane | Station error under a nanometre | DERIVED |
| `ADDRESS_FLOOR_MM` (J:81) | 1e-9 mm | Landed when stalled | Frame rounding | DERIVED |
| `ADDRESS_STEPS` (J:84) | 64 | Secant steps | Under ten on a made turn | DERIVED |
| `REACH` (J:91) | 2 | Ray walk past the loop's box | `sqrt(2)` of a box, doubled | DERIVED |
| `aliasResolution` (J:635) | `tolerance + meeting / sin(angle)` | Seed on a traced loop | Two planes through a line | DERIVED |
| Layer turn floor (LayerTurn:46) | `2 least` | Shortest halved interval | Stated floor | DERIVED |
| `SPACING_SAMPLES` (ConicLoft:687) | 1024 | Ring length and turn reads | Sampling | DERIVED |

## Measured on an open asset

Where no published measure in the law's definition could be read, the proportions were measured on the MakeHuman base mesh as MPFB2 ships it: `src/mpfb/data/3dobjs/base.obj` at commit `9de0707fdc88438d7c53a1a2ac7937d9221e2431` of makehumancommunity/mpfb2, whose assets are released under CC0 1.0 (its `LICENSE.md`), with the `fingernails` and `toenails` vertex groups of `src/mpfb/entities/socketobject/_extra_vertex_groups.py`. The mesh is the default, sex-neutral figure with no target applied, in decimetres. SMPL, SMPL-X and MANO were not measured: their licences allow non-commercial research only.

The measurement, on the left side:

1. Joint centres are the centroids of the `joint-l-*` helper groups. On each digit the last helper lies at the skin's tip (within 1.8 mm), so the one before it is the distal interphalangeal joint (the thumb's and the hallux's interphalangeal joint).
2. Each body vertex of the hand and foot is owned by the digit whose joint polyline it is nearest, within 15 mm.
3. In the distal segment's frame (joint to tip as the long axis, the nail group's centroid giving the dorsal direction), the nail width is the nail group's lateral extent, the nail length runs from its most proximal vertex to the skin's tip (Jung JW's fold-groove-to-fingertip length), and the breadth is the skin's lateral extent within 3 mm of the joint.
4. The dome is the quarter ellipse `r(d) = R sqrt(1 - (1 - min(d, H) / H)^2)` fitted by least squares to the digit's vertices within 12 mm of the tip (8 mm on the lesser toes), `r` read from the line through the segment's centroid along the axis; the share is `H / R`, the law's `pole - from` over the reach.

| Quantity | Fingers on the mesh | Toes on the mesh | Published |
| --- | --- | --- | --- |
| Nail width over joint breadth | 0.59, 0.59, 0.57, 0.60, 0.55 | Hallux 0.63; lesser 0.55, 0.67, 0.57, 0.55 | Fingers, women 0.70 to 0.76 (Jung JW 2015) |
| Nail width over fold-to-tip length | 0.80, 0.60, 0.61, 0.64, 0.83 | Hallux 0.87; lesser 1.09, 1.16, 1.38, 0.89 | Fingers, women 0.91 (Jung JW 2015) |
| Dome length over reach | 1.66, 1.29, 1.31, 1.39, 1.05 | Hallux 0.99; 0.90, 1.08; 0.52 and 2.59 degenerate | None read |

Finger values run thumb to little finger, lesser toes second to fifth. The mesh's fingernails are narrower and longer than Jung's women (width share 20 % under, aspect 25 % under), so the mesh is no anthropometric sample. Its value is its ratios between digits, which an artist drew consistently on one figure. The dome fits leave a residual of 1 to 2.7 mm on reaches of 4 to 10 mm, because the fingertips carry few rings; the fourth and fifth toes' fits run to the search's bounds and are not used.

### Rules proposed from the measurement

- Toe nail width share: on the mesh a lesser toe's share is the fingers' (0.585 against 0.58) and the hallux's 9 % more. One share for every toe, Jung's women's finger mean, 0.73, replaces the ESTIMATE 0.65.
- Toe nail aspect: on the mesh a lesser toe's aspect is 1.62 times the fingers' mean and the hallux's 1.25 times. Applied to Jung's 0.91 they give 1.48 for the lesser toes (now 1.55, an unsourced matrix-over-bed ratio) and 1.14 for the hallux (now the ESTIMATE 1.1). Graded as a published value carried by an open asset's ratio.
- Dome shares: the mesh does not separate the thumb from the fingers (1.66 against 1.05 to 1.39), so one share serves all five fingers, their mean 1.35, and one all the toes, 1.0 from the hallux and the second and third toes. They replace f1's 1.5, 1.1 and 0.8 as a flattened ESTIMATE, because the mesh's resolution bounds them to about 0.3; the supervisor's frames decide between them and f1's values.

## Flattened rules

Where neither a source nor the asset carries a number, the simplest smooth law that gives a natural form replaces the per-person or per-digit value, as an ESTIMATE with its reasoning:

- Thumb root: the divider is the plane square to the first metacarpal at half its length from the carpometacarpal joint, in place of f1's three traced points. The thenar stays on the hand's wall up to that plane, and the thumb's own skin starts at it (supervisor's ruling, 2026-11-23); the traced points become its plausibility check. No published thenar landmark set at the neutral pose was found and read; the first web space angle (Indian J Plast Surg 2024;57:311-316, through a search summary) is a range-of-motion angle.
- Inframammary fold: two constant radii, each a share of the footprint's height, with the tethered lower one over the whole lower border (batch 4). A single radius all round would lose the crease the histology describes; a fitted profile has no source.
- Joint fold widths and rails: a share of each joint's own measured size (batch 2, item 5).
- Nail roll spread: the published finger tilts' rms for every digit (batch 2, item 3).

## Sources read

Each source below was opened and read in this audit unless its row says otherwise.

| Key | Citation and what was read |
| --- | --- |
| Atesoglu 2018 | Atesoglu S, Deniz M, Uslu AI. Folia Morphol 2018;77(3):489-497. Methods, Table 1. [Paper](https://journals.viamedica.pl/folia_morphologica/article/view/54971) |
| Boutros 1998 | Boutros S et al. The intradermal anatomy of the inframammary fold. Plast Reconstr Surg 1998;102(4):1030-1033. Abstract via Europe PMC |
| Braun 2016 | Braun TL, Trost JG, Pederson WC. Syndactyly Release. Semin Plast Surg 2016;30(4):162-170. Review. [Paper](https://pmc.ncbi.nlm.nih.gov/articles/PMC5115922) |
| Clarke 2012 | Clarke A, Wright T, Downs-Wheeler M, Smith G. Orthop Proc 2012;94-B(SUPP III):85. Abstract. [Abstract](https://boneandjoint.org.uk/Article/10.1302/1358-992X.94BSUPP_III.BOA085) |
| de Leva 1996 | J Biomech 1996;29(9):1223-1230, Table 4; the repository's note `docs/sources/de-leva-1996.md` |
| Demiroz 2021 | Demiroz A et al. J Plast Surg Hand Surg 2021;55(1):13-16. Full text. [Paper](https://doi.org/10.1080/2000656X.2020.1817753) |
| Fujisawa 2021 | Fujisawa K et al. J Plast Surg Hand Surg 2021;55(1):21-24. Full text. [Paper](https://doi.org/10.1080/2000656X.2020.1828896) |
| Gordon 2014 | ANSUR II, NATICK/TR-15-007; the repository's notes `ansur-ii-course-measures.md`, `ansur-ii-trunk-ratios.md` |
| Huang 2011 | Huang SY et al. Med Phys 2011;38(4):2180-2191. Europe PMC record and abstract only |
| Jung JW 2015 | Jung JW et al. Fingernail Configuration. Arch Plast Surg 2015;42(6):753-760. Methods, Fig. 1, Tables 1-3. [Paper](https://doi.org/10.5999/aps.2015.42.6.753) |
| MPFB2 base mesh | makehumancommunity/mpfb2 at `9de0707`, `base.obj`, nail vertex groups, `LICENSE.md` (assets CC0 1.0). Measured as stated above |
| Moreton 1993 | Moreton HP. UCB/CSD-93-732; Moreton and Sequin, UCB/CSD-92-664. Report pages. [Thesis](https://www2.eecs.berkeley.edu/Pubs/TechRpts/1993/5219.html) |
| Muntan 2000 | Muntan CD, Sundine MJ, Rink RD, Acland RD. Inframammary fold: a histologic reappraisal. Plast Reconstr Surg 2000;105(2):549-556. Abstract via Europe PMC |
| NURBS Book | Piegl L, Tiller W. The NURBS Book, 2nd ed., 1997. Table of contents only |
| Open CASCADE | Mesh user guide, linear and angular deflection. [Guide](https://occt3d.com/dev/doc/overview/html/occt_user_guides__mesh.html) |
| Szymoniak-Lipska 2021 | Front Med 2021;8:686470. Plate thickness by sex and finger. [Paper](https://www.frontiersin.org/journals/medicine/articles/10.3389/fmed.2021.686470/full) |

Refused or blocked in this audit, so their numbers rest on the repository's earlier readings: Bellinato 2023, Palomo-Lopez 2020, Ha 2024, Jung DJ 2015, Lopez Ripado 2024 (read earlier with its URL in `nails.md`) and the Dzidek 2017 supplement.

## Open

Each item below was searched again on 2026-11-23; what was found and why it does not settle the number is stated with it.

- The inframammary fold's radius and the upper pole's run onto the chest. The histology gives the tethered crease's extent (see the breast proposals); 3D surface-scan studies found use curvature to grade ptosis (Li et al., Computers in Biology and Medicine, 2016) and landmark distances, not a fold radius, and were not read.
- A toenail's width over its toe's breadth, and its width over length, in a population. Lopez Ripado 2024 measured five ultrasound parameters of the hallux unit (Europe PMC record: 38 women and 38 men, mean age 26.8) and gives no plate length; a pincer-nail study's controls give only indices; Palomo-Lopez 2020's matrix and bed lengths were read only through a search summary. The open asset carries the toes for now.
- The fingertip pulp's length over its reach in a population. Dzidek et al. 2017 (J R Soc Interface 14:20160935) model the index pad as an ellipsoid, but the paper, its supplement, its figshare and PMC copies refused the fetch; Yoshida 1996 (J Showa Med Assoc 56:175-182, 32 Japanese patients) compares the nail, the digit's end and the distal phalanx, and its abstract gives no ratio; Greiner 1991's DTIC copy refused the fetch. The open asset carries the dome shares for now, at its resolution.
- A thenar landmark set for the thumb's root. The flattened plane above stands in.
- `nails.md` still states the hallux thickness as 1.38 mm in its Numbers table and its Open section; the code holds 0.585 mm.
