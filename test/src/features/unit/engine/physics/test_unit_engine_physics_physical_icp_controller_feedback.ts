import { physicalIcpController } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * The ICP controller's unconstrained feedback follows IHMC's program: the total
 * feedback dCoP + dCMP is K = 1 + K_p times the capture point's error, short
 * only by the program's own regularization, with K_p along the plan's motion
 * forward, across it laterally and across both ways at rest
 * (`ICPControllerHelper` l.30-57), split between the CoP and the CMP by their
 * weights, and pulled toward the last solution by the rate weight.
 *
 * Scenarios, all with a support far wider than the feedback:
 *
 * 1. A plan moving along +x and a forward error: the total matches the closed form
 *    below with k = 1 + 2.5, along the error.
 * 2. The same plan and a lateral error: k = 1 + 2.0, along the error.
 * 3. A plan at rest and a forward error: k = 1 + 2.0.
 * 4. A rate weight of 1e-4 and a last solution of 0.02 + 0.01 m: the total moves
 *    toward 0.03 m by the closed form; Zulu's 1e-8 leaves it there within 1e-6
 *    of the case without a last solution.
 *
 * Along one axis with the motion frame aligned, the reference's tasks are 1/2 a
 * c^2 + 1/2 10 m^2 + 1/2 r (s - f)^2 + 2 * 1/2 w (s / k - e)^2, with s = c + m,
 * a the CoP weight 0.5 over the gains' magnitude, r the rate weight over dt^2,
 * f the last total and w = 1e4 the dynamics weight, counted twice as
 * `ICPControllerQPSolver` l.748-772 submits it twice. Its stationary point
 * gives a c = 10 m and s = (r f + 2 w e / k) / (10 a / (a + 10) + r + 2 w /
 * k^2).
 */
export function test_unit_engine_physics_physical_icp_controller_feedback(): void {
  const omega: number = Math.sqrt(9.81 / 0.9);
  const dt: number = 0.004;
  const zulu = physicalIcpController.ZULU;
  const run = (
    desiredVelocity: { x: number; y: number },
    error: { x: number; y: number },
    state: physicalIcpController.IState = physicalIcpController.create(),
    parameters: Partial<physicalIcpController.IParameters> = {},
  ): physicalIcpController.IResult =>
    physicalIcpController({
      state,
      support: [
        { x: -1, y: -1 },
        { x: 1, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
      ],
      desired: { x: 0.1, y: -0.05 },
      desiredVelocity,
      capture: { x: 0.1 + error.x, y: -0.05 + error.y },
      center: { x: 0.1, y: -0.05 },
      omega,
      dt,
      parameters,
    });
  const total = (
    e: number,
    k: number,
    magnitude: number,
    rate: number = zulu.rateWeight,
    last: number = 0,
  ): { s: number; c: number; m: number } => {
    const a: number = zulu.forwardWeight / magnitude;
    const r: number = rate / (dt * dt);
    const w: number = zulu.dynamicsWeight;
    const s: number =
      (r * last + (2 * w * e) / k) /
      ((zulu.cmpWeight * a) / (a + zulu.cmpWeight) + r + (2 * w) / (k * k));
    return {
      s,
      c: (zulu.cmpWeight * s) / (a + zulu.cmpWeight),
      m: (a * s) / (a + zulu.cmpWeight),
    };
  };
  const close = (title: string, actual: number, expected: number): void =>
    TestValidator.predicate(
      `${title}: ${actual} vs ${expected}`,
      Math.abs(actual - expected) <= 1e-9 * Math.max(1e-3, Math.abs(expected)),
    );
  const moving: number = Math.hypot(1 + zulu.kpParallel, 1 + zulu.kpOrthogonal);
  const resting: number = Math.sqrt(2) * (1 + zulu.kpOrthogonal);

  // 1. Forward: k = 1 + K_p parallel.
  const forward: physicalIcpController.IResult = run(
    { x: 0.2, y: 0 },
    { x: 0.01, y: 0 },
  );
  const f = total(0.01, 1 + zulu.kpParallel, moving);
  close("forward dCoP", forward.state.copDelta.x, f.c);
  close("forward dCMP", forward.state.cmpDelta.x, f.m);
  TestValidator.predicate(
    "forward total is K e within the regularization",
    Math.abs(f.s / 0.01 - 3.5) < 1e-3,
  );
  TestValidator.equals(
    "forward lateral",
    [forward.state.copDelta.y, forward.state.cmpDelta.y],
    [0, 0],
  );
  const feedForward: number = 0.1 - 0.2 / omega;
  close("forward CoP", forward.cop.x, feedForward + f.c);
  close("forward CMP", forward.cmp.x, feedForward + f.c + f.m);
  TestValidator.equals("forward solved", forward.converged, true);

  // 2. Lateral: k = 1 + K_p orthogonal.
  const lateral: physicalIcpController.IResult = run(
    { x: 0.2, y: 0 },
    { x: 0, y: 0.01 },
  );
  const l = total(0.01, 1 + zulu.kpOrthogonal, moving);
  close("lateral dCoP", lateral.state.copDelta.y, l.c);
  close("lateral dCMP", lateral.state.cmpDelta.y, l.m);
  TestValidator.equals(
    "lateral forward",
    [lateral.state.copDelta.x, lateral.state.cmpDelta.x],
    [0, 0],
  );

  // 3. At rest: the orthogonal gain both ways.
  const rest: physicalIcpController.IResult = run(
    { x: 0, y: 0 },
    { x: 0.01, y: 0 },
  );
  const z = total(0.01, 1 + zulu.kpOrthogonal, resting);
  close("rest dCoP", rest.state.copDelta.x, z.c);
  close("rest dCMP", rest.state.cmpDelta.x, z.m);
  close("rest CoP", rest.cop.x, 0.1 + z.c);

  // 4. The rate weight pulls the total toward the last one.
  const last: physicalIcpController.IState = {
    ...physicalIcpController.create(),
    copDelta: { x: 0.02, y: 0 },
    cmpDelta: { x: 0.01, y: 0 },
  };
  const pulled: physicalIcpController.IResult = run(
    { x: 0.2, y: 0 },
    { x: 0.01, y: 0 },
    last,
    { rateWeight: 1e-4 },
  );
  const p = total(0.01, 1 + zulu.kpParallel, moving, 1e-4, 0.03);
  close("rate dCoP", pulled.state.copDelta.x, p.c);
  close("rate dCMP", pulled.state.cmpDelta.x, p.m);
  TestValidator.predicate(
    "rate pulls toward the last total",
    p.s > 0.03 && p.s < f.s - 1e-5,
  );
  const zuluLast: physicalIcpController.IResult = run(
    { x: 0.2, y: 0 },
    { x: 0.01, y: 0 },
    last,
  );
  TestValidator.predicate(
    "Zulu's rate weight barely holds",
    Math.abs(
      zuluLast.state.copDelta.x +
        zuluLast.state.cmpDelta.x -
        forward.state.copDelta.x -
        forward.state.cmpDelta.x,
    ) < 1e-6,
  );
}
