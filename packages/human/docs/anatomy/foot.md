# Foot

Each value holds only for its cited population, posture and measurement protocol. Derived ratios are research constraints, not generator defaults or clinical identity.

## Dimensions

ANSUR II ([ansur-ii](../sources/ansur-ii.md)); ratios are derived quantities.

| Quantity | Women | Men |
| --- | --- | --- |
| Foot length, heel to longest toe (mm) | 246.3 (0.151 S) | 271.2 (0.154 S) |
| Ball-of-foot length, heel to first MTP protrusion / foot length | 0.739 (SD 0.013) | 0.741 (SD 0.015) |
| Foot breadth (Brannock, to fifth MTP) / foot length | 0.377 | 0.376 |
| Heel breadth / foot length, unverified derivation | 0.273 | 0.268 |
| Bimalleolar breadth / foot length, unverified attribution | 0.272 | 0.276 |
| Lateral malleolus height / foot length | 0.255 | 0.269 |
| Ball-of-foot circumference / foot length | 0.927 | 0.930 |
| Heel-ankle circumference / foot length | 1.261 | 1.267 |
| Ankle minimum circumference (mm) | 215.7 | 229.3 |
| Foot length fit | 37.9 + 0.118 S + 0.239 m (R2 0.55) | 44.9 + 0.120 S + 0.173 m (R2 0.54) |

The first metatarsophalangeal joint lies at 0.74 of foot length from the heel, and the push-off hinge runs along the line of the metatarsal heads through it. The ball is a little more than a third of foot length wide. Foot proportions barely differ by sex once scaled to foot length. In children ([snyder-1977](../sources/snyder-1977.md)) the foot is relatively broader: breadth / length 0.41 at 2 to 4 years, 0.39 at 16 to 18.

The heel-breadth ratios lack a heel-specific table or page, numerator, caliper definition and loading or posture protocol in the ANSUR note they come from. Verifying them needs the original [methods and summary report](https://tools.openlab.psu.edu/publicData/ANSURII-TR15-007.pdf) or per-sex data. The ANSUR II population is U.S. Army adults aged 17 to 58, and the [database memorandum](https://tools.openlab.psu.edu/publicData/ANSURII-MFR.pdf) requires separate analyses by sex. A heel breadth of 0.27 foot lengths is an uncalibrated convention, not a pooled population estimate; a heel breadth measured in millimetres is a separate physical input.

Bimalleolar breadth is a bony landmark projection and does not give the maximum uncompressed skin breadth, especially where the malleoli differ in height and fore-aft position. Using the ratio as a skin rule needs a verified caliper protocol.

## Form

From Gray 1918 and Bridgman ([gray-1918](../sources/gray-1918.md), [bridgman-1920](../sources/bridgman-1920.md)), conventional.

- The dorsum is convex; its summit runs along the head of the talus, navicular, second cuneiform and second metatarsal, falling slowly to the lateral border and steeply to the medial.
- The lateral side is lower and shorter than the medial; even the lateral malleolus is lower. The medial longitudinal arch is high; the inner arches are successively higher, forming half a transverse arch that the other foot completes.
- The medial malleolus is higher and further forward than the lateral and overhangs the medial arch.
- Navicular tuberosity: palpable 2.5 to 3 cm in front of the medial malleolus. Base of the fifth metatarsal: prominent on the lateral border. The head of the talus shows in front of the ankle in plantar flexion.
- Dorsal tendons from medial to lateral: tibialis anterior (largest), extensor hallucis, extensor digitorum longus to toes two to five, peroneus tertius; extensor digitorum brevis makes a fullness in front of the lateral malleolus.
- Sole: abductor digiti minimi a narrow rounded elevation laterally, abductor hallucis a lesser one medially; the heel and ball pads bear weight, the arch does not.
- When the foot lands, the lateral (heel) side strikes first and the foot settles inward.

In the construction a toe is a digit on the finger's plan: its own chain on its own line, tapered by the digit span law from its web (halfway along its proximal phalanx) through its joints to its cap, its nail side flattening, its distal pad the fingertip pulp's bump resting on the floor; its first own section stands past its own clefts by the blend width of its own size, and the web surface from the body's ring adapts to it. The dorsum's height at a cleft is the quarter ellipse from the crest (level tangent) to the lateral border (upright tangent), so each cleft's web is as deep as the forefoot is thick there. Where the lateral border's extreme changes bone (heel wall to malleolus), the guide has no knot and its spline bridges the two prominences.

## f1 reference observation

Measured on Recovery Hermite sections of the f1 reference mesh with 0.5 mm cross planes, separations refined to 0.01 mm. It is one specimen in a standing neutral pose and makes no population claim. Positions run along each foot's footprint principal axis from the heel's rearmost point, as fractions of that foot's length L. The axis turns 8.3 deg (left, +Z) and 11.4 deg (right) outward from +X; L is 245.1 mm (left) and 243.6 mm (right). The minimum horizontal ankle girth is 205 mm at 113.5 and 112.5 mm height.

| Event | Left / L | Right / L |
| --- | --- | --- |
| Fifth toe separates | 0.755 | 0.766 |
| Fourth toe separates | 0.809 | 0.818 |
| Hallux separates | 0.840 | 0.841 |
| Second and third toes separate | 0.841 | 0.846 |
| Fifth toe tip | 0.826 | 0.839 |
| Fourth toe tip | 0.893 | 0.904 |
| Third toe tip | 0.946 | 0.954 |
| Second toe tip | 0.984 | 0.989 |
| Hallux tip | 1 | 1 |

The toes separate lateral first, and the hallux is the longest toe of both feet. The toes rest on the floor with neighbouring plantar pads nearly touching, while the dorsal clefts reach the separation planes. A separation is where the cutting plane passes the web's saddle.

## Four references by exact plane cuts

Read on the left feet of f1, f2, m1 and m2 by exact cuts of their meshes, in the footprint's principal frame (along from the rearmost point over foot length L, across from the forefoot's medial extreme over breadth B, heights over L below the ankle and over the lateral malleolus height H in the column). Each value is one specimen's reading or the median of four; a median with any one person left out is the middle of the other three, so it lies within the four readings shown. These are the construction's knots where no published value exists (`AutoMovieHumanFootPrior`, marked "reference median").

