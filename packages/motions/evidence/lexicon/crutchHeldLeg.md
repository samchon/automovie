# src/lexicon/crutchHeldLeg.ts#crutchHeldLeg

## @evidence contracts/development/common.md#meaningful-documentation

States the clearing rise, the planned fold against the levels beneath, the ankle's share and the goal-less case.

## @evidence contracts/development/implementation.md#principled-implementation

The foot breaks contact vertically before it travels. The fold is then a joint-space course planned as TrajOpt plans a chain (Schulman et al. 2014, IJRR 33:1251), solved by trajopt's loop (`HumanSequentialConvex`, the port of sco's `BasicTrustRegionSQP::optimize`) at its trajectory settings, with each function convexified as sco's `CostFromFunc` and `ConstraintFromFunc` do (`HumanSequentialConvexFunctions`). The course's variables are hip and knee flexion at the law's phase instants. Its costs are trajopt's `JointVelCost` and the held pose's `JointPosCost`, in radians at coefficient 1. Its constraints are a collision row per knot (section IV-A): the ankle's distance from the flight's solid (treads and nosings), or from the floor where no flight is given, less the foot's farthest sole socket and the swing's clearance. The bounds are the joints' ROM. The seed is the law's own minimum-jerk fold. The course is played on the C² via-point quintic (`HumanArmRefine.hermite`). The ankle's compensation is the shank's sagittal tilt, the knee's flexion less the hip's.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two phases: the rise in closed form, then the planned course read by its interpolant.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The course starts from the resolved angles of the rise's end, so the two phases join. Its settings are trajopt's, its clearance the swing's own, and the foot's reach is its farthest sole socket. No tolerance is chosen here. The ankle is placed in the leg's sagittal plane in closed form, which bounds every sole point within that reach.

## @evidence contracts/development/implementation.md#efficient-algorithms

The course is solved once per plan, on the law's postures read once at its knots. Every other read is one interpolant evaluation, constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The crutch walk's and the crutch stair climb's injured legs share this writer, and the arm courses share its solver and interpolant.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains the standing posture, the fold's start angles and the planned knots for the plan's life.
