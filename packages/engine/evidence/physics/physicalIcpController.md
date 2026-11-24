# src/physics/physicalIcpController.ts#physicalIcpController

## @evidence contracts/development/common.md#meaningful-documentation

States the feed-forward with zero alphas, the dead-banded error and its exactly-zero case, the gains and weights in the motion frame, when the feedback bounds apply, the output and the caller's not-a-number guard, with the frame and units of every input and output.

## @evidence contracts/development/implementation.md#principled-implementation

A line-by-line port of IHMC's `ICPController.compute` (develop, l.280-337) and its private steps (l.339-519), `ICPControllerHelper` (l.20-81) and the guard of its caller `LinearMomentumRateControlModule` (l.569-598), cited per block, with Zulu's parameters. The feed-forward and feedback alphas are zero because Zulu's alpha calculators and projection operator are null (l.462-504); the perfect CoP is the perfect CMP because no planned CoP is given (l.304-308), which equals the 201903 planner's own CMP (`ContinuousCMPBasedICPPlanner` l.498). An exactly zero error is not a number as in the reference (0 / 0 at l.349), so the program fails and the last pair stays (l.451-457); a stuck integrator then carries a not-a-number integral, and the guard replaces a not-a-number pivot by the capture point and a not-a-number CoP by the pivot, as the reference's caller does. The controller is invariant under rotations and reflections of the caller's frame: the motion-frame matrices R diag R^T and the squared direction cross product do not change sign.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The controller owns the reference's controller-side decisions (feed-forward, dead band, gains, the bound switch, the outputs and the guard); the program is `physicalIcpControllerQp` and the integral `physicalAngularMomentumIntegrator`, as the reference splits `ICPControllerQPSolver` and `AngularMomentumIntegrator` out. The helper's motion-frame transforms are file-private.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every value comes from `ZULU`, which cites its reference lines, or from the caller. The not-a-number guard is the reference caller's, not a compensation added here. There are no casts.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work besides the program, whose cost is linear-logarithmic in the support's vertices plus one dense four-variable solve.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of its input.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing; the caller owns the returned state.

# src/physics/physicalIcpController.ts#physicalIcpController.IState

## @evidence contracts/development/common.md#meaningful-documentation

Documents each field with the reference field it stands for, its units and when it changes.

## @evidence contracts/development/design.md#principled-representation

The controller's persistent state, plain data so a checkpoint resumes it exactly: the feedback pair in metres, which is both the controller's delta and the solver's previous solution because the two change together; the integrator's state; the just-initialized flag; and the never-reset failure count. A not-a-number integral is a reference state the type allows.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owned by the controller, created by `create`, advanced by the controller and `initialize`, and held by the caller between updates.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpController.ts#physicalIcpController.IParameters

## @evidence contracts/development/common.md#meaningful-documentation

Documents every parameter with its units and whether it is divided by dt^2.

## @evidence contracts/development/design.md#principled-representation

The tunable values the reference reads from `ICPControllerParameters`, `ICPControlGains` and `IntegratorGains`, flat; the flags Zulu fixes (CMP feedback, angular momentum, no control polygons, no high CoP damping) are not parameters because the port implements only the Zulu path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the controller; callers override members through a partial object, and `ZULU` gives the defaults.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpController.ts#physicalIcpController.IResult

## @evidence contracts/development/common.md#meaningful-documentation

Documents the new state, the commanded CoP and CMP in metres, and the convergence flag with its kept-solution meaning.

## @evidence contracts/development/design.md#principled-representation

The controller's outputs `getDesiredCoP` and `getDesiredCMP` after the caller's guard, never not a number when the inputs are finite, with the program's success.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the balance phases that command the stance; the feedback pair is the state's, not repeated.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None of the listed shapes.

# src/physics/physicalIcpController.ts#physicalIcpController.create

## @evidence contracts/development/common.md#meaningful-documentation

States the constructed state.

## @evidence contracts/development/implementation.md#principled-implementation

The field initializers of `ICPController` (l.111-138) and of its solver's previous solution (`ICPControllerQPSolver` l.198-200): zero pair, no failure, rate limit not ignored, a new integrator.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A fresh value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.

# src/physics/physicalIcpController.ts#physicalIcpController.initialize

## @evidence contracts/development/common.md#meaningful-documentation

States what initialization changes and keeps.

## @evidence contracts/development/implementation.md#principled-implementation

`ICPController.initialize` (l.232-236): the next update ignores the feedback bounds and the integrator is reset; the reference touches neither the solution nor the failure count.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One literal, delegating the integrator's reset to its owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

None.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A fresh value.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

It retains nothing.
