# Trunk

The trunk's section constants and the observations behind them. The construction is in `AutoMovieHumanTrunkConstruction` and its pieces; the findings are in [generalization](../generalization.md#trunk).

## Landmark heights

Shares of the crotch-to-cervicale span, pooled means of ANSUR II's women and men ([ansur-ii-trunk-ratios](../sources/ansur-ii-trunk-ratios.md), [ansur-ii](../sources/ansur-ii.md)); crotch 0.4809 S, cervicale 0.8605 S. Grade: measured.

| Landmark | Height / S, women, men | Share of the span |
| --- | --- | --- |
| buttock point | 0.5118, 0.5054 | 0.073 |
| omphalion | 0.6017, 0.6014 | 0.318 |
| iliocristale | 0.6113, 0.6044 | 0.335 |
| natural waist, start of its solve | midway iliocristale and tenth rib (0.6485, 0.6380) | 0.382 |
| chest point | 0.7194, 0.7351 | 0.649 |
| axilla | 0.7607, 0.7567 | 0.732 |
| acromion | regressions at the sexes' mean statures, 0.8199, 0.8203 | 0.894 |

The four reference bodies' arm loops merge with the trunk at 0.703 to 0.721 of their span in the A-pose, lower than ANSUR II's hanging-arm axilla; the construction keeps ANSUR's share.

The glenohumeral centre stands under the shoulder point by 0.1044 of the acromion-radiale length: de Leva's 33.7 mm over the women's derived adducted acromion-radiale of 322.7 mm, and 34.5 over the men's 330.5 mm ([skeleton](skeleton.md)). Grade: derived.

## Section shape

Read on the four references' closed horizontal loops (`.references/curves/<id>/sections/trunk`) at each station's share of the person's span, by `packages/human/.shots/claude-trunk/scratch/measure.ts` (local, untracked): the half width at the widest point, its forward place, the front and back depths from it, and the squareness n of the superellipse quadrant `zeta^n + xi^n = 1` fitted to each half beyond `zeta = 0.15` in normalised coordinates. Grade: fitted, flagged; four people only. Held out: each person's value less the median of the other three.

| Station (share) | Front share of depth | Depth / breadth | n front | n back |
| --- | --- | --- | --- | --- |
| crotch (read at 0.073) | 0.428 (held out -0.021 to 0.039) | 0.530 (-0.057 to 0.118) | 2.25 (read at 0.150) | 3.42 (at 0.150) |
| buttock (read at 0.150) | 0.392 (-0.006 to 0.015) | ANSUR II 0.684 (refs 0.647) | 2.25 (-0.19 to 0.23) | 3.42 (-0.10 to 1.27) |
| high hip (0.250) | 0.4875 (-0.045 to 0.022) | 0.7065 (-0.044 to 0.040) | 1.975 (-0.17 to 0.08) | 2.70 (-0.41 to 0.66) |
| waist (0.381) | 0.5575 (-0.019 to 0.034) | ANSUR II 0.718 (refs 0.686) | 2.15 (-0.34 to 0.26) | 3.13 (-0.63 to 0.41) |
| inframammary fold (0.550) | 0.6325 (-0.037 to 0.034) | 0.7185 (-0.053 to 0.074) | 2.095 (-0.11 to 0.08) | 4.485 (-0.40 to 0.93) |
| bust, chest wall (0.649) | 0.6915, men | 0.6865, men | 2.185, men | 4.41 (-0.83 to 0.67) |
| axilla (0.700) | 0.759 (-0.045 to 0.083) | 0.6255 (-0.049 to 0.048) | 3.34, men | 4.80 (-1.55 to 1.32) |

At the bust and the axilla the women's front quadrant carries the breasts (f2 reads n 7.2 and 6.7), so the chest wall takes the men's values and the breasts are their own relief. The back's fit is the poorest (RMS 0.06 to 0.17 in normalised units above the waist): the scapulae and the erector columns are not a superellipse, which the scapular and erector sectors and the spinal furrow carry instead.

Ratios of half widths: crotch over buttock 1.066 (1.040 to 1.097), axilla over bust 1.042 (1.039 to 1.061). The widest point's forward place over stature: 0.0226 at the crotch, 0.0281 at the buttock, 0.0193, 0.0173, 0.0042, -0.0137 and -0.0259 up to the axilla; at the shoulder point the front midline 0.0359, the back -0.0486, the widest -0.0069 of stature.

ANSUR II's chest depth over chest breadth (0.918 women, 0.877 men) does not match the references' A-pose sections at the chest point (0.606 to 0.700): their widest point there is the latissimus beside the raised arm.

## Open

- The breast's window extents and tilt, the buttock's lateral share, the umbilicus and the spinal furrow are conventions until read on the references' meshes.
- Above the f1 shoulder (1338 to 1602 mm) the curve pack has 1,090 unresolved links; shapes there must be read on the mesh.
