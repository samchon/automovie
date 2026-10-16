# Foot

The foot is a separate part joined at the ankle (#2797). `AutoMovieHumanoidBone` gives one `leftFoot`/`rightFoot` and one `leftToes`/`rightToes` per side, so the five toes share one bone.

## Dimensions

ANSUR II (`../sources/ansur-ii.md`), measured; ratios ours.

| Quantity | Women | Men |
| --- | --- | --- |
| Foot length, heel to longest toe (mm) | 246.3 (0.151 S) | 271.2 (0.154 S) |
| Ball-of-foot length, heel to first MTP protrusion / foot length | 0.739 (SD 0.013) | 0.741 (SD 0.015) |
| Foot breadth (Brannock, to fifth MTP) / foot length | 0.377 | 0.376 |
| Heel breadth / foot length | 0.273 | 0.268 |
| Bimalleolar breadth / foot length | 0.272 | 0.276 |
| Lateral malleolus height / foot length | 0.255 | 0.269 |
| Ball-of-foot circumference / foot length | 0.927 | 0.930 |
| Heel-ankle circumference / foot length | 1.261 | 1.267 |
| Ankle minimum circumference (mm) | 215.7 | 229.3 |
| Foot length fit | 37.9 + 0.118 S + 0.239 m (R2 0.55) | 44.9 + 0.120 S + 0.173 m (R2 0.54) |

The first metatarsophalangeal joint lies at 0.74 of foot length from the heel; the ball is a little more than a third of foot length wide. Foot proportions barely differ by sex once scaled to foot length. In children (`../sources/snyder-1977.md`) the foot is relatively broader: breadth / length 0.41 at 2 to 4 years, 0.39 at 16 to 18.

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

The single toes bone can carry the metatarsophalangeal bend shared by all toes (the push-off hinge along the line of the metatarsal heads, through the first MTP at 0.74 of foot length; the fifth MTP position, and so the obliquity of the line, is an open question). Individual toe flexion would need Human-internal joints; #2797 decides whether they exist.

## Open questions

- Arch height (navicular height or arch height index) by sex and age, and how it flattens under load: no numeric source read (Hillstrom 2013 and others, abstracts only, no values).
- The oblique metatarsal-head line: the fifth MTP position along the foot was not measured in ANSUR II; a source is needed.
- Toe lengths and which toe is longest (first or second) by population: no source read.
- Heel pad and ball pad thickness: no source read.
- Ankle joint axis inclination (it runs obliquely, below the malleoli tips): no source read; de Leva only gives the ankle centre 12.6 mm below sphyrion.


## Candidate minimum ankle section in #2831

The earlier circular ankle ring was placed at sphyrion plus one lateral malleolus height. On the four gate identities that put the cut 31.6 to 39.5 mm above the matched reference sections' minimum tape-girth levels. Minimum-section and same-ring-height comparisons gave different aspects, so the minimum aspect was not applied at the old cut.

The candidate shared cut is sphyrion plus 0.505 lateral malleolus heights, and the shared ellipse's depth/breadth is 1.464. These are small named coefficients fitted offline to the four selected adult reference bodies: closed shank sections perpendicular to their knee-to-ankle axis at 53 fractions from 0.72 to 0.98, selecting the smallest convex-hull perimeter. The cut ratio averaged 0.504985, leaving one identity out 0.495140 to 0.511778; depth/breadth averaged 1.464002, leaving one out 1.439829 to 1.486634. Native and skeleton-carried references were measured separately. Reference selection by input dimensions includes surrogate breadth protocols, so it remains a sensitivity choice rather than validated anatomical correspondence. No muscular female reference exists, so her comparison carries ordinary lean form. Grade: fitted to modelled references, not population measurements.

Standing adolescent minimum breadth/girth ratios in `../sources/snyder-1977.md` independently rule out the old circle but do not locate a same-level adult ellipse. The seated adult measurements in `../sources/schneider-1983-ankle.md` use one common level, but their posture and perimeter discrepancy preclude copying their aspect into the standing cut. The current fit does not establish clinical accuracy or the shape at every age; those remain separate geometry and render checks.

The earlier cut candidate normalized the four axis radii by the ring's girth. That still reconstructed an ellipse rather than the declared B-spline and is superseded by the shared-boundary representation below.


## Shared ankle boundary representation audit in #2831

The minimum-cut candidate exposed a representation discrepancy: the junction and pinned collar use an eight-control periodic cubic B-spline, while the former foot source column rebuilt its section from four axis radii as a quarter ellipse. Its source zero crossing did not lie on the declared boundary even when the malleolar union was diagnostically omitted. The broad circular section hid most of that disagreement.

The replacement defines the section once in the foot network and passes that same B-spline to both the foot sweep and the source column. The column uses the engine's `compileAutoMovieSweep.radius` with the actual ankle-to-column-bottom extrusion, so no Human polar sampler or radius interpolation is copied. The engine still samples 512 angular directions; this is an approximation of the B-spline, not an exact analytic distance field.

The existing pinned collar distance, 0.025 foot lengths, is one shared conventional constant. The source column remains the shared section through that span. Below it the column's depth grows with a quintic endpoint interpolation, and the slab/malleolar union is admitted by a quintic weight from the collar to the higher malleolar mass centre. Both endpoint weights have zero first and second derivatives. These are explicit junction constraints rather than population measurements or independently fitted shape offsets. The remaining slab and knob smooth-min is C1; this change does not assert a globally C2 foot or a true signed distance field.

Four-gate source-field and actual whole joined level-2, production-relief-on measurements live in the campaign workspace. They are numerical evidence only. The minimum-cut coefficients retain their earlier source/population/protocol caveats. Native full build, final source admission, exact committed construction and 14-direction matching renders are separate requirements before acceptance. The dorsal profile still uses its originally fitted zero-slope cubic key interpolation; changing it without refitting and complete comparisons remains unverified.
