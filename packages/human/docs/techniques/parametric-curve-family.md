# Parametric curve families

A shared family of dimensioned sections can make envelopes, rounding and longitudinal guides consume one shape definition. This is a candidate method, not an implemented or accepted replacement for Human's current generators. Changing a curve basis alone does not resolve contradictory dimensions, incompatible boundaries or source detail lost before the displayed skin.

## Representation and correspondence

An ellipse couples breadth, depth and perimeter. Extra rounding degrees of freedom can preserve breadth and depth while solving a compatible girth; paired anterior masses or recesses may require additional semantic arcs. Front and side silhouettes do not uniquely determine those internal courses, as the author's [visual-hull explanation](https://cgvg.polito.it/vhull.html) shows.

A section family uses physical height in millimetres, dimensionless semantic phase, independent measurements and named shape coefficients. Horizontal anthropometric sections retain their declared planes rather than inheriting a transported sweep frame. Skin arclength, convex-hull tape perimeter and caliper breadth are different measurements; incompatible protocols cannot be repaired by fitting.

For a cubic span of width `du`, endpoint derivatives give controls `P1=P0+du*T0/3` and `P2=P3-du*T1/3`. Adjacent spans share endpoints and derivative definitions. The [MIT shape interrogation text](https://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node12.html) gives these derivative and convex-hull properties. [OCCT's Bezier documentation](https://occt3d.com/dev/doc/refman/html/class_geom___bezier_curve.html) explains why rational weights represent exact conics and why closure alone does not ensure periodic derivatives. Existing Catmull-Rom interpolation waypoints retain their own meaning.

A Gordon network requires intersecting profiles and guides with compatible parameters. [TiGL's algorithm](https://dlr-sc.github.io/tigl/doc/3.3.0/classtigl_1_1CTiglInterpolateCurveNetwork.html) explicitly solves intersections, ordering and parameter compatibility. At a join, a shared boundary curve also needs compatible transverse derivatives and corner conditions; [OCCT constrained filling](https://occt3d.com/dev/doc/refman/html/class_geom_fill___constrained_filling.html) distinguishes position from tangency constraints. Neither source proves an organic surface injective or anatomically correct.

## Fitting limits

Origin, axes, scale, mirror convention and semantic section heights fix the fitting gauge. Centre shift and anterior projection, or width and rounding, can otherwise become indistinguishable. [Ceres covariance documentation](https://ceres-solver.readthedocs.io/latest/nnls_covariance.html) explains rank deficiency and gauge ambiguity; its statistical assumptions are not established for selected reference meshes.

Connected contour distances with arclength weights preserve geometric meaning better than matching vertex indices or equal polar angles. [Wang, Pottmann and Liu](https://i.cs.hku.hk/~wenping/SDM/TOG_SDM.pdf) analyze curve-distance fitting and point/tangent approximations. Their planar-curve method does not establish anatomical correspondence. A fitted modeled reference is a shape prior, not population anatomy or independent validation of dimensions used to warp it.

The generating surface, sampled writer values, inverse-fitted cage, refined controls and displayed limit/relief skin are different stages. Pinned controls need not lie on the source curve; refined controls need not lie on the limit surface. [OpenSubdiv](https://opensubdiv.org/docs/subdivision_surfaces.html) distinguishes refinement from limit evaluation. Inflating an anatomical amplitude to compensate for lost source detail confounds shape with the sampling operator.

Unresolved limits include shoulder branching, derivative compatibility across part cuts, infeasible measurement triplets, parameter identifiability and preservation of the source through the displayed skin. Four selected adult references cannot establish age/body coverage or posed tissue behavior. Actual viewer observations and operating policy belong to the [Human skill](../../../../.agents/skills/human/SKILL.md).
