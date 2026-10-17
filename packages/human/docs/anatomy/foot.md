# Foot

The foot is a separate part joined at the ankle. `AutoMovieHumanoidBone` gives one `leftFoot`/`rightFoot` and one `leftToes`/`rightToes` per side, so the five toes share one bone.

## Dimensions

Retained ANSUR II research notes (`../sources/ansur-ii.md`); ratios are derived quantities, not independently admitted skin-shape constraints. Heel and bimalleolar attribution limitations are stated below.

| Quantity | Women | Men |
| --- | --- | --- |
| Foot length, heel to longest toe (mm) | 246.3 (0.151 S) | 271.2 (0.154 S) |
| Ball-of-foot length, heel to first MTP protrusion / foot length | 0.739 (SD 0.013) | 0.741 (SD 0.015) |
| Foot breadth (Brannock, to fifth MTP) / foot length | 0.377 | 0.376 |
| Heel breadth / foot length, unverified derivation | 0.273 | 0.268 |
| Bimalleolar breadth / foot length, retained research attribution | 0.272 | 0.276 |
| Lateral malleolus height / foot length | 0.255 | 0.269 |
| Ball-of-foot circumference / foot length | 0.927 | 0.930 |
| Heel-ankle circumference / foot length | 1.261 | 1.267 |
| Ankle minimum circumference (mm) | 215.7 | 229.3 |
| Foot length fit | 37.9 + 0.118 S + 0.239 m (R2 0.55) | 44.9 + 0.120 S + 0.173 m (R2 0.54) |

The first metatarsophalangeal joint lies at 0.74 of foot length from the heel; the ball is a little more than a third of foot length wide. Foot proportions barely differ by sex once scaled to foot length. In children (`../sources/snyder-1977.md`) the foot is relatively broader: breadth / length 0.41 at 2 to 4 years, 0.39 at 16 to 18.

