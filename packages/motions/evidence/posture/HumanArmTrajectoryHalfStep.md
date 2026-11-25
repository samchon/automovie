# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.IStep

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

A frame's waypoint index and the arm placed there, borrowed.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a course is read through.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.INear

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its order and what it covers.

## @evidence contracts/development/design.md#principled-representation

The next read waypoint and the arm there and at every frame on the way.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `travel`, the casts and the sweeps read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The frames are the evaluation's own placements, borrowed, never placed again.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.ITravel

## @evidence contracts/development/common.md#meaningful-documentation

States what each member bounds and why it bounds a pair's carried course.

## @evidence contracts/development/design.md#principled-representation

Two arrays of metres, by probe index and by shape index.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the sweeps' screens read before any cast.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.point

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the two cases.

## @evidence contracts/development/implementation.md#principled-implementation

A collider probe rides its segment rigidly: its segment's origin plus the segment's rotation of its offset in the frame, as the arm's placement places it.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The placed probe where there is one, one rigid transform otherwise.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The offset is the frame's own, the one the placement reads.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work, no collider placement of the whole arm at a frame between read waypoints.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector or the placed one.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.travel

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

A rigid body's point moves no farther than its centre's step plus its distance from the centre times the chord of the body's turn, 2 sin(angle / 2) (the triangle inequality on a rigid motion); a probe's place at every frame on the way is read directly.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the probes and one over the shapes, per frame on the way.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A shape that is not the same segment at a frame is read as still, as `carry` carries it, so the bound covers every course a sweep reads.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in probes plus shapes per frame of the interval, once per interval reading, so no pair reads a course unless this bound fails.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns two fresh arrays.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.sphere

## @evidence contracts/development/common.md#meaningful-documentation

States the bound and why it holds.

## @evidence contracts/development/implementation.md#principled-implementation

The shape lies in its bounding sphere, so a segment's distance to it is at least the segment's distance to the centre less the radius, read at the segment's point nearest the centre in closed form.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One projection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The sphere is the shape's declared bounding sphere.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work in place of an exact query.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.relative

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the still case.

## @evidence contracts/development/implementation.md#principled-implementation

The matching collider's placement at `from` times the inverse of its placement at `from + 1` (`HumanArmShapes.relative`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One delegation to `carry`.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A collider that is not the same segment at both is read as still, never matched by place.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record and retains nothing.

# src/posture/HumanArmTrajectoryHalfStep.ts#HumanArmTrajectoryHalfStep.carry

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the result and the still case.

## @evidence contracts/development/implementation.md#principled-implementation

The matching collider's placement at `here` times the inverse of its placement at `there` (`HumanArmShapes.relative`).

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
