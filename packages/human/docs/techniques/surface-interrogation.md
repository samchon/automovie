# Surface interrogation

Interrogation tools show which construction value produced a defect, so one round can build a complete cause model and test it with numeric comparisons on the construction before one combined change. They grade smoothness and fairness, not anatomical correctness.

## Instruments

Reflection lines depend on the eye point and highlight lines do not; both expose dents and tangent breaks ([Hahmann et al. 2008](../sources/hahmann-2008-shape-interrogation.md)). Isophotes, lines of equal light intensity, are `C^(r-1)` on a `C^r` surface, so a curvature discontinuity appears as an isophote break; a light whose tangent-plane projection runs parallel to the isophote hides the break, so at least two light directions are needed. Zebra stripes are the rendered form of this test. Grade: derived.

Curvature plots and hedgehog diagrams read reliably on planar sections of a surface; the same survey advises against whole-surface hedgehog diagrams. For a lofted part the useful sections are the horizontal stations, horizontal cuts between stations and vertical meridians at fixed section phase. Gaussian and mean curvature maps of the limit surface show the shape sign around each extraordinary vertex.

A curve is judged fair when its curvature plot is continuous and consists of few monotone pieces (Farin and Sapidis, IEEE CG&A 9(2), 1989, not read; Sapidis and Koras, CAGD 14(4):299-311, 1997, on how plot scaling changes the judgment, not read). Industrial class A surfacing requires highlight lines that do not oscillate and a normal mismatch below 0.1 degree along seams; [Karčiauskas and Peters 2015](https://www.cise.ufl.edu/research/SurfLab/papers/15bi3C0.pdf) show most bicubic constructions near irregular points fail that standard (abstract read). Grade: conventional.

## Band signatures

A horizontal band, plate or shelf on a lofted part has one of the causes below; each leaves a distinct signature that a numeric comparison on the construction can confirm before any source change. Grade: inference built on the cited properties.

| Cause | Signature | Comparison |
| --- | --- | --- |
| C2 or tension spline overshoot between unevenly spaced keys | Channel extrema between keys; the band sits mid-interval and grows with the ratio of adjacent intervals | Evaluate the same keys with a C2 spline and a [shape-preserving interpolant](parametric-curve-family.md#station-channels) and plot the channel against height |
| Key-to-key alternation in the key data | Extrema at keys; second differences of the key values alternate in sign; persists under every interpolant | Sign sequence of second differences over the keys |
| C1-only channel | Isophote kinks exactly at key heights | Isophote or zebra render under two light directions |
| Zero slope at a data extremum (`pchip` family) | Flat shelf centred on the key where a channel peaks | Whether the shelved keys are local extrema of that channel |
| Inconsistent station dimensions | Cylindrical segment between two stations | Inequality constraints between stations in the dimension table |
| Section representation lacking a degree of freedom | Masses or recess missing at every station rather than banded | Reference section and generated section overlaid at the same height |
| Sampling or cage-fit loss | Narrow features lost or flanked by grooves, independent of height | Source surface against cage limit at the same surface coordinates, read against the [retention table](subdivision-and-cage.md#feature-retention-through-a-ring) |
| Extraordinary vertex of the wrong valence for the curvature sign | Dimple on a convex mass at valence 5, flat spot in a saddle at valence 3 | Valence of each pole against the intended Gaussian curvature sign |

## Attribution

The generating curves, sampled values, cage, limit surface, relief skin and viewer form a composition, so the normal deviation of each stage from the previous one at shared surface coordinates splits the total error into per-stage parts. Grade: inference.

Design velocity is the normal displacement of a surface per unit change of one parameter, computed by finite differences on faceted models ([Agarwal et al. 2018](../sources/agarwal-2018-design-velocity.md)). Perturbing each named channel coefficient and comparing its velocity field with a defect's location attributes the defect to that coefficient. The method is linear and cannot reveal a representation that lacks the needed degree of freedom. Grade: inference for Human.

When several causes act together, a fractional factorial design separates their main effects with fewer comparisons than toggling one cause at a time (Box, Hunter and Hunter, *Statistics for Experimenters*, 2nd ed., Wiley, 2005, not read). It fits numeric comparisons on the construction, not renders after each change. Grade: conventional.

## Global fairing

Global fairing solves all controls together, minimizing an energy under interpolation constraints instead of correcting local regions. [Halstead, Kass and DeRose 1993](../sources/halstead-1993-fair-interpolation.md) minimize thin-plate and membrane energy on a Catmull-Clark cage that interpolates given points and normals. Moreton and Séquin, "Functional optimization for fair surface design", SIGGRAPH 1992, pp. 167-176, minimize the variation of curvature rather than curvature; Greiner, "Variational design and fairing of spline surfaces", CGF 13(3), 1994, treats spline surfaces (both not read). An energy weight trades fidelity against smoothness, thin-plate energy flattens anatomical ridges that are not constrained, and curvature-variation energy is nonlinear and costly.

Global fairing suits derived channels such as rounding exponents and feature amplitudes. Measured anthropometric dimensions stay independent inputs and are constraints, not faired values. Grade: inference.
