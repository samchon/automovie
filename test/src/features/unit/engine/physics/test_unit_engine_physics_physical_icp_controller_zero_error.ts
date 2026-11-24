import { physicalIcpController } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * An exactly zero capture-point error is zero after Zulu's zero dead band, the
 * band's limit where IHMC divides 0 / 0 (`ICPController` l.339-351); its zero
 * feedback direction has no normal, so the program fails and the last solution
 * stays (l.447-457), and the smart integral gathers nothing from it
 * (`AngularMomentumIntegrator` l.69-80).
 *
 * Scenarios, a plan at the origin over a wide support:
 *
 * 1. At rest with the capture point and the centre of mass on the plan: no
 *    solution, one failure, a stuck zero integral, and a pivot and centre of
 *    pressure on the capture point.
 * 2. Next, a 1 mm error while still stuck: the program solves, the integral
 *    gathers K_i dt e, and the pivot is the centre of pressure plus dCMP and
 *    the integral.
 * 3. Then a plan moving at 0.1 m/s: the integral clears and the pivot is the
 *    centre of pressure plus dCMP.
 * 4. A zero error after a solved update with the centre of mass moving at 0.33
 *    m/s, so not stuck: the last solution stays and the integral is zero.
 */
export function test_unit_engine_physics_physical_icp_controller_zero_error(): void {
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

  // 1. At rest, exactly on the plan.
  const first: physicalIcpController.IResult = run(
    physicalIcpController.create(),
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  );
  TestValidator.equals("first unsolved", first.converged, false);
  TestValidator.equals("first failure", first.state.failures, 1);
  TestValidator.equals("first stuck", first.state.integrator.stuck, true);
  TestValidator.equals("first integral", first.state.integrator.integral, {
    x: 0,
    y: 0,
  });
  TestValidator.equals("first pivot", first.cmp, { x: 0, y: 0 });
  TestValidator.equals("first CoP", first.cop, { x: 0, y: 0 });
  TestValidator.equals("first pair kept", first.state.copDelta, { x: 0, y: 0 });

  // 2. A small error, still stuck: solved, the integral gathers K_i dt e.
  const second: physicalIcpController.IResult = run(
    first.state,
    { x: 0.001, y: 0 },
    { x: 0, y: 0 },
  );
  TestValidator.equals("second solved", second.converged, true);
  TestValidator.predicate(
    "second integral",
    Math.abs(second.state.integrator.integral.x - 2.0 * 0.004 * 0.001) <
      1e-15 && second.state.integrator.integral.y === 0,
  );
  TestValidator.equals("second pivot", second.cmp, {
    x:
      second.cop.x +
      second.state.cmpDelta.x +
      second.state.integrator.integral.x,
    y:
      second.cop.y +
      second.state.cmpDelta.y +
      second.state.integrator.integral.y,
  });
  TestValidator.predicate("second CoP with feedback", second.cop.x > 0);

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
}