| Measure | f1 | f2 | m1 | m2 | median |
| --- | --- | --- | --- | --- | --- |
| Medial extreme (first metatarsal head), a | 0.725 | 0.729 | 0.713 | 0.713 | 0.719 (ANSUR II: 0.739 / 0.741) |
| Lateral extreme (fifth head), a | 0.640 | 0.648 | 0.625 | 0.625 | 0.633 (Maestro from 0.74: 0.653) |
| Footprint axis out of +X, deg | 8.2 | 9.4 | 10.2 | 11.1 | 9.8 |
| Dorsal crest at a = 0.5, 0.6, 0.7, 0.8 (y/L) | 0.258 0.210 0.164 0.122 | 0.271 0.219 0.171 0.126 | 0.258 0.210 0.164 0.120 | 0.243 0.195 0.152 0.114 | 0.258 0.210 0.164 0.121 |
| Plantar contact across at a = 0.3, 0.5, 0.7 (u) | 0.46 to 0.72, 0.64 to 0.84, 0.22 to 0.93 | 0.44 to 0.71, 0.62 to 0.82, 0.18 to 0.91 | 0.37 to 0.72, 0.58 to 0.85, 0.20 to 0.92 | 0.31 to 0.78, 0.33 to 0.91, 0.17 to 0.91 | 0.41 to 0.72, 0.60 to 0.85, 0.19 to 0.91 |
| Heel's rearmost height (y/L) | 0.08 to 0.10 | 0.08 to 0.10 | 0.08 to 0.10 | 0.08 to 0.10 | 0.09 |
| Column at the ankle ring (1.46 H): back, front (a) | 0.034, 0.362 | 0.045, 0.378 | 0.057, 0.398 | 0.045, 0.376 | 0.045, 0.377 |
| Lateral extreme's greatest reach, height (y/L) | 0.28 | 0.30 | 0.26 | 0.20 to 0.24 | 0.27 (H / L 0.28) |
| Medial extreme's greatest reach, height (y/L) | 0.30 | 0.30 | 0.28 to 0.30 | 0.30 | 0.30 |

Toes, by vertical cuts square to the axis: each toe is its own loop by 0.775 L (fifth), 0.81 (fourth) and 0.85 (first to third). Breadths at their roots over L: hallux 0.102 (pulp 0.113 at 0.9 L), second 0.066, third 0.058, fourth 0.057, fifth 0.052; neighbouring toes touch. Tips: 1, 0.985, 0.945, 0.89 and 0.82 L. The lateral malleolus barely stands out of the lateral extremes' line (0.5 to 1.5 mm on f1, f2 and m1), and m2 is flat-footed (its medial midfoot reaches the floor); m2's lateral malleolus height input, 89.9 mm, lies 3.4 SD above the ANSUR II men's mean and reads about 0.31 L against 0.25 to 0.28 on the others.

Published foot-shape values searched and not yet used: instep height at fixed shares of foot length (3D scanner studies) and the arch height point at 50 % of foot length; each would replace a crest or medial knot once read in full.

## Range of motion

Soucie et al. ([soucie-2011](../sources/soucie-2011.md), measured): ankle dorsiflexion 13.8 (F) and 12.7 (M) deg at 20 to 44, falling to about 12 at 45 to 69; plantar flexion 62.1 and 54.6; children 2 to 8 reach 24.8 and 22.8 dorsiflexion. Roaas and Andersson ([roaas-andersson-1982](../sources/roaas-andersson-1982.md), men 30 to 40, passive): dorsiflexion 15.3, plantar flexion 39.7, eversion 27.6, inversion 27.7. AAOS convention: toe MTP extension 70, flexion 45 ([hendriks-2020-aaos](../sources/hendriks-2020-aaos.md)).

## Open questions

- Arch height (navicular height or arch height index) by sex and age, and how it flattens under load: Hillstrom 2013 and other abstracts give no values.
- The oblique metatarsal-head line: ANSUR II did not measure the fifth MTP position along the foot.
- Toe lengths and which toe is longest (first or second) by population.
- Heel pad and ball pad thickness.
- Ankle joint axis inclination (it runs obliquely, below the malleoli tips); de Leva gives only the ankle centre 12.6 mm below sphyrion.
