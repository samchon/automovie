# src/posture/HumanArmTrajectorySweep.ts#HumanArmTrajectorySweep.ISwept

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, unit and frame.

## @evidence contracts/development/design.md#principled-representation

The swept capsule's far end, the turn that carries directions with it, its clearance and its bound, the four facts the violation and its linearisation are made of.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Six members, all read by the convex model; the merit reads `clear` and `lower`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Indices into the placed arm's probes and the frame's shapes, not copies.

# src/posture/HumanArmTrajectorySweep.ts#HumanArmTrajectorySweep.of

## @evidence contracts/development/common.md#meaningful-documentation

States what is read, what is left out and the order.

## @evidence contracts/development/implementation.md#principled-implementation

A sphere moving on a segment sweeps a capsule; its signed distance to a convex shape is the segment's distance less the radius (`physicalShapeSegmentDistance`), read relative to the shape's own motion as continuous collision detection against a moving obstacle is.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One loop over the eight spheres and the shapes near each.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The reach, the allowances and the radius are the model's own, unchanged; the exact segment distance decides every sweep any reader can use. The screen uses the shape's declared bounding-sphere radius, never an estimate: the shape lies in that sphere, so the segment's distance to its centre less its radius and the probe's is a true lower bound on the clearance, and a sweep skipped by it is clear of its allowance by more than `T.CHECK`, past both the merit (which counts only a sweep past its allowance) and the convex rows (which read only one within `T.CHECK`).

## @evidence contracts/development/implementation.md#efficient-algorithms

Eight sphere screens over the waypoint's reachable shapes; a closed-form segment-to-centre bound per near shape (TrajOpt's d_check, Schulman et al. 2014, section IV); one exact segment distance only where that bound falls within the check distance.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The reading is kept on the iterate's evaluation, so the convex model of the same iterate reads these records instead of the geometry again.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.
