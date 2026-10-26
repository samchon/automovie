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
