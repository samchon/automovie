# src/posture/HumanArmTrajectoryLinks.ts#HumanArmTrajectoryLinks.Owner

## @evidence contracts/development/common.md#meaningful-documentation

Names the arm segment a collider rides on.

## @evidence contracts/development/design.md#principled-representation

The frame's own owner type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a link and the origins are keyed by.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An alias of the frame's type, never a copy.

# src/posture/HumanArmTrajectoryLinks.ts#HumanArmTrajectoryLinks.ILink

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its frame and its unit.

## @evidence contracts/development/design.md#principled-representation

An audit part's probes, the sphere about them, its reach from its segment's origin, its probe offset and its shapes as convex solids: what a link pair is read by.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the pair readings' screens, certificates and casts read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The probes are indices into the placed arm and the offset the tangle model's own.

# src/posture/HumanArmTrajectoryLinks.ts#HumanArmTrajectoryLinks.IStep

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

A frame's index and the arm's solids there by part.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a cast reads at each frame on the way.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/posture/HumanArmTrajectoryLinks.ts#HumanArmTrajectoryLinks.of

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The audit's parts as the frame's probes name them, each with its own shapes from the arm's colliders and the tangle model's probe offset, so a link pair bounds exactly the probes the audit reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass grouping the probes, one closing each part's sphere and reach.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The reach covers every probe and every shape point, so a bound read at it covers the whole part.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the arm's probes and collider points, once per pair reading.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.

# src/posture/HumanArmTrajectoryLinks.ts#HumanArmTrajectoryLinks.shapes

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The arm's colliders placed (`HumanArmShapes.colliders`) as GJK solids, by the part each belongs to.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the colliders.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the colliders' points.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.

# src/posture/HumanArmTrajectoryLinks.ts#HumanArmTrajectoryLinks.cast

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, the frames cast over, the hull and the margin.

## @evidence contracts/development/implementation.md#principled-implementation

The convex hull of the part's places at the frames cast over, carried into the shape's frame at the interval's first waypoint, holds every chord of the course's frame steps among them: trajopt's cast hull, the convex hull of consecutive poses (Schulman et al. 2014, section IV-B), with no widening for the course between them. Read over the whole interval, or over one frame step where the whole interval's cast does not certify.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One union of points per solid.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The cast is the hull of the step's poses and nothing wider, as trajopt's is, so a cast certified clear leaves no probe's chord to read; the course between the poses is not read, as trajopt does not read it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the solids' points times the frames cast over; one GJK per cast reads it.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its arguments.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh records and retains nothing.

# src/posture/HumanArmTrajectoryLinks.ts#HumanArmTrajectoryLinks.origins

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Each segment's joint: the shoulder, the elbow, the wrist.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One record.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure reading of its argument.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh record of borrowed vectors.
