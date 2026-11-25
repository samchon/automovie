# Original 2D curves

Author anatomical points, construction lines and curve controls before lofting. Fix wrong datums, domains and boundaries in the originating shape.

## Centres before curves

1. Place joint centres by published measurement definitions in parent segment frames.
2. Derive each section's course centre and its offset from the joint frame.
3. Draw a continuous course through its centres.
   - Locate each station, knot and site by its fraction between successive centres.
4. Draw outlines, fullness and inflection lines as continuous functions along the course.
   - Carry changes into the functions and their derivatives between knots.
5. Extend the course and control fields across the joint into their neighbour.
   - Derive the joint from both parts' centres and frames.
   - Select its [connection](construction.md#connections) from its topology.

## Few view curves per segment

Use front and side outline pairs, an axis and a fullness control. Form each section with conic arcs through the outline points. Use exact lines, circles and arcs where the anatomy calls for them.

Use [lofting](../3d-modeling/crafting/lofting.md#one-section-family) for inflections such as the alar groove, scapha and valleys between knuckles. Use a separate joined segment for a fold that turns back over itself, such as the helix or eyelid.

Solve in dependency order.

1. Place the frames.
2. Derive the axis or back line from the frames.
3. Place outlines from measured depths and breadths at their defined sites.
4. Fit fullness for the published girth at its own site.

Fit a relief to the solved wall. Read each depth and girth at the landmarks and surface its definition specifies.

## Start with a sketch

1. Declare the anatomical plane, origin, axes, units, domain and parameter.
   - Use ISB joint coordinates where available. Attach each frame to its parent.
   - Register the reference by its segment axes for comparison.
2. Draw and publish construction aids with the spec.
   - Segment axis and dimensioned rectangle
   - Datum chords and landmark ticks
   - Proportion divisions and extrema stations
   - Tangent rays and joint bisection planes
   - Control polygons or handles
3. Check each curve against the aids, then against the reference and its neighbours.
   - Check the order of every connection's start, course and end.
4. Expose the actual controls and their endpoint tangents.
   - Label interpolation points, off-curve controls and evaluated points distinctly.
   - Derive handles from anatomy, measures or the declared construction.

## Choose the representation

Choose by endpoint continuity, fullness extrema and editing domain. Record the parameter for knots and jets. Convert jets by the chain rule after reparameterizing.

| Need | Choice and limit |
| --- | --- |
| Line or conic | Exact degree-one span or rational conic |
| Endpoints and tangents | Cubic Bézier, with each end edge setting its tangent |
| Fullness between tangent-fixed ends | Quartic Bézier, with one central control |
| Position and two derivatives at both ends | Quintic Hermite or its exact six-point Bézier |
| Local edits across many segments | Clamped B-spline, continuous to degree minus knot multiplicity |
| Monotone scalar sketch | PCHIP. Check second derivative jumps before using it on a C2 skin. |

Apply unit and frame maps first. Convert bases exactly in the same parameter and use the engine's evaluator.

## Diagnose the controls

Use the polynomial span's control hull as a bound. Ordered controls suffice for monotonicity. For other spans, evaluate the derivative and its extrema.

Aligned handles give G1. Check speed and second derivatives separately for C2. If an endpoint derivative opposes a required monotone interval, resolve its datum, domain or source condition before fitting.

## Generate from parameters

Step 3 of the [method](SKILL.md#three-steps) generates from anatomical inputs, laws and population priors. Mark each value as supplied, derived or estimated.

Resolve datums and shared definitions once. Draw each curve directly from them using pure laws. Read shared boundaries from their [owner](construction.md#connections).

Solve measurement inversion at its shared owner on the candidate definition. Report an unresolvable measurement as such. Keep curve reads free of solves and builds of other parts.

Measure control construction, constraint solving, curve evaluation, lofting, tessellation and rendering separately. Compare cold, unchanged-input and edited runs at the same boundary.

Once an original passes [verification](verification.md#curves-against-the-reference), inspect its loft curves, clay and skin with its neighbours.
