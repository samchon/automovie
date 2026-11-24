# src/geometry/AutoMovieMotionBound.ts#AutoMovieMotionBound.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

States the borrowed knot times in seconds, the travel bound in the speeds' length unit with its clamping, and the advance's results, a gap that certifies nothing and Infinity.

## @evidence contracts/development/design.md#principled-representation

A speed bound integrated over strictly increasing knot times; its two readers are the travel between two times and Mirtich 1996's earliest closing time, so no consumer re-integrates it. Increasing knots and finite non-negative speeds are the callers' stated contract; nothing is checked at runtime.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the engine geometry module; serves the take audits' grid scans (travel, through nextGrid) and the planner's sweeps and any shape pair (advance, through timeOfImpact).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No optional members and no casts; the two readers are the two uses of a conservative-advancement bound.

# src/geometry/AutoMovieMotionBound.ts#AutoMovieMotionBound.bezierSpeed

## @evidence contracts/development/common.md#meaningful-documentation

States the control-point input, the positive duration in seconds and the bound in coordinate units per second.

## @evidence contracts/development/implementation.md#principled-implementation

Farin 2002, Curves and Surfaces for CAGD, 5th ed., section 5.3: a degree-n Bezier curve's derivative is a Bezier curve with control points n (P[i+1] - P[i]) / h; section 4.2: a Bezier curve lies in its control points' convex hull, so the greatest control-point norm bounds the speed over the whole segment.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the control polygon; the Hermite forms only convert their ends to control points and call it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampling and no tolerance: the bound is the convex-hull bound itself.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(n d) for n control points of dimension d.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number and retains nothing.

# src/geometry/AutoMovieMotionBound.ts#AutoMovieMotionBound.cubicHermiteSpeed

## @evidence contracts/development/common.md#meaningful-documentation

States the ends' values and velocities with their units, the duration and the bound.

## @evidence contracts/development/implementation.md#principled-implementation

Farin 2002, section 7.5: a cubic Hermite segment's Bezier points are p0, p0 + h v0 / 3, p1 - h v1 / 3, p1; their derivative polygon bounds the speed by bezierSpeed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Converts to Bezier points and delegates the bound to bezierSpeed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampling of the cubic; the bound is exact in form.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(d) for dimension d, four short-lived control vectors.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number and retains nothing.

# src/geometry/AutoMovieMotionBound.ts#AutoMovieMotionBound.quinticHermiteSpeed

## @evidence contracts/development/common.md#meaningful-documentation

States the ends' values, velocities and accelerations with their units, the duration and the bound.

## @evidence contracts/development/implementation.md#principled-implementation

Farin 2002, section 5.3: a quintic Bezier curve's first and second end derivatives are 5 (P1 - P0) / h and 20 (P2 - 2 P1 + P0) / h^2, which matched to the Hermite ends give P1 = p0 + h v0 / 5 and P2 = p0 + 2 h v0 / 5 + h^2 a0 / 20, and symmetrically at the end; bezierSpeed bounds the speed.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Converts to Bezier points and delegates the bound to bezierSpeed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sampling of the quintic; the bound is exact in form.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(d) for dimension d, six short-lived control vectors.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number and retains nothing.

# src/geometry/AutoMovieMotionBound.ts#AutoMovieMotionBound.chainSpeed

## @evidence contracts/development/common.md#meaningful-documentation

States the root speed, the joint rates in radians per second, the levers in length units and the bound.

## @evidence contracts/development/implementation.md#principled-implementation

The articulated motion bound of Zhang, Redon, Lee and Kim 2007 (SIGGRAPH, continuous collision detection for articulated models): a point of a link moves no faster than the root plus each joint's angular speed times the point's distance from that joint.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One sum; the rate bounds come from the curve bounds above and the levers from the caller's chain.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant or tolerance; one lever per rate is the callers' stated contract.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(j) for j joints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number and retains nothing.

# src/geometry/AutoMovieMotionBound.ts#AutoMovieMotionBound.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the borrowed knots, the per-interval speeds and that two shapes' bounds are summed, as the Flexible Collision Library adds both motions' bounds.

## @evidence contracts/development/implementation.md#principled-implementation

The conservative-advancement rule of Mirtich 1996, chapter 3, applied interval by interval: the gap closes no faster than the speed bound, so the travel between two times is at most the bound's integral, and the earliest closing time is where that integral reaches the gap; the Flexible Collision Library (fcl, BSD-3-Clause, commit ae86ecde788086110f8a4cea54ae1949df8a21d3, conservative_advancement_func_matrix-inl.h) sums the two motions' bounds the same way. Prefix sums are rounded binary64, a relative error of order the unit roundoff times the knot count, stated as the bound's precision limit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Prepare integrates once; the two readers bisect the knots or the prefix and evaluate one linear piece, so no reader re-integrates.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance, no cache and no memo: each read is a closed-form evaluation of the prepared prefix.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepare is O(n) for n intervals; each travel or advance is O(log n) by bisection.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing is shared across calls; the prefix belongs to the returned bound.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned bound owns one Float64Array of n + 1 entries and borrows the knot array; both live as long as the caller keeps the bound.

# src/geometry/AutoMovieMotionBound.ts#AutoMovieMotionBound.nextGrid

## @evidence contracts/development/common.md#meaningful-documentation

States the grid's instants, the gap's unit and the returned index range.

## @evidence contracts/development/implementation.md#principled-implementation

Mirtich 1996's conservative advancement on a sampled timeline: every grid instant before the earliest closing time is certified and left unread, the role advanceAutoMovieGrid plays with a measured travel, here in closed form.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The closing time comes from the prepared bound; this only finds the first grid instant at or after it.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No tolerance: an instant is skipped only when it is strictly before the earliest closing time.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(log n + log g) for n knots and g grid instants.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns an index and retains nothing.

# src/geometry/AutoMovieMotionBound.ts#AutoMovieMotionBound.timeOfImpact

## @evidence contracts/development/common.md#meaningful-documentation

States the separation callback's unit and sign, the span, the resolution's origin and the Infinity result.

## @evidence contracts/development/implementation.md#principled-implementation

Ported from the Flexible Collision Library's shape-shape conservativeAdvancement (flexible-collision-library/fcl, BSD-3-Clause, Copyright (c) 2011-2014 Willow Garage, Inc. and (c) 2014-2016 Open Source Robotics Foundation, include/fcl/narrowphase/detail/conservative_advancement_func_matrix-inl.h, commit ae86ecde788086110f8a4cea54ae1949df8a21d3): a contact at the read time returns it, an advance no longer than the resolution (fcl's t_err) stops at the current time, an advance past the end reports no contact, otherwise the motion integrates to the advanced time and reads again.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The distance query stays the caller's (GJK or the shape pair distance) and the bound the prepared one, so this owns only the loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The resolution is the caller's stated requirement, as fcl's t_err is its request's; no tolerance of this function's own.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each iteration is one separation read plus an O(log n) advance; the advance is at least the resolution, so the reads are at most the span over the resolution, and usually the few that conservative advancement needs.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure loop over the caller's callback.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds two numbers during the loop and retains nothing.
