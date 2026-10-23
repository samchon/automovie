# Subdivision and cage design

Catmull-Clark gives a uniform bicubic B-spline in regular regions. [Stam](../sources/stam-1998.md) explains limit evaluation and why extraordinary vertices generally lose curvature continuity. [OpenSubdiv](../sources/opensubdiv-documentation.md) recommends mostly regular faces and few extraordinary vertices because poor pole placement creates waviness.

For Human, pole placement is a shape decision. Finger roots, facial openings and branch saddles need topology changes; broad cheeks, abdomen and thighs expose their curvature artifacts under specular light. [Bommes et al.](../sources/bommes-2013-quad-mesh-survey.md) connect useful quad alignment with curvature and intended deformation. More subdivisions approximate the same underlying cage rather than repairing an unsuitable course.

Semi-sharp creases support tight turns without infinite sharpness. [The hybrid subdivision patent](../sources/us6222553-hybrid-subdivision.md) describes finite sharpness for skin; infinitely sharp normal discontinuities can tear a displaced surface. Crease sharpness is an algorithmic parameter, not an anatomical length or a measured tissue property.

Refined control points differ from limit points. Positions, normals, landmarks and measurements need a declared common surface meaning; a measurement of cage controls does not establish the displayed dimension. Regular bicubic evaluation and extraordinary-region evaluation have different requirements. Boundary interpolation also affects intentional openings, so a smooth interior premise cannot be applied unchanged at a lid or mouth boundary.

Subdivision smoothness alone does not establish anatomical form or deformation quality.

## Feature retention through a ring

Along a regular ring the Catmull-Clark limit is a periodic uniform cubic B-spline, whose limit at node `j` is `(c[j-1] + 4c[j] + c[j+1]) / 6` and whose span value at `u` in `[0, 1]` uses the weights `((1-u)^3, 4 - 6u^2 + 3u^3, 1 + 3u + 3u^2 - 3u^3, u^3) / 6`. A unit Gaussian ridge of full width at half maximum `w` (`sigma = w / 2.3548`) was sampled on 32 columns of spacing `h`, with three choices of controls: samples used directly as controls; controls solved from the circulant system `(1, 4, 1) / 6` so the limit interpolates the samples at the nodes; controls fitted by least squares to 64 source evaluations per span. Retention is the largest limit value within `w` of the ridge centre and the side groove is the lowest value farther out, each the worst over ridge centres at 0, 0.25 and 0.5 `h` from a node. Grade: derived (one-dimensional, ring curvature ignored, regular region only).

| `w / h` | Samples as controls | Interpolating controls | Least-squares controls | Side groove, interpolating / least squares |
| --- | --- | --- | --- | --- |
| 0.5 | 6.0 % | 7.5 % | 41.3 % | -13.7 % / -14.0 % |
| 0.75 | 27.9 % | 35.0 % | 58.8 % | -13.1 % / -15.5 % |
| 1 | 47.9 % | 60.0 % | 72.8 % | -9.8 % / -12.8 % |
| 1.5 | 70.7 % | 86.7 % | 90.1 % | -3.1 % / -4.1 % |
| 2 | 81.5 % | 95.7 % | 96.9 % | -0.1 % / -0.5 % |
| 3 | 90.8 % | 99.4 % | 99.7 % | 0 / 0 |
| 4 | 94.6 % | 99.9 % | 99.9 % | 0 / 0 |
| 6 | 97.5 % | 100 % | 100 % | 0 / 0 |

In the finite 32-column, three-phase experiment above, the sampled solved/fitted cases retained about 96 % at `w/h=2` and 99 % at `w/h=3`; these are sampled outcomes, not bounds for arbitrary rings, phases or features. Samples used directly as controls lost about 2.5 % at `w/h=6` in that experiment. Below `w ≈ 1.5h` both fits cut grooves of 10 to 16 % of the feature height on both sides of it, a mechanism for notches beside narrow features. Retention differs by up to a factor of two with the feature's position between columns, so aligning a column with a named feature line matters as much as the column count. For example, an ankle perimeter of about 220 to 240 mm on 12 columns gives `h` near 19 mm, so a calcaneal tendon prominence about 15 to 20 mm wide keeps 60 to 73 % with a fitted cage, and four front trunk columns over about 300 mm give `h` near 75 mm, so a 40 to 60 mm midline recess is mostly lost; the widths are illustrative and each part substitutes its measured `w`, `h` and amplitude. Grade: inference. B-spline signal processing (Unser, Aldroubi and Eden, IEEE Trans. Signal Process. 41(2):821-848, 1993, not read) is the general theory of this prefilter.

## Fitting a cage to curves

[Halstead, Kass and DeRose 1993](../sources/halstead-1993-fair-interpolation.md) solve a Catmull-Clark cage whose limit interpolates given points and normals exactly while minimizing thin-plate and membrane energy. Litke, Levin and Schröder, "Fitting subdivision surfaces", IEEE Visualization 2001, pp. 319-324, fit by quasi-interpolation (not read). Standard Catmull-Clark cannot interpolate a cubic spline network wherever a curve meets an extraordinary vertex; [Schaefer, Warren and Zorin 2004](../sources/schaefer-2004-lofting-subdivision.md) modify the rules near the curves so the limit contains given cubic B-spline curves exactly, and Levin's combined subdivision (CAGD 16, 1999, not read) interpolates arbitrary parametric curves with cross-boundary data.

## Extraordinary vertices and curvature sign

[Karčiauskas, Peters and Reif 2004](../sources/karciauskas-2004-subdivision-shape.md) show that for generic input the shape at a standard Catmull-Clark extraordinary vertex depends on its valence rather than on the cage: valence 3 gives a weak flat spot and cannot model a saddle, valence 4 is C2, and valence 5 or more has a diverging principal curvature and is hyperbolic in the limit, so it cannot model a convex surface. A valence-5 pole therefore belongs where the intended surface is a saddle, such as the axilla, groin, finger webs and neck-shoulder, a valence-3 pole where it is convex, and neither in a broad convex lit mass such as the deltoid, gluteal region, breast or calf. Grade: derived for the valence behaviour; the anatomical placement is inference.

## Counting extraordinary vertices

On a quad mesh the interior vertices satisfy `sum(4 - valence) = 4 * chi`, with boundary vertices counted against valence 3 (discrete Gauss-Bonnet). A branch region with one tube in and two out has `chi = -1`, so it needs a net `-4`: four valence-5 or two valence-6 vertices. A change of column count along a tube needs a valence-3 and valence-5 pair. [Schaefer, Warren and Zorin](../sources/schaefer-2004-lofting-subdivision.md) bound any patch bounded by `k` curve pieces by `sum |valence - regular| >= |k - 4|`, so with valences of at most 5 it has at least `|k - 4|` extraordinary vertices. Grade: derived.
