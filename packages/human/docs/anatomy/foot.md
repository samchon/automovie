# Foot

Each value holds only for its cited population, posture and measurement protocol. Derived ratios describe the surveyed groups.

## Dimensions

ANSUR II ([ansur-ii](../sources/ansur-ii.md)); ratios are derived quantities.

| Quantity | Women | Men |
| --- | --- | --- |
| Foot length, heel to longest toe (mm) | 246.3 (0.151 S) | 271.2 (0.154 S) |
| Ball-of-foot length, heel to first MTP protrusion / foot length | 0.739 (SD 0.013) | 0.741 (SD 0.015) |
| Foot breadth (Brannock, to fifth MTP) / foot length | 0.377 | 0.376 |
| Lateral malleolus height / foot length | 0.255 | 0.269 |
| Ball-of-foot circumference / foot length | 0.927 | 0.930 |
| Heel-ankle circumference / foot length | 1.261 | 1.267 |
| Ankle minimum circumference (mm) | 215.7 | 229.3 |
| Foot length fit | 37.9 + 0.118 S + 0.239 m (R2 0.55) | 44.9 + 0.120 S + 0.173 m (R2 0.54) |

The first metatarsophalangeal joint lies at 0.74 of foot length from the heel, and the push-off hinge runs along the line of the metatarsal heads through it. The ball is a little more than a third of foot length wide. Foot proportions barely differ by sex once scaled to foot length. In children ([snyder-1977](../sources/snyder-1977.md)) the foot is relatively broader: breadth / length 0.41 at 2 to 4 years, 0.39 at 16 to 18.

Heel breadth and Brannock foot breadth use different support points and directions. Bimalleolar breadth projects two bony landmarks. Read uncompressed skin breadth separately because the malleoli occupy different heights and fore-aft positions. [ANSUR II foot and neck measurements](../sources/ansur-ii-handbook-foot-neck.md).

## Form

From Gray 1918 and Bridgman ([gray-1918](../sources/gray-1918.md), [bridgman-1920](../sources/bridgman-1920.md)), conventional.

- The dorsum is convex; its summit runs along the head of the talus, navicular, second cuneiform and second metatarsal, falling slowly to the lateral border and steeply to the medial.
- The lateral side is lower and shorter than the medial; even the lateral malleolus is lower. The medial longitudinal arch is high; the inner arches are successively higher, forming half a transverse arch that the other foot completes.
- The medial malleolus is higher and further forward than the lateral and overhangs the medial arch.
- Navicular tuberosity: palpable 2.5 to 3 cm in front of the medial malleolus. Base of the fifth metatarsal: prominent on the lateral border. The head of the talus shows in front of the ankle in plantar flexion.
- Dorsal tendons from medial to lateral: tibialis anterior (largest), extensor hallucis, extensor digitorum longus to toes two to five, peroneus tertius; extensor digitorum brevis makes a fullness in front of the lateral malleolus.
- Sole: abductor digiti minimi a narrow rounded elevation laterally, abductor hallucis a lesser one medially; the heel and ball pads bear weight, the arch does not.
- When the foot lands, the lateral (heel) side strikes first and the foot settles inward.

## Construction datums

The person's foot dimensions place the heel, ankle, forefoot and longest toe. The construction uses ANSUR II for the first metatarsal head, then uses the published metatarsal cascade to place the remaining heads. A separate line supports each toe. Estimate widths and web ends geometrically where the person supplies no separate digit caliper. The rules and their source notes live with the prior and the foot landmarks. [Foot prior](../../src/generation/AutoMovieHumanFootPrior.ts), [foot landmark sources](../../src/generation/AutoMovieHumanFootPlaces.ts).

The default toe-apex plan uses the radiographic phalanx proportions and the measured heel-to-longest-toe length. An explicit phalanx length scale multiplies the supported root-to-apex distance. The parent chord fixes the root height and the distal pad fixes the apex height. The horizontal advance is the remaining leg of that right triangle, along the original plan direction. The forefoot and heel stay at their measured datums, so the explicit toe edit changes the generated heel-to-longest projection. [Patil et al. 2017](https://pmc.ncbi.nlm.nih.gov/articles/PMC5713710/), [ANSUR II methods](https://dacowits.defense.gov/LinkClick.aspx?fileticket=EbsKcm6A10U%3D&portalid=48).

ESTIMATE for a person without individual toe calipers. In each fixed foot observation plane, the midpoint between adjacent generating axes divides their available transverse space. Each side of a toe keeps the smaller of its nominal half-breadth and its nearest shared-plane half-spacing. The axes are affine in foot-along station, so the smaller of their two endpoint spacings bounds the complete shared interval. The source uses that constant bound with the native Bézier control-hull range to keep the cap and shaft inside the same limit throughout. Contact is permitted at the bound.

Read a web where the cross-plane passes its saddle and the cut first separates into the two toe loops. Check the achilles-to-heel turn in side view, the heel and ball contacts in sole view, and the dorsal crest, web slope and caps from above. [Anatomical consistency](../testing/consistency.md).

## Range of motion

Soucie et al. ([soucie-2011](../sources/soucie-2011.md), measured): ankle dorsiflexion 13.8 (F) and 12.7 (M) deg at 20 to 44, falling to about 12 at 45 to 69; plantar flexion 62.1 and 54.6; children 2 to 8 reach 24.8 and 22.8 dorsiflexion. Roaas and Andersson ([roaas-andersson-1982](../sources/roaas-andersson-1982.md), men 30 to 40, passive): dorsiflexion 15.3, plantar flexion 39.7, eversion 27.6, inversion 27.7. AAOS convention: toe MTP extension 70, flexion 45 ([hendriks-2020-aaos](../sources/hendriks-2020-aaos.md)).

## Open questions

- Arch height (navicular height or arch height index) by sex and age, and how it flattens under load: Hillstrom 2013 and other abstracts give no values.
- The fifth MTP position along the foot varies by person. The construction's published metatarsal cascade supplies a baseline where the controls give only the first-head station.
- Toe lengths and which toe is longest (first or second) by population.
- Heel pad and ball pad thickness.
- Ankle joint axis inclination (it runs obliquely, below the malleoli tips); de Leva gives only the ankle centre 12.6 mm below sphyrion.
