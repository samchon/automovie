# Human experiments

Experiment sets run under the Human skill's [work order](../../../.agents/skills/human/SKILL.md#work-order): each set is planned in [redesign-plan.md](redesign-plan.md), run in full outside the live source, and recorded here before the plan changes.

## Head base fits before the protrusion set (f1, 2026-10-26)

Runs of `fitHeadBase.ts` made one at a time before the set below was planned; recorded as the evidence the set starts from. Keys every 6 mm from 1425 to 1699.5 mm, 128 control points, Tukey threshold 3 mm, thin-plate lengths relaxing to 5 mm. Offsets are the inliers' normal offsets to the observed rows.

| Run | Change | Result |
| --- | --- | --- |
| A | thin-plate energy on the coordinates, five head row files | inliers fell from 138,514 to 32,315 samples, median 0.70 mm: the energy counts a closed section's own curvature as bending and shrinks every section, so the samples left the rows |
| B | no fit, the initial keys only (sections smoothed to 8 cycles) | 138,514 inliers, median 0.18 mm, 90th percentile 0.80 mm |
| C | thin-plate energy on the correction from the stage's keys, five row files | killed by the system for memory |
| D | as C with the saved loft and the tilted rows only | median 0.081 mm, 90th 0.50 mm, 99th 2.16 mm; the stand-off map shows the base climbed onto the protrusions while relaxing: nose tip 4 mm, each auricle split in two regions of 8 to 9 mm |
| E | as D, protrusions detected on the 20 mm stage and masked afterwards | lips one region (5 mm); each auricle in ten fragments (5 to 14 mm); no nose-tip region: from sections smoothed to 8 cycles the 30 mm wide nose survives about half, and the 20 mm stage fits it |
| F | sections smoothed to 4 cycles, a 40 mm first stage | stopped by the compliance audit before it finished: a second constant change made and rerun one at a time |

Findings: the thin-plate energy belongs on the correction (run A); a relaxing robust fit swallows a protrusion from its edges unless the protrusion is fixed once at a scale the base cannot follow (runs D, E); that scale is set by the widest protrusion, which the protrusion set below decides.

## Protrusion detection set (f1, 2026-10-27)

Run once as planned: starting smoothness 4, 6 and 8 cycles per section against stiff lengths 20, 40 and 60 mm, each one stiff stage with Tukey's threshold from the residuals' robust scale, then the ray stand-off map (rays along the base normal, a contiguous run of observed points from the base with gaps under 2 mm) and watershed basins classified by anatomy relative to eye level (1594.4 mm). No variant met the selection rule.

| Cycles | Length (mm) | Scale s / threshold c (mm) | Nose basins (peak) | Lips | Left auricle | Right auricle |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | 20 | 0.72 / 3.36 | 9 (7.5) | 2 (5.0) | 20 (14.5) | 15 (13.5) |
| 4 | 40 | 0.88 / 4.12 | 12 (7.5) | 6 (5.0) | 13 (14.0) | 18 (13.5) |
| 4 | 60 | 0.93 / 4.36 | 13 (7.5) | 5 (5.0) | 11 (14.0) | 18 (13.5) |
| 6 | 20 | 0.41 / 1.90 | 8 (5.5) | 3 (5.0) | 25 (13.0) | 25 (12.0) |
| 6 | 40 | 0.44 / 2.08 | 9 (5.5) | 2 (5.0) | 27 (13.0) | 30 (12.0) |
| 6 | 60 | 0.46 / 2.14 | 9 (5.5) | 1 (4.0) | 27 (13.0) | 29 (12.0) |
| 8 | 20 | 0.26 / 1.23 | 7 (5.0) | 1 (5.0) | 36 (14.0) | 40 (10.0) |
| 8 | 40 | 0.27 / 1.28 | 7 (5.0) | 1 (5.0) | 34 (14.0) | 36 (10.0) |
| 8 | 60 | 0.28 / 1.29 | 7 (4.0) | 1 (5.0) | 33 (14.0) | 34 (10.0) |

Findings, by cause:

1. The ray stand-off cannot measure a hollow protrusion: observed points lie only on the outer skin, so a ray from the base under the nose crosses its empty inside, the run breaks after 2 mm, and the nose's 20 mm reads at most 7.5 mm; only its edges count. Rays grazing the throat under the chin read a long run instead. The stand-off must be measured from the observations onto the base, not along rays from it.
2. Watershed basins over-segment: every noise maximum above c starts its own basin (up to 40 per auricle), so "one region per feature" fails whatever the scale.
3. The stiff length barely matters from 20 to 60 mm; the starting smoothness sets the robust scale (s from 0.26 to 0.93 mm), which sets the threshold. The detection axis that matters is the starting smoothness.

## Second protrusion detection set (f1, 2026-10-27)

Run once as planned after the first set: starting smoothness 4, 6 and 8 cycles per section at a stiff length of 40 mm, the stand-off by projecting every observed point onto the stiff base (1,350,259 points), basins merged by dynamics, a feature the union of its classified basins, the rule one connected union per feature with converged peaks.

