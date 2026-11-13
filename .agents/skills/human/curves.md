# Original 2D Curves

Author the shape through anatomical points, construction lines and visible curve controls before composing its source or judging its loft. Changing a polynomial basis alone keeps the shape, so it cannot repair a wrong datum, domain or boundary condition.

## Few View Curves Per Segment

Define a segment by a few 2D view curves in its own frame: the front outline pair, the side outline pair, its axis and a fullness control. Each cross-section is the chain of conic arcs through the outline points at its station, shaped by the fullness. This is conic lofting, the long-established method for fuselages and hulls. Draw lines, circles and arcs as such where the anatomy calls for them.

[Lofting](../3d-modeling/lofting.md#one-section-family) owns how a section turns inward along an inflection line and where the method ends. On the body, the alar groove, the scapha and the valley between two knuckles are inflection lines. The helix's curl and an eyelid over the globe fold back over themselves, so each is its own segment, joined to its host.

A published girth checks the lofted section at its site: solve the outline or fullness law so the perimeter matches, rather than authoring loops station by station, because hand-built loops multiply the numbers and drift from the outlines.

Solve in dependency order:

1. the frames;
2. the axis or back line, from the frames;
3. each outline, from the published depths and breadths at its own sites;
4. each girth, closed by fullness at its site.

A relief such as a breast or a buttock sits on the solved wall and feeds no datum the wall depends on. Apply each measurement by its own definition: the landmarks, reference points and surface it names. A depth read from the wrong point moves a whole region.

## Start With A Sketch

1. **Frame.** Declare the anatomical plane, the local origin at the part's own datum, the axes (ISB joint-coordinate recommendations where they exist), units, domain and parameter. The part attaches to its parent by a relative transform, so a parent edit or pose carries it. Register the reference region into the same frame by its own segment axes, for comparison only, so pose does not read as shape.
2. **Aids.** Draw the construction aids and declare them with the spec, so every render shows them:
   - the segment axis and the dimensioned bounding rectangle;
   - chords between datums and landmark ticks;
   - proportion divisions and extrema station lines;
   - tangent rays and joint bisection planes;
   - control polygons or handles.

   Judge each curve first against its aids, then against the reference, individually and with its neighbours. Check the ordering of every connection's start, course and end. An impossible ordering is an input or construction problem, not a reason to relax admission.
3. **Controls.** Use a few local segments and expose their actual controls: a control polygon or Hermite handles, conic controls, or the native field's guides. Distinguish interpolation points, off-curve controls and evaluated points. Derive handles from dimensions, anatomy or a declared construction; they do not become public parameters.
4. **Show.** Show the curve with its scaffold, control polygon and endpoint tangents, over the reference with its neighbours.

## Choose The Representation

The span's contract selects the representation: its continuity at each end, its number of fullness extrema and its editing domain. The spec records the choice, because a weaker form silently drops a promised continuity. Derivatives belong to a parameter: a spec states which one its knots and jets use, and a reparameterized solve converts its jets by the chain rule before export, since jets read in another parameter make the curve overshoot.

| Need | Choice and limit |
| --- | --- |
| A line, circle, ellipse or arc | A curve of the same family: a line as a degree-one span, a conic in exact rational form. It lofts like any other section. |
| A short span set by endpoints and tangents | A cubic Bézier. Its first and last edges expose the tangents; it cannot also prescribe both end second derivatives. |
| One fullness between two tangent-fixed ends | A quartic Bézier, whose middle control point is the one fullness handle. |
| Positions and two derivatives fixed at both ends | A quintic Hermite span, exactly interchangeable with its six-point Bézier form in the same parameter. |
| Many segments needing local edits | A clamped B-spline, whose continuity at a knot is degree minus multiplicity. |
| A monotone scalar sketch | PCHIP, which avoids overshoot but can jump in its second derivative, so it cannot carry a promised C2 skin alone. |

Convert between bases exactly, in the same parameter, after units and frame maps are applied, and reuse the engine's evaluator for the converted form instead of writing a second one.

## Diagnose The Controls

The convex-hull property bounds a polynomial span by its control points in the same frame, and ordered control components give a sufficient monotonicity condition. Failing that sufficient condition does not prove a bad curve; read the actual derivative and its extrema.

Aligned handles establish G1, not equal speed or C2. When an endpoint derivative points against an intended monotone interval, no basis satisfies both: resolve the datum, domain or source condition first. Keep a genuine derivative, a locked measurement and the original defect visible rather than hiding them under a downstream blend.

## Generate From Parameters

This is the contract of step 3 of the [three steps](SKILL.md#three-steps).

- Resolve anatomical inputs, relative datums and shared definitions once. Each curve builds its controls directly from those inputs and pure reusable laws, never from another part's completed curves, a loft, a mesh or the final realization. [Connections](construction.md#connections) owns the shared boundary.
- Keep measurement inversion in the shared constraint owner. A numerical solve evaluates its candidate definitions without building other parts or lofts, and curve evaluation never launches a hidden solve.
- Expose an unresolved constraint as unresolved; neither a prior figure nor a partial result stands in for it.
- Generation reads anatomical inputs, published laws and population priors, never a person's reference geometry. State whether each value is supplied, derived or estimated.
- Measure control construction, constraint solving, curve evaluation, lofting, tessellation and rendering separately when timing a change, and compare cold, unchanged-input and edited runs at the same boundary.

Follow [Verification](verification.md#curves-against-the-reference) for acceptance, and move an accepted original at once to its loft curves, clay and skin with its neighbours.
