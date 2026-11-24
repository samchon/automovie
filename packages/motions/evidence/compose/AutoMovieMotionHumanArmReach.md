# src/compose/AutoMovieMotionHumanArmReach.ts#AutoMovieMotionHumanArmReach.IRequest

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning, frame and unit.

## @evidence contracts/development/design.md#principled-representation

The request in world terms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only what the reading uses.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/compose/AutoMovieMotionHumanArmReach.ts#AutoMovieMotionHumanArmReach.IRequest.wrist

## @evidence contracts/development/common.md#meaningful-documentation

States what the member gives, its frame and unit, and why it reads the attitude.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A member's signature; the caller of `attitude`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A member's signature; the caller of `attitude`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A member's signature; the caller of `attitude`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A member's signature; the caller of `attitude`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A member's signature; the caller of `attitude`, which implements it, carries this claim.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A member's signature; the caller of `attitude`, which implements it, carries this claim.

# src/compose/AutoMovieMotionHumanArmReach.ts#AutoMovieMotionHumanArmReach.IResult

## @evidence contracts/development/common.md#meaningful-documentation

States each member's meaning and unit.

## @evidence contracts/development/design.md#principled-representation

A world quaternion and its turn.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the laws read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/compose/AutoMovieMotionHumanArmReach.ts#AutoMovieMotionHumanArmReach.attitude

## @evidence contracts/development/common.md#meaningful-documentation

States the partial orientation constraint, the two free coordinates, F and its terms, the constrained problem and its solver, the units, the start and the kept branch, the limit check after it, the refusal with its joint, axis and degrees, and that the choice is made once where the law plans.

## @evidence contracts/development/implementation.md#principled-implementation

Tolani, Goswami and Badler 2000, Graphical Models 62:353, section 3.3 "Partial Orientation Constraints", "Joint limits" (pp. 374-376) and Table 3 (p. 379): with a free turn psi about the end effector's axis and the swivel phi, the pair minimising F = sum over every angle but the elbow's hinge of (theta_i - theta_i*)^2, theta_i* the middle of each range, subject to every angle within its range (a two-variable problem with nonlinear inequality constraints; the unconstrained minimum, Table 2, may leave a joint past its range, as section 3.3 states). It is solved by the trajopt sequential convex optimiser (`HumanSequentialConvex`, the port of `sco::BasicTrustRegionSQP`, github.com/joschu/trajopt at 8da5bb00b690647318a12fa4f5dd7e6c8a0f501c, BSD-2-Clause; Schulman et al. 2014) with its own parameters, the cost and the constraint read through the port of trajopt's CostFromFunc and ConstraintFromFunc (`HumanSequentialConvexFunctions`), in radians, the units sco's parameters are stated in. Where the minimum is interior it is the unconstrained one. The start is the arm's fit of the asked attitude, whose swivel is the feasible one nearest the hint's (sections 3.2.2 and 3.2.4), and its branch is kept. The angles are the shoulder's and the wrist's read before the range applies (`HumanLimbAt.free`), the wrist read as one spherical joint whose twist the rig takes in the forearm, so the twist's range is the forearm's. The angles at the solution are checked by the rig's own clamp (`clampJointToSkeleton`, coupled limits included) within `ROM_TOLERANCE`, and a joint past it is refused with its name, axis and degrees.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One private choice (`resolve`) read by `attitude`, which refuses, and `met`, which answers none; the angles come from the limb's owner (`HumanLimbAt.free`, `fitHingedChainAt.free`), the ranges from the rig's (`getConstraint`, `clampJointToSkeleton`) and the solve from the one constrained optimiser's owner (`HumanSequentialConvex`).

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No scan, step or tuned value: the former 15 degree scan, golden-section refinement and admitted-arc test, which had no source, are gone. The objective and the constraints are the reference's, the optimiser's parameters sco's own defaults in sco's units, and the tolerance the rig's.

## @evidence contracts/development/implementation.md#efficient-algorithms

One fit for the start, then one closed-form reading of the free angles per evaluation of F or the constraint (no placement, clamp or projection), as many as the SQP's convexifications and trust-region trials ask for two variables, once where the law plans.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call solves its own request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after returning.

# src/compose/AutoMovieMotionHumanArmReach.ts#AutoMovieMotionHumanArmReach.met

## @evidence contracts/development/common.md#meaningful-documentation

States that it is `attitude`'s choice answering none where `attitude` refuses.

## @evidence contracts/development/implementation.md#principled-implementation

The same section 3.3 choice and limit check as `attitude`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Reads the one private choice `attitude` reads.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No catch: a joint past its range is the choice's own answer, and every other failure propagates.

## @evidence contracts/development/implementation.md#efficient-algorithms

As `attitude`.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call solves its own request.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing after returning.