# Parametric curve families

Research proposal for [campaign #2834](https://github.com/samchon/automovie/issues/2834), following the checkpoint merge of PR #2829. This method has not been implemented or validated. The checkpoint retains unresolved body and junction defects; the experiment below does not establish a shoulder or complete-Human pass.

## Question and alternatives

Can a small family of dimensioned sections, rounding rules and derived longitudinal curves reproduce useful torso form more reliably than adjusting separate patches? The proposed architecture gives shared dimensions, frames, constraints and boundaries one owner. Bezier, oval and loft representations are candidates within that architecture, not requirements for every part.

Front and side silhouettes provide initial envelopes. Add physical sections and oblique observations because silhouettes do not uniquely determine recesses or internal shape: the author's [visual-hull project](https://cgvg.polito.it/vhull.html) describes the largest shape producing the same silhouettes. Independent Bezier guides could reproduce the same contradictions as independent loft guides. Changing the curve basis alone is therefore a hypothesis to test.

| Representation | Useful case | Limitation to test |
| --- | --- | --- |
| Ellipse or quarter ellipses | Simple tube baseline | Fixed breadth and depth already determine its perimeter; there is no independent rounding or paired-mass parameter. |
| Superellipse | Broad rounding with few parameters | A single convex section cannot express every anterior recess or paired mass. Box-like sections may result from inappropriate exponents. |
| Piecewise cubic Bezier/Hermite oval | Named extrema, tangent directions, local rounding and additional anterior courses | Derive controls from dimensions and shared derivatives. A closed curve is not automatically smooth at closure or free of intersections. |
| Periodic cubic B-spline | Existing shared rings and smooth regular sections | Control points differ from curve points. Reconstructing the curve from four control radii changes its meaning. |
| Coons patch | Four compatible boundary curves | Boundary positions alone do not prescribe compatible transverse derivatives or the desired interior mass. |
| Transversely constrained patch | A junction requiring shared tangent planes | The boundary derivative field and corner conditions must agree over the whole join. |
| Gordon network | Profiles crossed by additional guides | Intersection correspondence and compatible parameters must be solved before interpolation. |

The [MIT Shape Interrogation text](https://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node12.html) gives Bezier endpoint derivatives and convex-hull properties. Those properties help bound individual segments; they do not prove an assembled surface injective. [OCCT's Bezier documentation](https://occt3d.com/dev/doc/refman/html/class_geom___bezier_curve.html) distinguishes polynomial and rational curves, explains exact circular/elliptical arcs with weights, and warns that closure alone does not ensure periodic derivatives. A polynomial cubic oval can approximate those arcs when exact conics are unnecessary.

The [official TiGL curve-network algorithm](https://dlr-sc.github.io/tigl/doc/3.3.0/classtigl_1_1CTiglInterpolateCurveNetwork.html) computes intersections, sorts curves, makes their parameters compatible and then constructs a Gordon surface. It is evidence for explicit network compatibility, not a reason to add a CAD dependency to Human. Similarly, [OCCT constrained filling](https://occt3d.com/dev/doc/refman/html/class_geom_fill___constrained_filling.html) separates boundary paths from tangency constraints and checks both position and normal errors; its fillet-oriented implementation is not promised as an organic-surface remedy.

## One shape definition

Define `S(y,v; m,theta)` in a torso-local frame. `m` contains independent measurements and landmark planes, `theta` contains named shape coefficients, `y` is physical height, and `v` identifies a semantic phase. Horizontal anthropometric sections remain horizontal; a transported sweep frame must not silently replace their measurement plane. Normalize height between landmarks for dimensionless rules while retaining the independent input heights.

The section family owns its centre, front/back/lateral envelopes, rounding and any declared paired anterior course. Derive section anchors, longitudinal guides, construction and dependent placement from this evaluator. The frontmost point need not lie on the sternal midline; a family that forces that relationship cannot represent an off-axis pectoral maximum regardless of the optimizer.

For a cubic segment over parameter span `du`, with endpoints `P0,P3` and physical derivatives `T0,T1`, derive its controls as `P1=P0+du*T0/3` and `P2=P3-du*T1/3`. Neighboring segments reference the same endpoint and derivative definition. This is an algebraic construction from dimensions, not free fitted vertex coordinates. Existing network `through` points are Catmull–Rom interpolation waypoints; placing them with a Bezier formula does not change the generated curve into that Bezier curve.

Choose the discrete section vocabulary before fitting. Four oval arcs may suffice for a simple tube; a paired anterior mass and recess may need additional semantic arcs. Use the same vocabulary for all identities in the profile. Fit only the rounding and mass parameters supported by observations, with one longitudinal onset/peak/decay family shared across related guides. Feature widths use physical dimensions, independently of chart spacing or emitted row count. Do not introduce a per-height, per-ray or per-person correction array.

At a join, both parts consume one boundary `C(v)` and its physical transverse derivative field. With consistent chart orientation, geometric tangent continuity allows `dR=alpha*dL+beta*C'`, with positive `alpha`; parametric C1 is the stricter case with matching derivative units and parameter spans. Check the complete boundary and compatible corner conditions. One matching endpoint, equal shared normal indices or an isolated middle-edge normal does not establish the adjacent shape.

## Dimensions and reference correspondence

Record each dimension's plane, posture, tissue compression and measurement convention. Skin arclength, a planar convex-hull tape perimeter and a caliper breadth are different quantities. A breadth/depth/girth triplet may be infeasible for an ellipse or inconsistent under the selected protocol. Test feasibility within the declared shape family instead of scaling all dimensions together. Where protocols match, additional rounding degrees of freedom can preserve breadth/depth while solving girth on the displayed section.

Fit a reference using its own consistently extracted dimensions, then treat the resulting coefficients as shape/style priors conditional on dimensions. Reference styling is not population anatomy. A mesh warped to the desired dimensions is not independent validation of those dimensions. Preserve native pose, registered pose, anatomical plane and connected-component identity in observations; a bone-affine registration does not supply missing pose correctives.

Fix the fitting gauge before optimizing shape: origin, axes, scale, mirror convention and semantic section heights. Inspect the scaled residual Jacobian with SVD to detect indistinguishable combinations such as centre shift versus anterior projection or width versus rounding. Freeze redundant parameters or collect an independent observation. [Ceres's covariance documentation](https://ceres-solver.readthedocs.io/latest/nnls_covariance.html) discusses whitening, gauge ambiguity and rank deficiency; its statistical covariance assumptions are not automatically satisfied by four selected reference meshes.

## Objective and solve

Use connected contour geometry rather than mesh vertex indices or equal polar angles. A suitable proposed objective is:

```
E(theta) = E_sections + E_front/side + E_oblique + E_landmarks
         + lambda_flow * E_longitudinal_variation
         + lambda_prior * E_named_coefficient_prior
```

Normalize each observation class by sample count and its declared uncertainty or engineering scale. Use symmetric closest-distance residuals with arclength weights and semantic feature correspondence to prevent a match jumping between masses. [Wang, Pottmann and Liu](https://i.cs.hku.hk/~wenping/SDM/TOG_SDM.pdf) analyze geometric curve-distance fitting and the limitations of point/tangent approximations. This supports a geometric objective; it does not mean the current Human fitter implements their method. [Robust losses](https://ceres-solver.readthedocs.io/latest/nnls_tutorial.html#robust-curve-fitting) can reduce outlier influence but must not hide a wrong plane, registration or omitted anatomical course.

A conservative pilot solve initializes from measured extrema, fixes semantic knot order, and alternates closest-point assignment with bounded trust-region Gauss–Newton updates of the named coefficients. Eliminate closure and shared position/derivative equalities algebraically through the family. A remaining girth parameter can use a bracketed scalar root only on a verified feasible monotone branch while keeping breadth/depth fixed. Otherwise report infeasibility. Use QR/SVD for the small scaled step and preserve the last valid iterate when a step violates orientation, constraints or bounds. This is a proposed local solver, without a global-optimum guarantee.

## Source to displayed skin

Trace the same semantic observations through the complete chain:

| Stage | Meaning |
| --- | --- |
| B | Continuous generating source |
| C | Writer samples after cell, girth and pin semantics |
| D | Original inverse-fitted control cage |
| Q | Completed refined generating controls |
| E | Displayed limit/relief skin |

At pinned rows C contains declared control positions, not geometric curve samples. Refined Q controls also differ from limit points; [OpenSubdiv](https://opensubdiv.org/docs/subdivision_surfaces.html) distinguishes refinement, limit evaluation and tessellation. Preserve source-face identities and physical vertex identities when comparing these stages.

Optimize the inexpensive source family first, then qualify it against E using the same sections, extrema and boundary derivatives. Any final adjustment of named coefficients must preserve both the source fit and stage-preservation criteria. If cell averaging removes a source peak, increasing an anatomical amplitude to compensate is not evidence of a better family. Isolate the operator/domain loss. A raw-point versus cell choice would need explicit generic semantics shared by writers, probes, boundaries and girth solving, rather than an undocumented alternative target buffer.

Reuse basis evaluations and subdivision stencils where topology is fixed. Keep the actual final consumer in acceptance. The [Stanford surface-fitting work](https://graphics.stanford.edu/papers/surfacefitting/) illustrates separation of dense observations from a coarse surface representation; its stored displacement data is not a proposed Human asset.

## Bounded torso experiment

Test the unbranched torso band from waist through the declared fold and chest sections to the axillary boundary. Preserve the skeleton, pelvis, head, arms, shared junction definitions and published UV meaning. This tests a torso family and does not claim to solve the shoulder branch. Record both field value and derivative at axilla. If an observed mass must continue above it, consume the same physical field across the boundary or declare the bounded pilot's boundary assumption inadequate; do not zero the field at the cut or copy a neighbor's placement.

| Phase | Evidence and decision |
| --- | --- |
| Freeze | Record one committed source/consumer, gate inputs, reference provenance, observation planes, cameras, uncertainty and evaluation budget. |
| Qualify data | Select the closed torso component at each plane, separate arm contours and retain all component counts. Ambiguous correspondence stops fitting. |
| Compare families | Fit the current ellipse/superellipse baseline and coupled oval/Bezier candidate under matching data and constraints. Initially keep the generic operator, topology and material unchanged. |
| Check identifiability | Use fixed semantic anchors, scaled Jacobian and deterministic initializations; reject parameters that cancel or remain unconstrained. |
| Hold out | Fit three gate references and predict the fourth, repeated four times. Also reserve interleaved physical heights, contour sectors and oblique observations; neighboring samples are correlated, so they do not replace identity holdout. |
| Qualify the pipeline | Measure B/C/D/Q/E preservation and actual displayed dimensions. Source improvement erased downstream is a classified failure, not permission to inflate amplitudes. |
| Judge appearance | Inspect the joined four gates over external directions, close-up surface/overlay/construction/raking views, and affected rest/intermediate/extreme/return motion states. Account for every recorded defect and neighbor regression. |

Before running the experiment, choose and record the independent coefficient count, key/holdout sections, uncertainty scales, required holdout improvement, tolerated per-identity regression, dimension/extremum errors, junction position/tangent tolerances, intersection domain, resolution variant and cold/warm time/memory budgets. These are experimental design variables, not new product gates established by this proposal. Existing product gates remain in force; engineering error limits do not establish clinical accuracy.

Begin at the existing topology. If evidence requires a support-resolution variant, declare it once for the whole profile and compare it independently of new shape coefficients. Record emitted faces, evaluation count and LOD behavior under matching hardware/load. Keep semantic feature locations independent of tessellation. Compare strict triangle intersections and sampled source Jacobian orientation while stating that finite checks are not proofs of continuous injectivity.

One fitting/validation round can be followed by one coherent correction when it identifies a bounded cause. If matching holdout and visual review still fail, stop the experiment and report the failed hypothesis and smallest missing capability. Stop earlier for incompatible dimensions, unidentifiable parameters, missing junction support, downstream source loss or excessive complexity/runtime. A lower aggregate loss with a new shelf, groove or neighbor defect fails. This proposal does not authorize a complete Human rewrite or indefinite per-person tuning.

## General asset and CAD use

The shared architecture extends beyond Human; the best geometric operator depends on shape, topology and motion. [OCCT's modeling guide](https://occt3d.com/dev/doc/overview/html/occt_user_guides__modeling_algos.html) separates primitives, sweeps, revolutions and boolean operations.

| Asset requirement | Candidate representation | Boundary of applicability |
| --- | --- | --- |
| Cube, plate or rectangular housing | Box or sketch extrusion, with dimensioned fillets where needed | An oval loft adds variables without a shape benefit. |
| Axisymmetric vessel or wheel | Profile and revolution | Holes and wall thickness belong to the profile/solid definition. |
| Constant-section rail, cable or duct | Sweep/extrusion | Validate frame twist, self-contact and wall thickness. |
| Varying tube/fuselage with stable section topology | Compatible section loft or Gordon network | Explicit phase and guide/profile correspondence. |
| Hole maintained through a duct | Corresponding outer/inner loops, boundary surfaces and annular caps | Keep loop identity, orientation and clearance; not every wire-loft API directly accepts nested multi-loop faces. |
| Drilled plate or hole starting/ending within a part | Primitive/extrusion with trim or boolean cut | Make the topology-changing feature explicit rather than forcing a singular row. |
| Branch, saddle or handle attachment | Named patch network or feature decomposition with boolean/blending where appropriate | A single regular rectangular loft cannot cover an arbitrary branch as a nonsingular one-to-one chart. |
| Handle or holes that merge/split along an axis | Closed-path tube where useful, plus explicit junction/topology features | Change decomposition or sweep axis instead of assuming constant loop topology. |

[MakePrism](https://occt3d.com/dev/doc/refman/html/class_b_rep_prim_a_p_i___make_prism.html) documents face-to-solid extrusion. [ThruSections](https://occt3d.com/dev/doc/refman/html/class_b_rep_offset_a_p_i___thru_sections.html) accepts ordered section wires and processes their origin/orientation compatibility. [MakeFace](https://occt3d.com/dev/doc/refman/html/class_b_rep_builder_a_p_i___make_face.html) adds a wire as a hole and warns about intersecting boundaries and required pcurves. These contracts support explicit loop and topology handling, not a guarantee that any hole or branch is one loft. A valid B-rep/boolean solid and a deforming subdivision skin have different continuity and motion contracts.

Generic interpolation, sampling, fitting, topology and solid operations belong to core when a demonstrated gap requires them. Human owns anatomical dimensions and the fitted shape vocabulary. Keep extracted reference geometry and per-reference diagnostic forms outside the package; production uses compact named rules with sources. No implementation or library adoption follows from this research proposal alone.

## Reading and uncertainty

| Source | Scope read for this proposal |
| --- | --- |
| [Laurentini group's Visual Hull page](https://cgvg.polito.it/vhull.html) | Author-group definition and limitations. The linked original scanned paper was opened but not read in full. |
| [MIT Bezier properties](https://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node12.html) and [B-spline properties](https://web.mit.edu/hyperbook/Patrikalakis-Maekawa-Cho/node17.html) | Author-hosted endpoint/derivative, convex-hull and control/curve distinctions. The cubic handle identity above is derived from the Bernstein polynomial. |
| [OCCT Bezier curve](https://occt3d.com/dev/doc/refman/html/class_geom___bezier_curve.html) | Rational/nonrational forms, exact conic-arc weights and closure warning. |
| [DLR TiGL curve-network interpolation](https://dlr-sc.github.io/tigl/doc/3.3.0/classtigl_1_1CTiglInterpolateCurveNetwork.html) | Official intersection, sorting, compatibility/reparameterization and construction sequence. The related paper could not be retrieved, so no full-paper claim is made. |
| [OCCT constrained filling](https://occt3d.com/dev/doc/refman/html/class_geom_fill___constrained_filling.html) | Path/tangency contracts, result checks and fillet-specific limitation. |
| [Wang, Pottmann and Liu, 2006](https://i.cs.hku.hk/~wenping/SDM/TOG_SDM.pdf) | Abstract and sections 1–3: geometric objective, point/tangent approximations, curvature approximation and fixed-knot assumptions. It concerns planar curves, not anatomy. |
| [Ceres covariance](https://ceres-solver.readthedocs.io/latest/nnls_covariance.html) and [robust curve fitting](https://ceres-solver.readthedocs.io/latest/nnls_tutorial.html#robust-curve-fitting) | Whitening, gauge/rank/SVD and robust-loss treatment. Statistical assumptions are not asserted for reference meshes. |
| [OpenSubdiv surfaces](https://opensubdiv.org/docs/subdivision_surfaces.html) | Regular/irregular features, refinement versus limit tessellation and topology/data separation. |
| [Krishnamurthy and Levoy, 1996](https://graphics.stanford.edu/papers/surfacefitting/) | Author-hosted abstract/process, not the full paper. No adoption of stored displacement maps. |
| OCCT modeling guide and MakePrism/ThruSections/MakeFace pages linked above | Official primitive, sweep, boolean, section-wire and hole contracts, including their stated restrictions. |

These primary or official sources were checked on 2026-10-16. The family design, objective composition and experiment are engineering inferences, not reported results. Four selected modeled identities cannot establish population anatomy, unrestricted age/body coverage, clinically correct tissue behavior or successful posing. Existing source-to-skin and junction failures remain evidence against accepting a curve-basis change without the complete comparison.
