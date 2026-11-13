# Original 2D Curves

Author the shape through anatomical points, construction lines and visible curve controls before composing its source or judging its loft. Each span's contract selects its representation ([Choose The Representation](#choose-the-representation)); changing a polynomial basis alone preserves its shape and cannot repair wrong datums, domains or boundary conditions.

## Few View Curves Per Segment

Define a segment by a few 2D view curves in its own frame: the front outline pair, the side outline pair, its axis and a fullness control. Each cross-section is the chain of conic arcs through the outline points at its station, shaped by the fullness value. This is conic lofting, the long-established method for fuselages and hulls; two orthogonal circles already give a sphere. Lines, circles and arcs are drawn as such where the anatomy calls for them.

Conic lofting is not limited to convex sections. A groove, crease or valley that runs along the segment, such as the alar groove, the scapha or the valley between two knuckles, is one more longitudinal control curve: an inflection line drawn like the outlines. Each section turns inward through an inflection where that line crosses it. Fit sections to the skin, not to the tape hull. A hull bridges every concavity and leaves it to cutters and reliefs, whose edges read as steps, slots and patches; agents who took the hull for the method spent a whole campaign day on such workarounds.

The method's one limit is that each section must be star-shaped about the segment's axis. A feature that folds back over itself, such as the helix's curl or an eyelid over the globe, becomes its own segment, joined to its host. A published girth then checks the lofted section at its site: solve the outline or fullness law so that the perimeter matches, rather than authoring loops station by station. Hand-built loops multiply the numbers and drift from the outlines that define the form.

Solve these in dependency order. The frames come first. Then the axis or back line follows from the frames, and each outline follows from the published depths and breadths at its own sites, before any girth closes by fullness at its site. A relief such as a breast or a buttock sits on that solved wall and never feeds a datum the wall depends on. A fixed point that couples datums across regions moves them against each other and lands on a different malformed shape every run. Apply each published measurement and each check by its own definition: the same landmarks, reference points and surface it names. A depth read from the wrong front point, or an angle read on the wrong line, moves a whole region or fails a correct shape.

## Generate From Parameters

