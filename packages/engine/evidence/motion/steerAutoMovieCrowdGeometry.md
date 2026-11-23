# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.IHit

## @evidence contracts/development/common.md#meaningful-documentation

States what it holds and each member's unit.

## @evidence contracts/development/design.md#principled-representation

The time to collision in seconds, a unit normal on the floor plan and the relative velocity in metres per second, the three factors of the power law's gradient.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the pass's push alone.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The normal is stored as its two floor components, since the pass is planar.

# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.IPath

## @evidence contracts/development/common.md#meaningful-documentation

States what it holds and each member's unit.

## @evidence contracts/development/design.md#principled-representation

Corners in world metres with the cumulative arc distance at each, so a point is found by distance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by path following alone.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.compare

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes, its inputs' frames and units, and its result.

## @evidence contracts/development/implementation.md#principled-implementation

A lexicographic order on the agent's start, start second, speed, radius, herding and destination.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One chain of differences.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No index enters the order; equal agents are interchangeable.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per comparison.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.finalGoal

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes, its inputs' frames and units, and its result.

## @evidence contracts/development/implementation.md#principled-implementation

The last of its goals.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.goals

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes, its inputs' frames and units, and its result.

## @evidence contracts/development/implementation.md#principled-implementation

A point is told from a list by its own x coordinate.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns the agent's own list or a new one-element list.

# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.pathOf

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes, its inputs' frames and units, and its result.

## @evidence contracts/development/implementation.md#principled-implementation

Cumulative Euclidean distance on the floor plan.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the corners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the goals.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new path the caller keeps.

# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.follow

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes, its inputs' frames and units, and its result.

## @evidence contracts/development/implementation.md#principled-implementation

Closest-point projection onto each stretch, the earliest on a tie, then a carrot point along the arc; the arrival slowing is linear in the remaining distance.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Project, find the carrot, scale the speed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The lookahead and arrival are the caller's named constants.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the path's corners.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.change

## @evidence contracts/development/common.md#meaningful-documentation

States the constraint, its source, the overlap case, the coordinates, the written values and when the other side's reading is this one negated.

## @evidence contracts/development/implementation.md#principled-implementation

The paper's construction: the truncated cone's cut-off disc or its nearer leg by the sign of the determinant, or the one-step disc for an overlap.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three cases, each one projection, written as four numbers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Coincident centres, which name no direction, take the relative velocity's own direction, or +x when that is zero, so the half-plane is always defined; that fallback is reported as not negating.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work and no record allocated.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; the caller shares a pair's reading between its two sides.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; writes the caller's four numbers.

# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.capacity

## @evidence contracts/development/common.md#meaningful-documentation

States the bound solved and its two ends.

## @evidence contracts/development/implementation.md#principled-implementation

The closed-form root of `|v + a u|^2 = top^2`, clipped to the unit interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One discriminant and one root.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A change too small to measure is taken whole; a velocity already past its cap can take none.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.discs

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes, its inputs' frames and units, and its result.

## @evidence contracts/development/implementation.md#principled-implementation

The smaller root of the quadratic when the discs approach, and time 0 when they already overlap, the collision Karamouzas, Skinner and Guy's time to collision reads as zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One discriminant and one root.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A parting returns null and an overlap time 0, never a guessed time; coincident centres, which name no direction, return null.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.polygon

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes, its inputs' frames and units, and its result.

## @evidence contracts/development/implementation.md#principled-implementation

The Minkowski sum of a convex polygon and a disc is its edges pushed out by the radius and a disc at each corner; each is met by a ray in closed form.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the edges, each tested as a pushed-out segment and a corner disc.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Outward normals are turned away from the centroid, so either winding works.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the corners.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.signedDistance

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes, its inputs' frames and units, and its result.

## @evidence contracts/development/implementation.md#principled-implementation

Inside, the greatest signed distance to the edges' lines; outside, the least distance to the edges as segments.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the edges.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the corners.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.footprintAt

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes, its inputs' frames and units, and its result.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid placement on the floor plan by the motion's position and heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One branch and one map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the corners.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a new list the caller keeps.

# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.velocityOf

## @evidence contracts/development/common.md#meaningful-documentation

States what it computes, its inputs' frames and units, and its result.

## @evidence contracts/development/implementation.md#principled-implementation

A central difference, second-order accurate in its step, of the motion's position.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two reads of the motion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The step is named here; a motion that is not differentiable there gives its difference quotient.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its inputs; nothing to share.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/motion/steerAutoMovieCrowdGeometry.ts#steerAutoMovieCrowdGeometry.obstacle

## @evidence contracts/development/common.md#meaningful-documentation

States the set constructed, its sources, which boundary point the line touches and why, the corner approximation and the overlap case.

## @evidence contracts/development/implementation.md#principled-implementation

Builds the velocity obstacle as the published union of scaled footprints, in its closed convex form. Takes the reachable exit Fiorini and Shiller define, so the line asks only what the agent's speed allows.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Winds and grows the footprint, handles an overlap, then lists the boundary's edges and legs, finds the point the line touches and returns the line.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An infeasible request keeps its nearest exit rather than dropping the obstacle, so the half-plane program still sees the violation. A degenerate footprint returns null, and the pass's anticipatory push still applies.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the footprint's corners, with a fixed amount of work per boundary piece.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call reads one agent against one obstacle at one stage. The pass shares the obstacle's placement and velocity across agents.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates arrays sized by the corners that die with the call and keeps nothing.
