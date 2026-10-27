# Reference contour reconstruction

A curve overlay establishes where observations lie, not that a surface reconstructed from them preserves the person. A reconstruction that reads the saved sections without reading the original mesh, compared with the fixed source, qualifies them. It is distinct from the anatomical parameter family: a dense replay of measured contours does not establish independent controls, population generalization or an acceptable product representation.

## Orientation and correspondence

Keep the source surface's orientation witness alongside each closed section. Ordering every contour counterclockwise is useful for measurements but removes the distinction between an outer boundary and a cavity boundary. A containment guess based on one contour point is unstable where a folded or self-intersecting source crosses another contour. Recover the sign from the cutting-plane normal, a segment tangent and its supporting source-face normal before discarding source topology. Grade: derived.

[Fuchs, Kedem and Uselton 1977](https://www.cs.jhu.edu/~misha/Fall13b/Papers/Fuchs77.pdf), read through the graph formulation, expresses contour tiling as elementary triangles and a minimum-cost path. A fixed-seam dynamic program minimizes the chosen tile cost for that seam; it is not the paper's optimum over all cyclic seams. It does not solve branching or certify injectivity. A coarse cyclic phase search can twist nearly coincident sections even when every observed point is accurate. Grade: derived.

Bracket split and merge events separately from ordinary stations. A temporary connecting slit between disconnected contours is an approximation with a measurable extent; its triangles and caps remain error sources. Preserve internal loops and source defects explicitly; a closed output mesh is not anatomical acceptance.

## Critical levels and source defects

Equal loop counts at two stations do not establish an unchanged section topology: a small component can appear and disappear between them, or an outer contour can exchange with a cavity while the count stays fixed. For a piecewise-linear height function on a triangulated two-manifold, [Bremer, Edelsbrunner, Hamann and Pascucci 2004](https://web.cs.ucdavis.edu/~hamann/BremerEdelsbrunnerHamannPascucci2004TVCG.pdf), sections II.C and III.A, classifies vertices by their lower links and uses a symbolic ordering for tied heights. A regular vertex has a connected lower-link arc; extrema have empty or complete lower links, and saddles have multiple components. This supplies critical physical levels before section correspondence discards source topology. Grade: derived.

Bracket each critical level with actual cuts and preserve the incident signed contours and source defect observations. A symbolic tie-break orders combinatorial events; it does not move the measured surface or separate a physically flat plateau. Record equal-height neighborhoods, non-manifold links and coincident events explicitly. A source can be topologically manifold while intersecting itself in space, so link classification alone does not establish an embedded skin. A finite cavity contour whose correspondence failed remains unresolved rather than being capped as a disappearing point.

When a branch contains an intermediate island, its first appearance does not establish that both parent branches have joined. Preserve the complete incident event group before selecting a regional boundary; a midline extremum alone is not a connectivity witness.

Connectivity welding differs from moving source positions. A compact region can remap canonical adjacency while retaining each original geometric vertex. Replacing those positions with weld representatives changes the source being measured and needs its own displacement record. Grade: derived.

## Between-station interpolation

A fitted contour's residual bound says nothing about interpolation between stations. Closely spaced event sections can produce large Hermite overshoot when derivatives inferred from a distant neighboring station are reused without interval-aware control; see [parametric curve families](parametric-curve-family.md). [SciPy's PCHIP documentation](https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.PchipInterpolator.html), notes read, uses zero derivatives at sign-changing or zero neighboring secants and otherwise an interval-weighted harmonic mean. It preserves scalar monotonicity and first-derivative continuity; second derivatives can jump. The cited original Fritsch-Butland paper has not been read here.

Applying this rule componentwise is a candidate for constraining shared longitudinal derivatives, not proof that a surface is embedded or anatomically smooth. The result depends on the chosen coordinate frame, can flatten extrema and retains alternation already present in observed stations. Changing slopes cannot repair a wrong cross-section correspondence. Grade: derived for the scalar properties, inference for the surface application.

## Geometry and display normals

The source's displayed smoothness and its piecewise-planar geometry are different observations. [Three.js BufferGeometry](https://threejs.org/docs/pages/BufferGeometry.html) computes shared vertex normals from adjacent faces, so retriangulating an unchanged planar surface can change these averages and its shaded appearance. Changing anatomical amplitudes to compensate would fit a display operator's loss.

A display-normal comparison may replay the source renderer's normal field sampled on section curves; that field is a shading attribute, not an analytic surface derivative and never product geometry. A reconstructed patch still needs its own geometric tangent and normal contract.

## Measuring a reconstruction

Measure both source-to-reconstruction omission and reconstruction-to-source addition with area-weighted surface samples. An observed sample maximum is not a bound over the complete surfaces. Aggregate residuals can conceal a failed mouth or finger web, so branches, apertures and thin parts are measured separately.

An independently fitted cubic for almost every source edge is a mesh re-encoding even when each span has a small certified residual. Local tangent directions inherited from neighboring source facets can force this result under a strict full-polygon bound. Couple derivatives and semantic knots across a family, distinguish intentional creases from triangulation artifacts and measure coefficient count, identifiability and independent measurement response. Exact event contours remain a useful diagnostic, not an anatomical formula.
