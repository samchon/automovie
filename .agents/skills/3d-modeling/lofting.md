# Lofting

Choose the [representation](crafting.md#representation) by the form and organize ownership by [Modularization](modularization.md).

For a fixed mesh or ordered line source, follow [Recovery](recovery.md) before fitting the section family.

## One section family

Define one section family from independent [dimensions](crafting.md#dimensions), its chosen physical course, section planes, relative frames and stations. A bone-relative family can take sections normal to its course, carried along it by a rotation-minimizing frame, the frame that twists least. A composed family declares its common physical plane and each contributing curve's actual plane/frame map; that plane need not be normal to every contributor's separate axis. Verify those maps and the measurement plane required by each published dimension, because a world-plane cut can be oblique to a member. Derive supported spans from corresponding feature parameters, constrain their joins and derive guides from that family.

A family can be defined by a few view curves: front and side outline pairs, an axis and a fullness control, the value that sets how far each section bulges between its outline points. Each section is the chain of conic or rational arcs through the outline points at its station, shaped by that fullness, as in conic lofting. Measured section dimensions then check the loft instead of being authored loop by loop.

A section of such a family need not be convex. A groove, crease or valley that runs along the form is one more longitudinal control curve, an inflection line drawn like the outlines. Each section turns inward where that line crosses it. Fit the sections to the surface itself and not to its [tape hull](#composition-before-lofting), because a hull leaves every concavity to cutters and reliefs, whose edges show as steps, slots and patches.

The method's limit is that each section is star-shaped about the family's course: every ray from the course point meets the section once. A feature that folds back over itself breaks that, so it becomes its own family, joined to its host under [Connections](#connections).

Read what a method can express from the section model's own types and from the method's literature before working around a limit. A limit taken from the method's name sends every form it would have carried to workarounds.

Choose each curve's representation by its span's continuity and fullness contract, never by convenience, because a weaker form silently drops a promised continuity.

Reconcile measured guide intersections before interpolation, using sections and obliques alongside front and side envelopes. Distinguish the generating operator's interpolation waypoints, control points and evaluated points.

## Composition before lofting

When several authored regions share a physical section, compose their defining 2D pieces in that declared plane and frame before generating the surface. Keep the source controls and coordinate maps, reconcile guide/profile correspondence and preserve actual components, concavities, holes and topology changes. A projected silhouette Boolean loses depth, and a tape hull, the outline a taut measuring tape takes around the section, bridges concavities and is a different boundary.

Build a relief's height, and every target it blends between, from C2 functions: a C2 ramp and a C2 max over the roll. A hard clamp, max, min or polyline corner in the target becomes a crease in the surface, however finely it is sampled. A relief's window must contain the whole region where its height is nonzero, because a window edge that cuts through a nonzero height leaves a crease as well.

A relief, a cutter and a band are each fitted to the wall they sit on. When a correct change moves that wall, refit them on the new wall. Reverting the wall to keep them restores the defect the change removed.

Choose sections, sweeps, local curve networks and retained volume operations by their geometric and editing contracts. An anatomical or logical name may identify a subdomain of one generating stream rather than another loft. Compare exact conversion and explicitly bounded approximation under their actual premises, keeping valid input meanings and independent expectations. Fewer streams or patches alone establish neither a faster nor a correct result.

## Connections

Smooth joins consume one boundary and compatible transverse derivatives, accounting for parameter direction and scale. Preserve declared creases and check seams, orientation and self-intersections.

Define a known connection before lofting: its original port curves or its join seed, its domains, correspondence, frames and available transverse data. The surface operator then either consumes the ports or traces the intersection from that seed, so it never has to search for the connection.

A port band, the strip of surface that joins two parts at a declared port, needs its own topology, regularity and continuity admission; it is not automatically an end continuation. Apply C2/G2 only on the domains that promise it and retain explicit missing support.

Where a connection is traced as an intersection, seed it from shared landmarks. Near a closed end, carry the trace in the root parameter, the square root of the distance from that end, because the station chart is polar there and a linear or quadratic predictor fails in it.

## Fitting and verification

Fix registration and fit supported named coefficients under matching measurement conditions. Preserve independent dimensions, reserve validation shapes, sections or views, and reject local regressions hidden by aggregate improvement.

When a field is sampled into a spline net, place each control at its Greville abscissa, the average of its knots. Evenly spaced controls shift and stretch the features by up to a span.

An edge with a roll is resolved only when every sampling across it, whether net, layers or rings, is at most a quarter of the roll. A coarser sampling renders the edge jagged.

Before converting a source's sections to conic arcs, fair each section to the scale of the form, which means removing the ripples smaller than the features the form keeps. A converter ends an arc at every inflection of its input, so a section that carries mesh noise returns dozens of arcs at any tolerance. The arcs that remain after fairing set the family's layout: its outline and inflection lines.

Judge a conversion by its loft. Loft the converted sections, render the result in clay beside the source at matching cameras, and adopt it when the form reads right there.

A family is admissible when the surface operator accepts every one of its sections. Check that in the form the operator reads: between the fitted stations as well as at them, with every value rounded as it is stored, and with a margin from the boundary of the admissible region. A fit checked only at its stations or before rounding is refused when the surface is built.

When a fit misses, find what binds it before refitting: a layout that cannot express the section, too few knots along the course, a constraint that holds the fit off the data, or a weighting that favours another region. Each has its own remedy, and a refit that changes one of them by trial repeats the miss.

Where geometry gives a value in closed form, such as an inflection's tangent from its neighbouring anchors, construct it and leave the optimizer only the remaining freedoms.

When one part of a fitted family changes, such as a relief, refit that part alone on the stored wall beneath it. Refitting the whole family, or starting from an earlier stored state, drops every later correction without a diagnostic.

Trace the same observations through sampling, fitting and refinement to the displayed surface. Isolate downstream loss instead of compensating with shape coefficients, and accept through [form inspection](inspection.md).
