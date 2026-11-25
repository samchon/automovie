# src/posture/HumanArmTrajectoryJacobians.ts#HumanArmTrajectoryJacobians.IMotion

## @evidence contracts/development/common.md#meaningful-documentation

Defines both quantities at the segment's physical origin in world coordinates.

## @evidence contracts/development/design.md#principled-representation

A rigid segment's instantaneous twist, with linear motion scaled to the convex subproblem's millimetres and angular motion left in radians.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two vectors feed point motion and the existing distance/contact rows through IJacobian.segments and carried.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No alternate joint axis, contact proxy or cached candidate pose is represented.

# src/posture/HumanArmTrajectoryJacobians.ts#HumanArmTrajectoryJacobians.IJacobian

## @evidence contracts/development/common.md#meaningful-documentation

Documents probe/contact/hand columns, their units, segment twists and the trust-region movement reading; outer waypoints have empty arrays and zero move.

## @evidence contracts/development/design.md#principled-representation

The actual current candidate's derivatives in the context's free-coordinate order; point motions are world millimetres and orientation-residual derivatives are degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanArmTrajectoryConvex and the hard point-limit owner consume these rows; segment twists also give arbitrary carried-point derivatives without a second arm Jacobian.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Keeps all probes and the sum-of-column-length movement bound, with absent contact/orientation represented by the original empty lists rather than fabricated rows.

# src/posture/HumanArmTrajectoryJacobians.ts#HumanArmTrajectoryJacobians.IJacobian.probe

## @evidence contracts/development/common.md#meaningful-documentation

Documents HumanArmTrajectoryJacobians.IJacobian.probe: A probe's motion, millimetres per coordinate unit, a vector per free coordinate.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

This callable contract has no algorithm body; its producer supplies probe and its premises.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

This signature fixes the call boundary only; the decomposition belongs to its producer.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No computation or fitted constant is implemented by this signature; its producer keeps every admission check.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

The signature selects no algorithm; its producer owns its cost.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The declaration creates no cache; its producer owns what it shares between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The callable type acquires nothing; its producer owns what it retains and releases.

# src/posture/HumanArmTrajectoryJacobians.ts#HumanArmTrajectoryJacobians

## @evidence contracts/development/common.md#meaningful-documentation

Specifies current iterate inputs, free-column ordering and which waypoints return empty derivatives.

## @evidence contracts/development/implementation.md#principled-implementation

The shared arm-column owner gives segment-origin twists; each attached point moves by v_origin plus omega cross its current displacement from that origin, scaled to millimetres. Orientation residuals retain turned's original two-sided logarithm reading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One candidate's columns feed probe, contact and orientation rows and then the original movement bound; each probe reads its relative position once, and one point-motion owner completes each fresh cross-product result.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps all columns, probe/site order, exact pad placement, 1000 scaling and cross/add grouping, HAIR and movement-bound reductions; no tolerance, target or chart derivative is changed.

## @evidence contracts/development/implementation.md#efficient-algorithms

For F free coordinates and P probes the required derivative output remains O(FP); each probe-origin displacement and contact placement is computed once per candidate rather than F times, with O(P) temporary offsets. Each output completes its fresh cross vector in place, avoiding the unobserved scale and add vectors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The synchronous candidate's probe points, origins, hand frame and site contact stay fixed while its columns vary. Lazy offsets reuse those exact completed differences only within this candidate; all angular differences remain separate actual readings.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

At most one private vector per probe and one contact offset survive the column loop, then are released. Only fresh derivative outputs and the original borrowed angular vectors escape; no candidate input or offset history is cached.

# src/posture/HumanArmTrajectoryJacobians.ts#HumanArmTrajectoryJacobians.waypoint

## @evidence contracts/development/common.md#meaningful-documentation

States the one entry it makes, its columns and the outer waypoint's empty entry.

## @evidence contracts/development/implementation.md#principled-implementation

The rigid-body point motion `of` states: each column's segment twist moves an attached point by v_origin plus omega cross its displacement, scaled to millimetres; the rotation's columns are the residual's central differences.

## @evidence contracts/development/implementation.md#clear-and-simple-structure `of` is this entry mapped over every arm and waypoint, so a reader of one waypoint (a laid course's detour) and the convex subproblem read one owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every column, probe order, contact placement, HAIR and movement bound as `of` made them; an entry depends on the arm's coordinates and placement at its own waypoint alone.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(F P) numbers for F free coordinates and P probes at the one waypoint, written consecutively into one buffer per waypoint with each movement bound summed in column order; a probe's vectors are made only when a row reads it (IJacobian.probe), where every probe's F vectors were made before.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The waypoint's probe points, origins, hand frame and contact are read once and shared by its columns; nothing crosses waypoints.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The entry owns one derivative buffer and releases it with its lazily materialised vectors.

# src/posture/HumanArmTrajectoryJacobians.ts#HumanArmTrajectoryJacobians.carried

## @evidence contracts/development/common.md#meaningful-documentation

States the point's owning arm/waypoint/segment, its world-metre coordinates and each returned column's millimetre units.

## @evidence contracts/development/implementation.md#principled-implementation

Shifts each current segment-origin twist to the attached point by omega cross p minus origin, then applies the original metre-to-millimetre scale and linear sum.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Selects the actual segment origin once and maps the current derivative columns through the same point-motion owner as probe and contact columns.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves source-column order and the original cross, scale and add grouping; an empty list still performs no point subtraction.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(F) output work for F columns with one lazy point-origin subtraction instead of F identical subtractions, one fresh cross vector completed directly as each output instead of three vectors, and constant temporary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed point and chosen candidate origin share one private difference within this synchronous map; no motion or pose result is reused across candidates.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The private difference dies after the map and never escapes through its fresh returned vectors; no state or resource is retained.

# src/posture/HumanArmTrajectoryJacobians.ts#HumanArmTrajectoryJacobians.turned

## @evidence contracts/development/common.md#meaningful-documentation

States the rotation-vector residual being differentiated, its two-sided span and the output units.

## @evidence contracts/development/implementation.md#principled-implementation

Central differences of the existing quaternion-log residual along the supplied world angular velocity preserve that residual's curvature; zero velocity returns the original zero derivative.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Measures the velocity, takes the original positive and negative turned-hand readings, and divides their difference by twice HAIR.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps HAIR, degree conversion, positive-before-negative query order and the rotation-vector owner's sign and zero policies; no linearized-log substitute is used.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two actual quaternion residual readings and constant vector work per nonzero column, with no full-pose perturbation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The normalized angular axis is shared by the two readings; each different angular velocity still evaluates both original residuals.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only a fresh derivative vector is returned; the local reader, temporary rotations and vectors are released when this call returns or throws.
