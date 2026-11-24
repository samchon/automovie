# src/lexicon/crutchHeldLeg.ts#crutchHeldLeg

## @evidence contracts/development/common.md#meaningful-documentation

States the course from the bearing pose against the levels beneath and the body, and the ankle's share.

## @evidence contracts/development/implementation.md#principled-implementation

From the bearing pose, the lift and the fold are one joint-space course planned as TrajOpt plans a chain (Schulman et al. 2014, IJRR 33:1251), solved by trajopt's loop (`HumanSequentialConvex`) at its trajectory settings. Each function is convexified as sco's `CostFromFunc` and `ConstraintFromFunc` do, in its own variables (`HumanSequentialConvexFunctions`).
- Variables: the hip's flexion, abduction and twist and the knee's flexion at the law's phase instants.
- Costs: trajopt's `JointVelCost` and the held pose's `JointPosCost`, in radians at coefficient 1.
- Collision rows (TrajOpt's collision term reads every link and the environment): at each knot (section IV-A) and swept between consecutive knots (section IV-B), from the first free knot, as trajopt reads collision from its irst_step. Every probe of the leg's segments, the probes the take's tangle audit reads (`AutoMovieMotionHumanAuditTangleModel`), is placed on the colliders of the posture resolved as it is displayed (`HumanColliders`). Each must keep a swing's clearance from the flight's treads and nosings, or from the floor where no flight is given. Each leg segment must lie in every other unrelated segment of the body no deeper than its reference depth and the audit's allowance (`Tangle.excess`, `HumanAuditModel.ALLOWANCE`).
- Bounds: the joints' ROM.
- Seed: the law's own minimum-jerk fold.
The course is played on the minimum-jerk path through its knots (`HumanArmRefine.hermite`). The ankle's compensation is the shank's sagittal tilt, the knee's flexion less the hip's.
## @evidence contracts/development/implementation.md#clear-and-simple-structure

One planned course read by its interpolant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The course starts from the resolved angles of the bearing pose, so the leg leaves its stance without a step. Its settings are trajopt's, its clearance the swing's own, and its probes the audit's. No tolerance is chosen here.

## @evidence contracts/development/implementation.md#efficient-algorithms

The course is solved once per plan, on the law's postures read once at its knots; each collision row resolves only its own two knots' postures. Every other read is one interpolant evaluation.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The crutch walk's and the crutch stair climb's injured legs share this writer, and the arm courses share its solver and interpolant.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the bearing angles and the planned knots for the plan's life.
