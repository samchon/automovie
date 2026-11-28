# src/kinematics/AutoMovieEngineKinematics.ts#AutoMovieEngineKinematics.hingedArmArticulation

## @evidence contracts/development/common.md#meaningful-documentation

The caller supplies the chain in world and bone-local frames and ranks poses with synchronous scores. The declaration names the bone-local result, the metre and degree fields, the cold and continued routes, and the different outcomes for unsuitable geometry and an invalid continuation tolerance. The prepared target is a calculation for the same source geometry and limits.

## @evidence contracts/development/implementation.md#principled-implementation

Rotating the far segment around the hinge makes the square of the reach a sinusoid of the hinge angle. Its roots give the bend branches. An out-of-span distance or a rotation limit produces a stopped branch, whose shortfall determines cold eligibility. A root swivel about the aimed line leaves the location of the effector unchanged. The solver compares candidates on that line by range overshoot and the caller's declared scores. A continued branch retains its original identity or maps to the last branch when the roots meet. A nonfinite bend stop cannot participate in that ordering. Both the direct and prepared branch owner refuse it before scoring and the placed pole shares the continuation tolerance check.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most two bend branches reach the swivel search. The coarse cold sweep samples in one-degree increments. A solve owns its evaluated steps and refinements, so a later unpruned pass can reuse them. Certified refusal and lower bounds spare comparisons that cannot win. A continued solve works on one chosen branch and contracts the local bracket to the admitted tolerance or to the floating-point limit. A placed-pole walk has a half-turn limit and a fixed bisection count. Only the result and the caller's synchronous observation leave the solve.

# src/kinematics/AutoMovieEngineKinematics.ts#AutoMovieEngineKinematics.resolveAutoMovieHumanoidRingModules

## @evidence contracts/development/common.md#meaningful-documentation

Callers supply rest joints in the Human coordinate frame and in metres. The declaration explains the optional jaw and foot landmarks, the retained pivots, the shared drawing and collision output, and the conditions that refuse a required part.

## @evidence contracts/development/implementation.md#principled-implementation

The internal ring planner frames sections from the rest joints. A qualified chin landmark moves the lower head ring while the crown remains its existing closing point. A heel and same-side hallux tip define the horizontal foot direction, shared by the foot and toe section frames without moving the pivots. The mesh and physical hull call the same planner. The stock landmark test checks observed extents on four population bodies and an asymmetric foot. The joint-based route covers callers that supply no suitable landmarks.

## @evidence contracts/development/implementation.md#efficient-algorithms

The planner indexes joint names and children once, associates a foot axis with each available outline and reuses that axis along the toes. It visits the rig in joint order while emitting bounded section counts per segment. The name, child and foot-axis maps are local to one invocation. The caller receives the new modules and their ring points.

# src/kinematics/AutoMovieEngineKinematics.ts#AutoMovieEngineKinematics.solveResolvedRate

## @evidence contracts/development/common.md#meaningful-documentation

The declaration states which branch and physical frame the supplied Jacobian and goal derivative represent, the row and coordinate units, the positive scale, and the solve and refusal results. It names the diagnostics a solved call returns.

## @evidence contracts/development/implementation.md#principled-implementation

The owner admits complete finite coefficient rows, goal rates and positive scales before division. A nonzero value that disappears during scaling, or a result, inverse norm or compensated residual outside finite binary64, yields unrepresentable. The LU pivot rule yields singular separately. The tests verify rate parity across a valid unit rescaling and preserve the residual of a represented third.

## @evidence contracts/development/implementation.md#efficient-algorithms

The scaled matrix is factored once and the factorization solves the goal and each inverse column. Factoring, constructing the inverse and evaluating the defect require cubic work in the matrix size. The matrix and inverse use quadratic working storage that is released after return. The caller owns the result vectors.
