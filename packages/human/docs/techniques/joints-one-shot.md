# Human joint construction

Campaign [#3151](https://github.com/samchon/automovie/issues/3151) builds joint surfaces from the figure's own sections, courses and anatomical landmarks. Examine each junction in matched-camera clay, construction curves over clay and close views. Naturalness determines shape acceptance. Section and mesh measurements diagnose causes and verify structural requirements.

## Ownership of a junction

A side joint has a single boundary curve on the parent surface. The parent supplies the point and tangent plane at each address. The child starts there and carries those conditions into its own regular sections. An end joint starts from the host's end curve. The first child cuts divide the host's ray domains and carry their own distal sections. Preserve these distal sections and their jets at the protected mark.

For a measured parent loop with tangent `C'` and oriented normal `N`, the cross tangent in the parent plane is `N × C'`. Its orientation follows the parent-to-child direction. The collar must keep that orientation and avoid a singular Jacobian. Wang's anatomical model uses cross tangents at shoulder boundaries. Gabrielides et al. give the corresponding conditions for normal cyclic charts of branching surfaces. [Wang 2005](https://mewangcl.github.io/pubs/CADParaHuman.pdf), [Gabrielides et al.](https://users.math.uoc.gr/~mkaravel/files/papers/bransurf.pdf).

### The port's slope bounds (2026-11-24)

Write the radius before the protected mark as `r(t) = (1 - q(t)) r_L + q(t) r_M + h(t) L sigma`. Here `q(t) = 6t^5 - 15t^4 + 10t^3`, `h(t) = t(1 - t)^3(1 + 3t)`, `L` is the station reach and `sigma` is the parent departure slope. The quintic preserves the endpoint values and first two derivatives.

For a guarantee independent of a refitted `r_M >= 0`, use the infimum of `(1 - q)/h`. Its value is `5/2` at the marked end. The scope requires `sigma > -(5/2) r_L/L` for positive radius. The maximum of `h` is `16/81` at `t = 1/3`, so a positive slope term remains within one fold reach when `sigma <= (81/16) reach/L`. The physical fold reach comes from the person's local geometry. [Signed continuation](armscye-join.md#signed-slope-continuation-on-the-parent-chart).

On an outward radial sheet the slope is `b/a`, where `a = N·e` and `b = -N·(o' + r e')`. Continue the level set of the violated bound toward the nearest admissible parent address. Join the corrected and unchanged curve over one fold reach with the quintic. A radial chart needs a different representation where that signed outward condition cannot hold. The independent 60-degree cylinder fixture checks the negative projection and the signed level set.

## Shoulder source and inspection

The development reader checks the exact pinned CC0 MakeHuman HM08 OBJ and its rig markers. Compare at the asset's arm pose and use erect clinical measurements in their own joint-relative frames. The raw indexed shoulder divider produced one directed turn and 14 reversed outward subsegments. The nonradial child starts from the same boundary and cross tangent. It restores the directly measured distal section and its jets at the protected mark. [MPFB assets](https://github.com/makehumancommunity/mpfb2/blob/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a/LICENSE.ASSETS.md), [Yoshida et al. 2022](https://doi.org/10.1186/s13018-022-03113-5).

The raw welded test patch shared 229 rim edges and zero crossings. Same-camera views revealed repeated ridges across the low saddle after curvature-variation fitting. The original authored Catmull–Clark cage and the subdivision engine's limit positions and normals give a smoother source. Along the raw, first-level and second-level section curves the largest neighboring normal turn was 41.17, 16.38 and 8.95 degrees respectively. The second-level patch removes the repeating ridges in the axilla close view. Its two outer rails still need attachment before whole-joint review. [OpenSubdiv](https://github.com/PixarAnimationStudios/OpenSubdiv/blob/dev/documentation/far_overview.rst), [Moreton and Séquin 1992](https://people.eecs.berkeley.edu/~sequin/PAPERS/SIGGR92_MVC_MVS.pdf).

## Fan numerical work

### The leg's first elastic step, diagnosed 2026-11-24

The failed dual iterate had relative stationarity `0.00318634`. Its equality polish reduced stationarity to `3.32e-16` while exceeding an inactive row by `3.54e-5`. The active equalities were insufficient to certify the complete affine step.

Both pivots in a working-set rotation were the least positive binary64 number. Their rounded norm equalled each pivot, so the computed cosine and sine were both one. The free basis lost the metric identity `H J J^T = I`. Add and drop now scale both pivots by their largest magnitude before forming the rotation. The unscaled norm is needed only as the output diagonal. On the same affine replay, raw relative stationarity changed from `8.39e-4` to `1.70e-14` and the complete polish passed at `3.25e-16`. The independent active-set regression forces a working-set update with a subnormal tail. [Goldfarb and Idnani 1983, section 4](https://link.springer.com/article/10.1007/BF02591962).

### Prepared readings

Prepare fixed course frames, station indices, phase rays, cut interpolation factors and numerical row layouts per fit. A derivative reads the local point velocity and the cardinal weight of the moved spline knot. Trials resolve their actual conic sections. The prepared read follows only incident seams and wedges. Preparation is scoped to its declared input range.

Matched three-reading measurements reduced the first hand derivative from 5.416 to 2.784 seconds and its section builds from 7,635 to 2,479. The corresponding leg derivative changed from 7.432 to 3.869 seconds and from 16,495 to 5,087 section builds. The measurements cover the solver and its preparation through the short profile.

## Acceptance order

1. Run the 60-degree signed-port case. Fit the public shoulder and check its complete attachments, topology and matched-camera shape.
2. Fit the entire hand and foot branch groups. Examine dorsal and palmar or plantar, interdigital and tip or side views before using the result.
3. Fit the crotch and breast roots after the foot and the thumb after the hand. The thumb's parent supplies the thenar wall through the first metacarpal's attachment.
4. Run the complete body, twenty length variants and tissue cases. Inspect forty matched views of twenty nails. Verify 0.01 mm maximum clipping, closed and consistently wound skin, expected genus, empty anatomical probes and contact gaps. [Consistency checks](../testing/consistency.md).