This section is the contract of step 3 in the [three steps](SKILL.md#three-steps). Steps 1 and 2 hold one person's traced coordinates as tables.

Resolve anatomical inputs, relative datums and shared geometric definitions once. Each original curve constructs its local controls directly from those inputs and pure reusable laws. Its definition must not require another anatomical part's completed curves, a loft, a mesh or final realization. Related parts consume the same generating definition under their declared frame maps; neither fits its boundary to the other's completed output. [Connections](construction.md#connections) owns the complete boundary contract.

Keep measurement inversion explicit in the shared constraint owner. A numerical solve may evaluate its candidate mathematical definition, but it must not construct other parts or lofts to obtain that definition. Reuse unchanged scalar preparations, sections and trial inputs. Curve construction and point evaluation do not silently launch an inverse solve, calibration or whole-figure preparation.

Expose available original definitions separately from an unresolved constraint result. Inspection may read that declared candidate with its actual diagnostics and unresolved state; a consumer requiring closed constraints receives the solve result or its refusal. Neither path substitutes a prior successful figure or labels an unresolved candidate as solved.

Keep reference mesh and recovered-curve loading in inspection or recovery. Generation reads anatomical inputs and documented general laws or population priors, not a person's reference geometry. State whether a value is supplied, derived from a law or estimated by a prior; independently estimated dimensions are not automatically compatible boundaries. Derive coefficients and offsets from the declared construction rather than person selectors, copied coordinates or per-part corrections.

Measure control construction, shared constraint solving, local curve evaluation, actual loft generation, tessellation/binding and rendering separately. Split process startup, module/input loading, display sampling and PNG encoding/writing from those geometric stages. Compare cold, unchanged-input and dimension-edit work at the same boundary. Investigate repeated preparation and nested solves from their actual calls and timings; moving work outside a timer or returning cached, partial or failed output does not establish a faster constructor.

## Start With A Sketch

1. Declare the anatomical plane, local origin, axes, units, actual domain and parameter. Every line starts from its own zero: the origin at its own anatomical datum, with segment frames following the ISB joint-coordinate recommendations where they exist. It attaches to its parent by a relative transform, so a parent edit or pose carries it. Compare it with the reference after registering the reference region into the same frame by that region's own segment axes, for comparison only. A reference in another posture, such as an A-pose, otherwise reads pose as shape. Place the measured landmarks, widths, heights, extrema and shared boundary from their generating owners. Keep direct shape controls separate from locked measurements under [Construction](construction.md#parametric-identity-and-binding).
2. Draw the construction aids generously, and declare them with the spec so every render shows them. The aids are: the segment axis, the dimensioned bounding rectangle, straight chords between datums, landmark ticks, proportion divisions, tangent rays, extrema station lines, joint bisection planes, and control polygons or handles. Judge each curve first against its own aids, then against the reference. Draw the straight scaffold between those points, the intended tangent lines and the source's actual support limits. An anatomically dimensioned local rectangle is useful for Hermite too: it supplies support limits, while endpoints, tangents and curvature still determine the curve. Compare these aids with the reference individually and with neighbours before adding curvature. Check the ordering of every connection's start, course and end, including phase-dependent heights. An impossible ordering is an input or construction problem, not a reason to relax admission.
3. Use a few local segments and expose their actual controls: a polynomial control polygon or equivalent Hermite handles, conic controls, or the native field's own geometric guides. Do not invent a Bézier representation by sampling a different source. Distinguish interpolation points, off-curve control points and evaluated points. Derive handles from dimensions, anatomy or a declared geometric construction; they do not become new public anatomical parameters. Uniform polynomial control points on a chord give an exact straight baseline, not a measured shape prior.
4. Show the actual curve with its scaffold, control polygon and endpoint tangent directions through the existing line/curve display adapters. Keep authoring aids distinct from original anatomical curves and generated loft curves. Inspect the actual curve over the reference with its neighbours; do not build another editor or make full physical2, raw lofting or a whole test run prerequisites for available Point0 inspection.

## Choose The Representation

The span's contract selects the representation: its continuity at each end, its number of fullness extrema and its editing domain. Preference does not select it. The spec records the choice, because a span given a weaker form than its contract silently loses a promised continuity or fullness. Whatever the stored form, a tangent's direction comes from a declared tangent aid and its magnitude from a stated rule, and the control polygon or the equivalent handles are drawn as aids. Derivatives belong to a parameter. A spec states which one its knots and jets use, and a reparameterised solve, such as a root parameter at a pole, converts its jets by the chain rule before export. Jets read in a different parameter make the curve overshoot between knots.

| Need                                              | Choice and limit                                                                                                                                                                                                                                                                          |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A line, circle, ellipse or arc                    | Draw it as a curve of the same family: a line as a degree-one span, a circle, ellipse or arc in exact rational form (a quadratic rational Bézier with its weights). It lofts like any other section, because a separate owner per shape forks the construction and its tests. |
| A short span controlled by endpoints and tangents | A cubic Bézier has four control points. Its nonzero first and last edges expose the endpoint tangent directions. It cannot independently prescribe both endpoint second derivatives as well.                                                                                              |
| One fullness between two tangent-fixed ends       | A quartic Bézier keeps the end tangents on its first and last edges and leaves its middle control point as the single fullness handle. That point is shared by both endpoint second derivatives, so they cannot be prescribed independently.                                     |
| Positions and two derivatives fixed at both ends  | A quintic Hermite span and its six-point polynomial Bézier form are exactly interchangeable in the same parameter. Use visible handles for authoring while retaining the existing engine evaluator when it carries the contract.                                                          |
| Many segments needing local edits                 | A clamped B-spline offers local support. At an interior knot, degree minus multiplicity determines continuity; an interior control point is generally not an interpolation point. Use it when that editing/domain contract is needed, rather than raising one global polynomial's degree. |
| A monotone scalar sketch                          | PCHIP can avoid scalar overshoot, but its second derivative can jump. It is not a replacement for a promised C2 skin source without a construction that supplies that continuity.                                                                                                         |

These choices follow the primary descriptions of [Bézier construction](https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/bezier-construct.html), [endpoint derivatives](https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/bezier-der.html), [B-spline local support](https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/bspline-curve-prop.html), [CAD knot continuity](https://occt3d.com/dev/doc/refman/html/class_geom2d___b_spline_curve.html) and [PCHIP's continuity limit](https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.PchipInterpolator.html). They establish geometric properties, not an anatomical law or a measured speedup.

## Preserve The Actual Parameter

For a polynomial quintic span in its original parameter `q`, let `h = q1 - q0 > 0`. Let `A`, `B` be endpoint positions, `A1`, `B1` their first derivatives in `q`, and `A2`, `B2` their second derivatives. Its Bézier control points are:

```text
P0 = A
P1 = A + h*A1/5
P2 = A + 2*h*A1/5 + h*h*A2/20
P3 = B - 2*h*B1/5 + h*h*B2/20
P4 = B - h*B1/5
P5 = B
```

This is a basis conversion derived from the Bézier endpoint derivative equations, not a sampled fit. It applies componentwise only where the coordinates are polynomial in that same parameter. The current engine's `AutoMovieViewHermite` already uses these controls for sufficient scalar hull admission and evaluates the equivalent quintic. Reuse its actual source data rather than create a second evaluator or clamp an authored handle to pass a range check.

Convert units and apply the declared parameter/frame chain rule first. Existing knot jets can be normalized by the whole source span, while the formula uses derivatives in `q` and this segment's span. A physical-height interval is not an angle/root interval. An exact scalar conversion in that chart does not make a non-polynomial world-coordinate map an exact polynomial Bézier. Keep original poles and unavailable derivatives explicit.

## Diagnose The Controls

The Bézier convex-hull property bounds a polynomial span by its control points in the same coordinate frame. Ordered control-point components give a sufficient monotonicity condition through the derivative's control polygon. Failure of that sufficient condition does not prove a bad curve; use the actual derivative and supported extrema analysis. A finite set of values does not prove that no reversal lies between them.

Aligned nonzero incoming and outgoing handles with the same directed tangent establish G1, not equal parameter speed or C2 continuity. Verify the shared owner's actual derivatives under direction, scale and frame maps. If an endpoint derivative points against an intended monotone interval, another basis cannot satisfy both demands: resolve the datum, domain, anatomical expectation or incompatible source condition first. Do not zero a genuine derivative, move a locked measurement, fit the reference, or hide the original defect under a downstream blend.

Follow [Verification](verification.md#curves-against-the-reference) for acceptance. Move an accepted original immediately to its actual loft-curve, curve-plus-clay and skin observations with the affected neighbours.
