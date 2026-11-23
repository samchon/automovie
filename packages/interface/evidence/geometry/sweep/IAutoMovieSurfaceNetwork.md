# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork

## @evidence contracts/development/design.md#principled-representation

A multi-block patch layout over a curve network, filled by evaluating the defining sweep, by Coons' bilinearly blended interpolation of four boundary curves, or by Hermite blending between two loops, with shared edges as the only coupling between patches.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The network names its sweeps, nodes and curves once and patches refer to them by name, so a shared edge is one declaration that every neighbour samples identically.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Counts are declared per tier and checked; mismatched sides, open loops and edges that do not meet are refused by the sampler instead of being stitched.

## @evidence contracts/development/common.md#meaningful-documentation

States the patch coordinates and winding, each fill rule and its use, how openings and shared edges work, and the unit.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.ICounts

## @evidence contracts/development/design.md#principled-representation

One segment count per tier, the declaration that fixes each tier's topology.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A record keyed by tier names, so a missing tier is a type error.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Counts are checked as positive integers by the sampler, not rounded.

## @evidence contracts/development/common.md#meaningful-documentation

States what is counted.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.INode

## @evidence contracts/development/design.md#principled-representation

A curve end is either a free point or a point of a sweep's domain, the two ways a curve network meets its surfaces.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed union of the two kinds.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No third kind is guessed from shape.

## @evidence contracts/development/common.md#meaningful-documentation

States both kinds.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.IFreeNode

## @evidence contracts/development/design.md#principled-representation

A free point in space for curves that do not start on a sweep.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A discriminator and a position.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The position is used as given.

## @evidence contracts/development/common.md#meaningful-documentation

States the unit.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.ISweepNode

## @evidence contracts/development/design.md#principled-representation

A point named by sweep and domain coordinates, so curves meet the sweep exactly and leave it in its tangent plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Sweep name and `(u, v)`; the position is evaluated, never stored.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `v` is read modulo one turn rather than refused.

## @evidence contracts/development/common.md#meaningful-documentation

States the ranges and the modulo reading.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.ICurve

## @evidence contracts/development/design.md#principled-representation

A centripetal Catmull-Rom curve through its nodes and points, with the tangent-plane end condition at sweep nodes and the bridge directions it carries.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Nodes by name, optional through points, counts, and the two optional bridge fields.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A curve whose ends coincide or whose spline meets a sweep along its normal is refused.

## @evidence contracts/development/common.md#meaningful-documentation

States the spline, the end rule, the counts and when each bridge field is needed.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.IEdge

## @evidence contracts/development/design.md#principled-representation

A patch side is a line of a sweep's domain or a network curve, the two boundary kinds a Coons or bridge patch takes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed union of the two.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Edges are welded by identity of their points, not by distance.

## @evidence contracts/development/common.md#meaningful-documentation

States both kinds.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.ISweepEdge

## @evidence contracts/development/design.md#principled-representation

A straight segment of a sweep's `(u, v)` domain sampled evenly, which lies on the sweep.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Sweep, two domain points and counts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `v` may cross the seam explicitly rather than being wrapped silently.

## @evidence contracts/development/common.md#meaningful-documentation

States the even sampling and the seam rule.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.IDomainPoint

## @evidence contracts/development/design.md#principled-representation

A point of a sweep's parameter domain.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two numbers.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Values are used as given.

## @evidence contracts/development/common.md#meaningful-documentation

States both parameters.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.ICurveEdge

## @evidence contracts/development/design.md#principled-representation

A network curve used forward or reversed as a side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Curve name and direction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A reversed edge reuses the curve's points, so both neighbours weld.

## @evidence contracts/development/common.md#meaningful-documentation

States the direction rule.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.IPatch

## @evidence contracts/development/design.md#principled-representation

The four fill rules: sweep rectangle, Coons patch, Hermite bridge and quad column-transition band.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A closed union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Unknown kinds are not accepted.

## @evidence contracts/development/common.md#meaningful-documentation

States the members.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.ISweepPatch

## @evidence contracts/development/design.md#principled-representation

A rectangle of a sweep's domain sampled on its tier grid.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Domain ranges and per-tier counts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Ranges must increase within the domain; they are refused otherwise.

## @evidence contracts/development/common.md#meaningful-documentation

States which patch coordinate runs along which parameter.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.ITransitionPatch

## @evidence contracts/development/design.md#principled-representation

The 2-to-1 quad reduction strip of subdivision modelling laid on a sweep's domain, sampled on the sweep and interpolated by the limit fit like any sweep patch.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A sweep patch with two column counts instead of one; the reduction itself is fixed, so no layout is authored.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Counts the pattern cannot join are refused instead of being stitched by triangles or a crease.

## @evidence contracts/development/common.md#meaningful-documentation

States the band, the pattern, the poles and where to put them, the counts rule and the coordinates.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.ICoonsPatch

## @evidence contracts/development/design.md#principled-representation

Coons' bilinearly blended patch of four boundary edges.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four sides in counterclockwise order.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Sides that do not close or whose opposite counts differ are refused.

## @evidence contracts/development/common.md#meaningful-documentation

States the side order and its winding.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.IBridgePatch

## @evidence contracts/development/design.md#principled-representation

Cubic Hermite rows between two loops of equal count, the explicit blend of a branch or junction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two loops, rows and a tension.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Loops of different counts are refused instead of resampled.

## @evidence contracts/development/common.md#meaningful-documentation

States the column formula and the tension.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.ILoop

## @evidence contracts/development/design.md#principled-representation

A closed sequence of edges with the rule for the direction a bridge travels there.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Edges plus one tangent rule.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A loop that does not close is refused.

## @evidence contracts/development/common.md#meaningful-documentation

States every tangent rule and what `across` guarantees.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.IRing

## @evidence contracts/development/design.md#principled-representation

A named closed loop of patch vertices, optionally pinned to positions a neighbouring part shares.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Edges and optional positions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Pinned positions are kept as given and not fitted.

## @evidence contracts/development/common.md#meaningful-documentation

States what a ring reports and what pinning means.

# src/geometry/sweep/IAutoMovieSurfaceNetwork.ts#IAutoMovieSurfaceNetwork.IUvRect

## @evidence contracts/development/design.md#principled-representation

A linear map of patch coordinates onto a texture rectangle.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two ranges.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No packing is attempted; the author places rectangles.

## @evidence contracts/development/common.md#meaningful-documentation

States the mapping.
