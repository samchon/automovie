# Lofting

Lofting builds a surface through one family of related sections and guides, authored from dimensions or fitted to a source. Choose it by the form under [representation](construction.md#representation), and give its parts owners under [Modularization](../modularization.md). A fixed mesh or an ordered line source goes through mesh recovery before its section family is fitted.

## One section family

Define the family from independent [dimensions](construction.md#dimensions): its physical course, section planes, relative frames and stations. Derive its guides from the family, derive supported spans from corresponding feature parameters, and constrain the joins between spans.

Declare each section's plane and frame. A bone-relative family can take sections normal to its course, carried along it by a rotation-minimizing frame, the frame that twists least.

A composed family declares its common physical plane and each contributing curve's own plane and frame map, and that plane need not be normal to each contributor's axis. Verify those maps, and measure each published dimension in the plane its definition requires, because a world-plane cut can be oblique to a member.

A few view curves can define the whole family, as in conic lofting: front and side outline pairs, an axis, and a fullness control, the value that sets how far each section bulges between its outline points. Each section is then the chain of conic or rational arcs through the outline points at its station, and measured section dimensions check the loft instead of being authored loop by loop.

A section need not be convex. A groove, crease or valley along the form is one more longitudinal control curve, an inflection line drawn like the outlines, and each section turns inward where that line crosses it. Fit the sections to the surface itself, not to its [tape hull](#composition-before-lofting), because a hull leaves every concavity to cutters and reliefs, whose edges show as steps, slots and patches.

The method's one limit is that each section is star-shaped about the course: every ray from the course point meets it once. A feature that folds back over itself becomes its own family, joined to its host under [Connections](#connections). Learn what the method can express from its section model's types and its literature before working around a limit inferred from its name.

Fit a section that is symmetric about a plane as one half, with both extremes held on that plane, and reflect it. A free extreme wanders along a flat stretch of the outline from station to station, and its track shows as a crease.

Choose each curve's representation by its span's continuity and fullness contract, because a weaker representation silently drops a promised continuity. Reconcile measured guide intersections before interpolating, using sections and obliques beside the front and side envelopes, and keep the operator's interpolation waypoints, control points and evaluated points distinct.

## Closed ends

Mesh a closed end in rings of its own between its last section and its pole, or it is drawn as a cone with a flat disc at the pole. Its closing law meets both the wall's slope and the wall's bend where they join, since meeting only the slope leaves a ring there. An end that is not visible surface, such as one buried in another part, takes the slimmest closure the law allows, so it stays inside what covers it.

## Composition before lofting

When several authored regions share a physical section, compose their 2D pieces in that declared plane and frame before generating the surface. Keep the source controls and coordinate maps, reconcile guide and profile correspondence, and preserve the components, concavities, holes and topology changes. The composed section is neither a projected silhouette Boolean, which loses depth, nor a tape hull, the outline a taut measuring tape takes around the section, which bridges concavities.

Choose among sections, sweeps, local curve networks and retained volume operations by their geometric and editing contracts. An anatomical or logical name may identify a subdomain of one generating stream rather than a loft of its own. Compare exact conversion with explicitly bounded approximation under their premises, keeping the inputs' valid meanings and independent expectations; fewer streams or patches alone prove neither speed nor correctness.

### Reliefs

A relief offsets the wall's skin by one height per point along its cast. Build that height, and every target it blends between, from C2 functions, such as a C2 ramp and a C2 max over the roll, because a hard clamp, max, min or polyline corner becomes a crease however finely it is sampled. The relief's window contains the whole region where its height is nonzero, since a window edge through a nonzero height leaves a crease too.

A relief's cast must see the skin it carries. Leave unobserved any observation whose cast grazes the skin: a ray running along the skin measures where an edge-on face begins, not how deep the skin lies, so the net builds a cliff there and draws a notch or spikes. A form no cast sees belongs to the wall as an inflection line, or to a family of its own.

A relief shows at its edge, in its fade and at its net's spacing, and its one height per point cannot overhang. When a surface reads in steps or level lines, look first at what its reliefs carry, and move any concave form the wall can hold into the wall as an inflection line; fewer curves alone leave those marks.

Reliefs, cutters and bands are fitted to the wall beneath them, and a relief's net density depends on that wall. When a correct change moves the wall, refit them on the new wall and measure the density again; never revert the wall to keep them.

## Connections

Define a known connection before lofting: its original port curves or its join seed, its domains, correspondence, frames and available transverse data. The surface operator then consumes the ports or traces the intersection from that seed, and never searches for the connection.

A smooth join consumes one boundary and compatible transverse derivatives, accounting for parameter direction and scale. Preserve declared creases, and check seams, orientation and self-intersections.

A port band, the strip of surface that joins two parts at a declared port, needs its own admission of topology, regularity and continuity, and is not automatically a continuation of an end. Apply C2 or G2 continuity only on the domains that promise it, and keep missing support explicit.

Seed a traced intersection from shared landmarks. Near a closed end, carry the trace in the root parameter, the square root of the distance from that end, because the station chart is polar there and a linear or quadratic predictor fails in it.

## Sampling

When a field is sampled into a spline net, place each control at its Greville abscissa, the average of its knots, because evenly spaced controls shift and stretch the features by up to a span.

Space a wall's knots along its course at the scale of the form the wall carries. Closer knots make the wall follow its target's small steps, which show as level lines across the surface; form finer than the knots belongs to an inflection line or a relief.

An edge with a roll is resolved only when every sampling across it, whether net, layers or rings, is at most a quarter of the roll, because a coarser sampling renders the edge jagged.

## Fitting and verification

Fix the registration, then fit supported named coefficients under matching measurement conditions. Preserve independent dimensions, hold back validation shapes, sections or views, and reject a local regression that an aggregate improvement hides.

Where geometry gives a value in closed form, such as an inflection's tangent from its neighboring anchors, construct it and leave the optimizer only the remaining freedoms.

Before converting a source's sections to conic arcs, fair each one to the scale of the form, removing the ripples smaller than the features the form keeps, because a converter ends an arc at every inflection of its input and a noisy section returns dozens of arcs at any tolerance. The arcs that remain set the family's layout: its outlines and inflection lines. Judge the conversion by its loft, rendered in clay beside the source at matching cameras.

A family is admissible when the surface operator accepts every one of its sections. Check that as the operator reads it: between the fitted stations as well as at them, with every value rounded as stored, and with a margin from the boundary of the admissible region.

When a fit misses, find what binds it before refitting: a layout that cannot express the section, too few knots along the course, a constraint that holds the fit off the data, or a weighting that favors another region.

When one part of a fitted family changes, such as a relief, refit that part alone on the stored wall beneath it, because refitting the whole family or starting from an earlier stored state drops every later correction without a diagnostic.

Trace the same observations through sampling, fitting and refinement to the displayed surface, isolate any downstream loss instead of compensating with shape coefficients, and accept the result through [form inspection](../inspection.md).
