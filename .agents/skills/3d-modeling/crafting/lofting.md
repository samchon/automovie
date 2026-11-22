# Lofting

Build surfaces from related sections and guides. Choose lofting by [representation](construction.md#representation), assign parts under [Modularization](../modularization.md) and recover fixed mesh or line sources before fitting.

## One section family

Define the course, section planes, frames and stations from independent [dimensions](construction.md#dimensions). Derive guides from the family and spans from corresponding feature parameters. Constrain the joins.

Declare each section's plane and frame. A bone-relative family can take sections normal to its course, carried along it by a rotation-minimizing frame, the frame that twists least.

Declare the common plane and each contributing curve's plane and frame map. Verify the maps and use each published measurement's prescribed plane.

Define a conic loft by front and side outlines, an axis and fullness. Fullness controls the bulge between outline points. Join those points with conic or rational arcs at each station. Check the loft against measured section dimensions.

Use longitudinal inflection lines to preserve grooves, creases and valleys. Fit each section to the actual surface and preserve its concavities.

Each section must be star-shaped about the course point: every ray from it meets the section once. Join any feature that folds back as a separate family under Connections. Check the section types and literature before assuming a limitation.

Fit and reflect one half of a symmetric section, with both endpoints constrained to the symmetry plane.

Choose a curve representation that preserves continuity and fullness. Reconcile measured guide intersections from sections, obliques and outlines before interpolation. Distinguish waypoints, control points and evaluated points.

## Closed ends

Close an exposed end with rings from the last section to the pole. Match the wall's slope and curvature. Keep a hidden closure inside the covering surface.

## Composition before lofting

Compose shared 2D pieces in their declared plane and frame before lofting. Keep the controls, maps and profile correspondence. Preserve components, concavities, holes and topology changes.

Choose sections, sweeps, curve networks or volume operations by the geometry and editing requirements. A named part may occupy a subdomain. Verify exact conversions and the stated bounds of approximations against independent expectations.

### Reliefs

Offset the skin by one height per point along the cast. Build the height and all blended target fields from C2 functions. Include the entire nonzero height field in the window.

Exclude grazing cast rays from observations. Use an inflection line or a separate family for a form the cast cannot observe.

A one-height relief cannot overhang. For surface steps, inspect relief edges, fades and control spacing. Move concavities the wall can express into inflection lines.

Reliefs, cutters and bands are fitted to the wall beneath them, and a relief's net density depends on that wall. When a correct change moves the wall, refit them on the new wall and measure the density again; never revert the wall to keep them.

## Connections

Define each connection before lofting. Supply its port curves or intersection seed, domains, correspondence, frames and available transverse data. The operator uses the supplied definition or traces from the seed.

A smooth join consumes one boundary and compatible transverse derivatives, accounting for parameter direction and scale. Preserve declared creases, and check seams, orientation and self-intersections.

Check each port band's topology, regularity and continuity. Apply C2 or G2 only where promised and report unavailable support.

Seed a traced intersection from shared landmarks. Near a closed end, carry the trace in the root parameter, the square root of the distance from that end, because the station chart is polar there and a linear or quadratic predictor fails in it.

## Sampling

Place spline-net controls at their Greville abscissae, the averages of their knots.

Match knot spacing to the wall's feature scale. Closer knots can reproduce surface steps. Use inflection lines or reliefs for finer features.

Sample edge rolls at intervals of at most one quarter of the roll width across nets, layers and rings.

## Fitting and verification

Fit named coefficients after registration under matched measurement conditions. Preserve independent dimensions. Hold out shapes, sections or views. Check for local regressions.

Where geometry gives a value in closed form, such as an inflection's tangent from its neighboring anchors, construct it and leave the optimizer only the remaining freedoms.

Fair measured sections at the intended feature scale before fitting conic arcs. Use the remaining arcs to locate outlines and inflection lines. Compare clay renders of the loft and source with matched cameras.

Check every section against the operator's admission criteria, at and between fitted stations. Use stored precision and keep a margin from admission limits.

When a fit misses, find what binds it before refitting: a layout that cannot express the section, too few knots along the course, a constraint that holds the fit off the data, or a weighting that favors another region.

When one part of a fitted family changes, such as a relief, refit that part alone on the stored wall beneath it, because refitting the whole family or starting from an earlier stored state drops every later correction without a diagnostic.

Trace the same observations through sampling, fitting and refinement to the displayed surface, isolate any downstream loss instead of compensating with shape coefficients, and accept the result through [form inspection](../inspection.md).
