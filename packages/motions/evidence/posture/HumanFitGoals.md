# src/posture/HumanFitGoals.ts#HumanFitGoals.IReading

## @evidence contracts/development/common.md#meaningful-documentation

States each value's unit and ordering.

## @evidence contracts/development/design.md#principled-representation

Values of the goals on the same bones as every contact row.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Shared by the rows, merit and final residuals.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No predicted or unclamped configuration is read.

# src/posture/HumanFitGoals.ts#HumanFitGoals.read

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs, result and invalid geometry.

## @evidence contracts/development/implementation.md#principled-implementation

Included angles are atan2 of cross-product length and dot product; the mass centre is the existing segmental reading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One angle map and an optional centre reading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid targets throw instead of yielding a fabricated point or angle.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the landmarks plus the mass segments when a centre is requested; no new forward kinematics.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the fit's resolved bones and HumanFitBalance's cached mass model.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanFitGoals.ts#HumanFitGoals.angle

## @evidence contracts/development/common.md#meaningful-documentation

States the units, vertex and degeneracies.

## @evidence contracts/development/implementation.md#principled-implementation

atan2 of the sine numerator and cosine numerator gives the unsigned geometric angle without acos cancellation near its endpoints.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Three landmarks and two vector products.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing bones, empty means and zero rays throw.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the points defining the three landmarks.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The owning reading calls once per angle.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanFitGoals.ts#HumanFitGoals.bounds

## @evidence contracts/development/common.md#meaningful-documentation

States units, scalar convention and validity.

## @evidence contracts/development/implementation.md#principled-implementation

Converts the goal's degree interval to radians without changing its physical width.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One normalization, validation and conversion.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Rejects reversed, nonfinite or endpoint-singular goals rather than clipping them.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Rows, merit and residuals share this convention.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanFitGoals.ts#HumanFitGoals.slopes

## @evidence contracts/development/common.md#meaningful-documentation

States the Jacobian units and noncollinearity requirement.

## @evidence contracts/development/implementation.md#principled-implementation

Differentiates atan2 of cross length and dot: with unit n along u cross v, gradients of the angle in its two rays are (u cross n)/|u|² and (n cross v)/|v|²; the vertex moves both rays negatively. Rigid-point velocities are HumanJacobian's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two ray gradients dotted with each variable's endpoint-minus-vertex velocities; private velocity owns lazy current landmark-point preparation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A singular angle is reported instead of inventing a bending plane or perturbing the pose.

## @evidence contracts/development/implementation.md#efficient-algorithms

For n variables and L points across the three landmarks, keeps O(n*L) rigid-point velocity work but reduces repeated world-point transforms from n*L to L, with O(L) local point storage; owned mean accumulators also avoid a new sum vector per point, and no finite-difference fits or forward kinematics are added.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The same unchanged bones and bone-local points serve all variable motions during this synchronous call, and HumanJacobian.velocity does not mutate them; each point is prepared at its first original velocity phase and later motions reuse that exact completed world point.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

At most three local point arrays are acquired only when a motion consumes them and released on return or throw; the returned scalar slopes retain no points, bones or motion history.

# src/posture/HumanFitGoals.ts#HumanFitGoals.directions

## @evidence contracts/development/common.md#meaningful-documentation

States normalization, frame, order and invalid directions.

## @evidence contracts/development/implementation.md#principled-implementation

A position constrained on a direction is its scalar projection; normalization keeps the row in metres regardless of the author's vector length.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

World-axis basis vectors or normalized supplied directions.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Invalid directions throw rather than becoming an unrelated world axis.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in requested axes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The rows, merit and result use this same direction convention.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/posture/HumanFitGoals.ts#HumanFitGoals.rows

## @evidence contracts/development/common.md#meaningful-documentation

States row order and scaling.

## @evidence contracts/development/implementation.md#principled-implementation

The same scalar values the merit reads are linearised by the angle derivative and the segmental centre's mass-weighted point Jacobian.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Angle rows, then selected Cartesian centre rows.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every goal uses its own price or the existing default; no action is named.

## @evidence contracts/development/implementation.md#efficient-algorithms

One angle derivative per target and one centre Jacobian shared across its axes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the owning equality builder and accepts a lazy same-body/bones/motions centre-column producer, invoked only at the original centre-Jacobian phase after angle rows; absent it, HumanFitBalance.velocities computes fresh columns.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The row builder owns the emitted callbacks and scalar coefficients until model release; this function retains no data globally, and a supplied lazy column producer is consumed synchronously.
