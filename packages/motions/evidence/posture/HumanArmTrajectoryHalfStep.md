# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.IAround

## @evidence contracts/development/common.md#meaningful-documentation

States each member and when it is absent.

## @evidence contracts/development/design.md#principled-representation

The arm's placements, borrowed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `neighbours` reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.INeighbour

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its frame and its unit.

## @evidence contracts/development/design.md#principled-representation

The neighbour's index, the carried place, the turn and the length of the swept segment.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `swept` and the convex rows read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.ISwept

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its frame and its unit.

## @evidence contracts/development/design.md#principled-representation

A signed distance and two gradient directions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the pair reading and its convex rows read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.IGradient

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its frame.

## @evidence contracts/development/design.md#principled-representation

A waypoint index and a world direction.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the convex rows read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.ITravel

## @evidence contracts/development/common.md#meaningful-documentation

States what each member bounds and why it bounds a pair's swept segment.

## @evidence contracts/development/design.md#principled-representation

Two arrays of metres, by probe index and by shape index.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the pair reading's cheap bound reads before any neighbour.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.travel

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid body's point moves no farther than its centre's step plus its distance from the centre times the chord of the body's turn, 2 sin(angle / 2) (the triangle inequality on a rigid motion); a probe's step is read directly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the probes, one over the shapes, per neighbour.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A shape that is not the same segment at the neighbour is read as still, as `neighbours` reads it, so the bound covers every swept segment `neighbours` gives.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in probes plus shapes per waypoint, once per pair reading, so no pair reads its neighbours unless this bound fails.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns two fresh arrays.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.neighbours

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Each neighbour's place carried by the same collider's placement at `k` times the inverse of its placement there (`HumanArmShapes.relative`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two neighbours, each carried once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A shape that is not the same segment at both waypoints is read as still.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two rigid transforms per pair.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.swept

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The engine's segment distance and nearest point, and the envelope theorem's gradient at the nearest point carried to the ends by its share of the segment (`HumanArmSweepGradient`, as the axis spheres' sweeps take it).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A bound, then one exact reading per segment left.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A segment is left unread only where the unit-slope bound proves it clear.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two segment queries per pair, none for a pair its room already clears.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and retains nothing.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.relative

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the still case.

## @evidence contracts/development/implementation.md#principled-implementation

The matching collider's placement at `from` times the inverse of its placement at `from + 1` (`HumanArmShapes.relative`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One identity check and one transform.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A collider that is not the same segment at both is read as still, never matched by place.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and retains nothing.