| Cycles | Scale s / threshold c (mm) | Nose (basins, connected, cells, peak) | Lips | Left auricle | Right auricle | Other basins |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | 0.88 / 4.12 | 7, split, 140, 9.5 | 1, connected, 227, 4.9 | 16, split, 605, 12.9 | 15, split, 716, 12.4 | 5: nasal dorsum 13 and 2 mm below eye level (7.2, 5.6 mm), three over the auricles' fronts |
| 6 | 0.44 / 2.08 | 6, split, 266, 6.8 | 1, connected, 313, 4.1 | 12, split, 424, 10.8 | 10, split, 335, 10.6 | 18: nasal dorsum (6.0, 5.4, 3.3 mm), under the chin (2.2 to 2.3 mm, six), the auricles' fronts, the temples |
| 8 | 0.27 / 1.28 | 7, split, 278, 4.7 | 1, connected, 316, 3.8 | 12, split, 669, 8.8 | 15, split, 661, 8.7 | 30: nasal dorsum (4.9, 4.9, 3.2 mm), under the chin (1.3 to 2.1 mm, ten), behind the jaw, the auricles' fronts and backs, the temples |

No variant met the rule. Findings, by cause:

1. A symmetric robust fit cannot hold a base under a feature: the base climbs onto every protrusion until what remains stands about the threshold over it, so the measured peak follows the threshold, not the feature (nose 9.5, 6.8, 4.7 mm and auricles 12.9, 10.8, 8.8 mm as c falls from 4.1 to 1.3 mm, about 2.3c to 3.7c), and no peak converges.
2. The starting keys carry the features into the base: the thin-plate energy is on the correction from them, and sections smoothed to 4 to 8 cycles keep part of the nose and the auricles, which the stiff stage then holds.
3. Fragmentation follows from 1: only the features' tops stand above s, separated by cells the base has absorbed, so merging by dynamics finds no pass between them (the nose in 6 or 7 pieces, each auricle in 10 to 16).
4. The nose class window (20 to 60 mm below the eyes) misses the nasal dorsum, found 2 and 13 mm below eye level: the nose runs from the nasion, about eye level, to the subnasale.
5. Small regions under the chin (1.3 to 2.3 mm, at the tilted rows' meeting with the throat) and over the temples appear as the threshold falls; they are the brow, cheek and chin module's or the known line under the chin.

## Third protrusion detection set (f1, 2026-10-27)

Run once as planned: starting keys at 4 cycles smoothed over station by the Whittaker smoother of each stiff length, one stiff stage by asymmetric least squares (p = 0.01) at 20, 40, 60 and 80 mm, the stand-off by projection less the residuals' median, basins merged by dynamics, the nose class from 10 mm above to 60 mm below eye level.

| Length (mm) | Median / s / c (mm) | Nose (basins, connected, cells, peak) | Lips | Left auricle | Right auricle | Other basins |
| --- | --- | --- | --- | --- | --- | --- |
| 20 | 0.69 / 1.92 / 9.0 | 3, split, 142, 17.9 | none | 5, split, 330, 18.5 | 4, split, 309, 18.0 | 10: the chin (15.9 mm), a band over the forehead at 1675 mm (9 to 10 mm) |
| 40 | -0.42 / 3.87 / 18.1 | 1, connected, 112, 18.6 | none | 5, split, 201, 23.7 | 5, split, 173, 22.2 | 89 over the forehead and vault from 1644 mm up (18 to 20 mm) |
| 60 | -0.81 / 2.84 / 13.3 | 4, split, 552, 29.7 | 1, connected, 2840, 21.3 | 20, split, 120, 28.0 | 23, split, 5174, 30.8 | 496 over the cheeks, temples, forehead and vault (14 to 31 mm) |
| 80 | -1.07 / 2.60 / 12.2 | 8, split, 163, 31.1 | 1, connected, 3411, 31.1 | 14, split, 157, 26.1 | 8, split, 4628, 31.1 | 155 over the cheeks and temples (16 to 31 mm) |

No variant met the rule. Findings, by cause:

1. A baseline does reach the features' full height: at 20 mm the nose stands 17.9 mm and the auricles 18 mm over it, against 4.7 to 12.9 mm under the symmetric fits of the second set.
2. The baseline sinks into the cranium as it stiffens (the median offset falls from 0.69 to -1.07 mm and the whole vault stands 18 to 31 mm over it at 40 mm and more): asymmetric least squares can only push the base out where observations lie inside it, never pull it in, so the base follows its starting keys wherever every observation is outside, and keys smoothed over station shrink the closed dome toward the crown, the shrinkage of run A in the station direction. For the same reason a starting key that carries part of a feature keeps it.
3. The robust scale of a baseline's residuals is not the observations' noise: they spread by the base's misfit and the features (1.9 to 3.9 mm), so the threshold (9 to 18 mm) misses the lips, which stand 4 to 5 mm.
4. The auricles stay in 4 to 23 pieces at every stiffness: the concha and the scapha sink toward the base between the helix and the antihelix, so no threshold on a stand-off map holds an auricle in one piece.
5. The reference head carries source-backed landmark curves the sets did not use: the outer and inner helix and the central upper and lower curves of each auricle, the upper and lower outer lip contours and the philtrum, the nostrils, the nasolabial and mentolabial folds and the skull's midline (`head-observations.json`), the same family the eye fitter reads its lid margins from.
