# Lofting

Choose the [representation](crafting.md#representation) by the form and organize ownership by [Modularization](modularization.md).

For a fixed mesh or ordered line source, follow [Recovery](recovery.md) before fitting the section family.

## One Section Family

Define one section family from independent [dimensions](crafting.md#dimensions), its chosen physical course, section planes, relative frames and stations.

A bone-relative family can take sections normal to its course with minimal-rotation transport. A composed family declares its common physical plane and each contributing curve's actual plane/frame map; that plane need not be normal to every contributor's separate axis. Verify those maps and the measurement plane required by each published dimension, because a world-plane cut can be oblique to a member.

Derive supported spans from corresponding feature parameters, constrain their joins and derive guides from that family.

A family can be defined by a few view curves: front and side outline pairs, an axis and a fullness control. Each section is the conic or rational curve through the outline points at its station, shaped by that fullness, as in conic lofting. Measured section dimensions then check the loft instead of being authored loop by loop.

Choose each curve's representation by its span's continuity and fullness contract, never by convenience, because a weaker form silently drops a promised continuity.

Reconcile measured guide intersections before interpolation, using sections and obliques alongside front and side envelopes. Distinguish the generating operator's interpolation waypoints, control points and evaluated points.

## Composition Before Lofting

When several authored regions share a physical section, compose their defining 2D pieces in that declared plane and frame before generating the surface. Keep the source controls and coordinate maps, reconcile guide/profile correspondence and preserve actual components, concavities, holes and topology changes. A projected silhouette Boolean loses depth, and a tape hull that bridges concavities is a different boundary.

Build a relief's height, and every target it blends between, from C2 functions: a C2 ramp and a C2 max over the roll. A hard clamp, max, min or polyline corner in the target becomes a crease in the surface, however finely it is sampled.

A relief's window must contain the whole region where its height is nonzero: a window edge that cuts through a nonzero height leaves a crease as well.

Choose sections, sweeps, local curve networks and retained volume operations by their geometric and editing contracts. An anatomical or logical name may identify a subdomain of one generating stream rather than another loft. Compare exact conversion and explicitly bounded approximation under their actual premises;

keep valid input meanings and independent expectations. Fewer streams or patches alone establish neither a faster nor a correct result.

## Connections

Smooth joins consume one boundary and compatible transverse derivatives, accounting for parameter direction and scale. Preserve declared creases and check seams, orientation and self-intersections.

Define a known connection before lofting: its original port curves or its join seed, its domains, correspondence, frames and available transverse data. The surface operator then either consumes the ports or traces the intersection from that seed, so it never has to search for the connection.

A port band needs its own topology, regularity and continuity admission; it is not automatically an end continuation. Apply C2/G2 only on the domains that promise it and retain explicit missing support.

Where a connection is traced as an intersection, seed it from shared landmarks. Near a closed end, carry the trace in the root parameter, because the station chart is polar there and a linear or quadratic predictor fails in it.

## Fitting And Verification

Fix registration and fit supported named coefficients under matching measurement conditions. Preserve independent dimensions, reserve validation shapes, sections or views, and reject local regressions hidden by aggregate improvement.

When a field is sampled into a spline net, place each control at its Greville abscissa, the average of its knots. Evenly spaced controls shift and stretch the features by up to a span.

An edge with a roll is resolved only when every sampling across it, whether net, layers or rings, is at most a quarter of the roll. A coarser sampling renders the edge jagged.

Trace the same observations through sampling, fitting and refinement to the displayed surface. Isolate downstream loss instead of compensating with shape coefficients, and accept through [Visual Debugging](visual-debugging.md).
