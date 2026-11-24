import { physicalIcpController } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * An exactly zero capture-point error follows IHMC's own arithmetic and never
 * lets a not-a-number out: Zulu's zero dead band scales the error by 0 / 0
 * (`ICPController` l.339-351), the program fails, the last solution stays
 * (l.447-457), and while the body is stuck the smart integral becomes not a
 * number and stays so (`AngularMomentumIntegrator` l.69-80); the caller's guard
 * then commands the capture point as the pivot and the pivot as a not-a-number
 * centre of pressure (`LinearMomentumRateControlModule` l.576-598).
 *
 * Scenarios, a plan at the origin over a wide support:
 *
 * 1. At rest with the capture point and the centre of mass on the plan: no
 *    solution, one failure, a stuck not-a-number integral, and a pivot and
 *    centre of pressure on the capture point.
 * 2. Next, a 1 mm error while still stuck: the program solves, the integral stays
 *    not a number, and the pivot is still the capture point.
 * 3. Then a plan moving at 0.1 m/s: the integral clears and the pivot is the
 *    centre of pressure plus dCMP again.
 * 4. A zero error after a solved update with the centre of mass moving at 0.33
 *    m/s, so not stuck: the last solution stays and the integral is zero.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the reference's not-a-number path, the guard and each scenario.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the controller update after update and reads its outputs, state and convergence.
 * @evidence contracts/development/testing.md#independent-expectations The expectations follow the cited reference lines: 0 / 0 is not a number, a failed solve keeps the last pair, a stuck integral of a not-a-number error is not a number, and the guard replaces the pivot by the capture point; an implementation that zeroes the error, clears the pair or lets a not-a-number out fails.
 * @evidence contracts/development/testing.md#distinguishing-cases Stuck and moving centres of mass, a recovered error and a moving plan; nonzero feedback belongs to the feedback, constraint and exactness tests, the integrator's own rules to its test.
 * @evidence contracts/development/testing.md#execution-ownership Pure computation on in-memory states.
 */
export function test_physical_icp_controller_zero_error(): void {
  const omega: number = Math.sqrt(9.81 / 0.9);
  const run = (
    state: physicalIcpController.IState,
    capture: { x: number; y: number },
    center: { x: number; y: number },
    desiredVelocity: { x: number; y: number } = { x: 0, y: 0 },
  ): physicalIcpController.IResult =>
    physicalIcpController({
      state,
      support: [
        { x: -0.5, y: -0.5 },
        { x: 0.5, y: -0.5 },
        { x: 0.5, y: 0.5 },
        { x: -0.5, y: 0.5 },
      ],
      desired: { x: 0, y: 0 },
      desiredVelocity,
      capture,
      center,
      omega,
      dt: 0.004,
    });
  const finite = (point: { x: number; y: number }): boolean =>
    Number.isFinite(point.x) && Number.isFinite(point.y);

  // 1. At rest, exactly on the plan.
  const first: physicalIcpController.IResult = run(
    physicalIcpController.create(),
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  );
  TestValidator.equals("first unsolved", first.converged, false);
  TestValidator.equals("first failure", first.state.failures, 1);
  TestValidator.equals("first stuck", first.state.integrator.stuck, true);
  TestValidator.predicate(
    "first integral not a number",
    Number.isNaN(first.state.integrator.integral.x),
  );
  TestValidator.equals("first pivot", first.cmp, { x: 0, y: 0 });
  TestValidator.equals("first CoP", first.cop, { x: 0, y: 0 });
  TestValidator.equals("first pair kept", first.state.copDelta, { x: 0, y: 0 });

  // 2. A small error, still stuck: solved, the integral still poisoned.
  const second: physicalIcpController.IResult = run(
    first.state,
    { x: 0.001, y: 0 },
    { x: 0, y: 0 },
  );
  TestValidator.equals("second solved", second.converged, true);
  TestValidator.predicate(
    "second integral not a number",
    Number.isNaN(second.state.integrator.integral.x),
  );
  TestValidator.equals("second pivot", second.cmp, { x: 0.001, y: 0 });
  TestValidator.predicate(
    "second CoP finite with feedback",
    finite(second.cop) && second.cop.x > 0,
  );

  // 3. A moving plan clears the integral.
  const third: physicalIcpController.IResult = run(
    second.state,
    { x: 0.001, y: 0 },
    { x: 0, y: 0 },
    { x: 0.1, y: 0 },
  );
  TestValidator.equals("third unstuck", third.state.integrator, {
    stuck: false,
    integral: { x: 0, y: 0 },
  });
  TestValidator.equals("third pivot", third.cmp, {
    x: third.cop.x + third.state.cmpDelta.x,
    y: third.cop.y + third.state.cmpDelta.y,
  });

  // 4. Not stuck: the last solution stays, no integral.
  const solved: physicalIcpController.IResult = run(
    physicalIcpController.create(),
    { x: 0.1, y: 0 },
    { x: 0, y: 0 },
  );
  TestValidator.predicate(
    "solved moving, not stuck",
    solved.converged && !solved.state.integrator.stuck,
  );
  const zero: physicalIcpController.IResult = physicalIcpController({
    state: solved.state,
    support: [],
    desired: { x: 0.1, y: 0 },
    desiredVelocity: { x: 0, y: 0 },
    capture: { x: 0.1, y: 0 },
    center: { x: 0, y: 0 },
    omega,
    dt: 0.004,
  });
  TestValidator.equals("zero unsolved", zero.converged, false);
  TestValidator.equals(
    "zero pair kept",
    zero.state.copDelta,
    solved.state.copDelta,
  );
  TestValidator.equals(
    "zero CMP pair kept",
    zero.state.cmpDelta,
    solved.state.cmpDelta,
  );
  TestValidator.equals("zero not stuck", zero.state.integrator, {
    stuck: false,
    integral: { x: 0, y: 0 },
  });
  TestValidator.equals("zero CoP", zero.cop, {
    x: 0.1 + solved.state.copDelta.x,
    y: 0 + solved.state.copDelta.y,
  });
  TestValidator.predicate(
    "zero outputs finite",
    finite(zero.cop) && finite(zero.cmp),
  );
}