Heel-breadth/foot-length ratios 0.273 (women) and 0.268 (men) are unverified derived quantities. The retained ANSUR note lacks a heel-specific table/page, numerator, caliper definition and loading/posture protocol; general measurement conventions cannot supply them. Attribution needs the original [methods and summary report](https://tools.openlab.psu.edu/publicData/ANSURII-TR15-007.pdf) or per-sex data. The population was U.S. Army adults aged 17 to 58, and the [database memorandum](https://tools.openlab.psu.edu/publicData/ANSURII-MFR.pdf) requires separate sex analyses. A fallback heel breadth of 0.27 foot lengths is an uncalibrated convention, not a pooled population estimate; independent heel breadth in millimetres remains a physical input.

The legacy skeleton used 0.136 foot lengths on each side for both sexes: its full transverse separation was 0.272, never a sex-specific 0.272/0.276 rule. That bony landmark projection does not establish the maximum uncompressed skin breadth, especially when the malleoli have different heights and fore-aft positions. A verified caliper protocol remains necessary before a population ratio is used as a measured skin rule.

## Form

From Gray 1918 and Bridgman (`../sources/gray-1918.md`, `../sources/bridgman-1920.md`), conventional.

- The dorsum is convex; its summit runs along the head of the talus, navicular, second cuneiform and second metatarsal, falling slowly to the lateral border and steeply to the medial.
- The lateral side is lower and shorter than the medial; even the lateral malleolus is lower. The medial longitudinal arch is high; the inner arches are successively higher, forming half a transverse arch that the other foot completes.
- The medial malleolus is higher and further forward than the lateral and overhangs the medial arch.
- Navicular tuberosity: palpable 2.5 to 3 cm in front of the medial malleolus. Base of the fifth metatarsal: prominent on the lateral border. The head of the talus shows in front of the ankle in plantar flexion.
- Dorsal tendons from medial to lateral: tibialis anterior (largest), extensor hallucis, extensor digitorum longus to toes two to five, peroneus tertius; extensor digitorum brevis makes a fullness in front of the lateral malleolus.
- Sole: abductor digiti minimi a narrow rounded elevation laterally, abductor hallucis a lesser one medially; the heel and ball pads bear weight, the arch does not.
- When the foot lands, the lateral (heel) side strikes first and the foot settles inward.

## Range of motion

Soucie et al. (`../sources/soucie-2011.md`, measured): ankle dorsiflexion 13.8 (F) and 12.7 (M) deg at 20 to 44, falling to about 12 at 45 to 69; plantar flexion 62.1 and 54.6; children 2 to 8 reach 24.8 and 22.8 dorsiflexion. Roaas and Andersson (`../sources/roaas-andersson-1982.md`, men 30 to 40, passive): dorsiflexion 15.3, plantar flexion 39.7, eversion 27.6, inversion 27.7. AAOS convention: toe MTP extension 70, flexion 45 (`../sources/hendriks-2020-aaos.md`).

## Toe joints

The single toes bone can carry the metatarsophalangeal bend shared by all toes (the push-off hinge along the line of the metatarsal heads, through the first MTP at 0.74 of foot length; the fifth MTP position, and so the obliquity of the line, is an open question). Individual toe flexion would need Human-internal joints; their design remains unresolved.

## Open questions

- Arch height (navicular height or arch height index) by sex and age, and how it flattens under load: no numeric source read (Hillstrom 2013 and others, abstracts only, no values).
- The oblique metatarsal-head line: the fifth MTP position along the foot was not measured in ANSUR II; a source is needed.
- Toe lengths and which toe is longest (first or second) by population: no source read.
- Heel pad and ball pad thickness: no source read.
- Ankle joint axis inclination (it runs obliquely, below the malleoli tips): no source read; de Leva only gives the ankle centre 12.6 mm below sphyrion.


## Reference-fitted minimum ankle section

Four selected adult synthetic bodies supplied closed shank sections perpendicular to their knee-to-ankle axes at 53 fractions from 0.72 to 0.98. The smallest convex-hull perimeter selected each minimum section. The fitted cut is sphyrion plus 0.505 lateral malleolus heights; the ellipse depth/breadth is 1.464. Leave-one-reference-out cut ratios were 0.495140 to 0.511778 and aspects 1.439829 to 1.486634. Grade: fitted to modelled references, not population measurements.

Native and skeleton-carried references were measured separately. Selection includes surrogate breadth protocols, and no equally muscular female reference exists. Standing adolescent breadth/girth ratios in `../sources/snyder-1977.md` constrain circularity but do not locate a same-level adult ellipse. The common-level seated adult protocol in `../sources/schneider-1983-ankle.md` differs in posture and perimeter. Transfer to standing adults or other ages remains unverified.

The ankle boundary is an eight-control periodic cubic B-spline. Its four axis radii do not uniquely reproduce that curve as a quarter ellipse. Sweep, source column and collar must consume the same section representation. A collar span of 0.025 foot lengths is a conventional junction constraint, not an anatomical measurement; angular sampling approximates the curve and does not establish an exact signed distance field.

## Historical ankle column below the minimum section

The old skeleton projected the lateral malleolus and sphyrion 0.136 foot lengths either side of the ankle axis for both sexes. It placed sphyrion at 1.2 lateral malleolus heights and 0.04 foot lengths forward of the lateral landmark, a convention for Gray's qualitative "higher and further forward". These positions are construction landmarks, not a claim that the bony tips and the skin envelope share an uncompressed caliper measurement.

Below the collar the legacy foot solid scales four semi-axes of its ring representation, taken along the line through the two landmarks and across it. Each scalar uses quintic steps with zero first and second derivatives at its endpoints: sideways toward the landmark at its own height, then toward the heel's side; posteriorly toward the heel's back; anteriorly by a 0.15 L deepening over the talus. The heights, targets, inset and interpolation are construction conventions. Matching separate semi-axis targets at unequal landmark heights does not establish the horizontal skin breadth at one plane or monotonicity of the final posterior contour. The old 0.274 L comparison was inconsistent with the 0.272 L skeleton rule and is not retained as a calibration target.

Two approaches were rejected. Malleoli as ellipsoids smooth-joined onto a column of the minimum section, with the column ending at 0.8 lateral malleolus heights in a rounded rim, rose out of the column as a closed band 30 mm tall and left a waist and posterolateral hollows under it (lateral radius 30 to 39 to 25 mm on the muscular man). Reading the plan's profiles with a smoothstep that is flat at every key terraced each falling profile into shelves across the dorsum and along the borders; the solid now reads them with Fritsch and Carlson's monotone cubic, which is flat only at extrema.

An earlier local source-to-skin trace reported differences of 1 to 3 mm through selected ankle cuts. Its observation does not bound every identity, parameter, direction or later source snapshot, and it cannot establish that sampling and boundary conversion preserve all features. In particular, the actual baseline still shows a diagonal ankle crease and broad posterior lobes. Narrow posterior features such as the calcaneal tendon and retromalleolar hollows are not explicitly constrained; increasing the control count alone does not recover them.

Open: the depth of the submalleolar hollow and the heel's lateral bulge below it have no source read; the medial malleolus height above the lateral is a convention.

### Comparison with the reference feet

Historical horizontal cuts of four private reference meshes' left feet, in their native frames with the foot frame turned by each foot's toe-out of 5 to 9 degrees. Breadth was selected within 0.15 foot lengths of the ankle joint, over foot length L, at height h above the floor. The finite selection window and frame registration can affect the result; this is not a population caliper protocol or a reconstruction certificate.

| h / L | f20-model | m20-model | f20-muscular | m20-muscular |
| --- | --- | --- | --- | --- |
| 0.19 | 0.253 | 0.244 | 0.253 | 0.255 |
| 0.22 | 0.252 | 0.247 | 0.239 | 0.258 |
| 0.25 | 0.262 | 0.244 | 0.241 | 0.261 |
| 0.28 | 0.271 | 0.233 | 0.246 | 0.259 |
| 0.31 | 0.272 | 0.220 | 0.246 | 0.258 |
| 0.37 | 0.251 | 0.201 | 0.223 | 0.246 |
| 0.46 | 0.222 | 0.191 | 0.191 | 0.234 |

The retained samples peak at 0.22 to 0.31 L and narrow by 0.027 to 0.056 L from that peak to 0.46 L. Earlier generated-column comparisons used a 0.274 L target inconsistent with the legacy skeleton's 0.272 L projection, so their apparent agreement is not evidence of a measured bimalleolar constraint. The column also depends on height, heel breadth, inset, blending and station conventions beyond its anterior deepening. These historical samples motivate further constraints; they do not qualify the current surface, its clinical proportions or the proposed replacement.
