import { physicalIcpController } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../../internal/PhysicalTolerance";

/** The least size a relative bound scales from, metres: a millimetre. */
const SCALE: number = 1e-3;

/**
 * The least the rate weight must pull the total toward the last one, metres:
 * ten times the converged resolution of the program.
 */
const PULL: number = 10 * PhysicalTolerance.CONVERGED;

/**
 * The rounding of a few double operations on an integral of order 1e-5: half an
 * ulp there is under 1e-21, so a short chain stays under 1e-15.
 */
const INTEGRAL_ROUNDING: number = 1e-15;

/** A floor point on the controller's plane, metres. */
interface IPlane {
  x: number;
  y: number;
}

/** The capture point's natural frequency for a 0.9 m pendulum, 1/s. */
const OMEGA: number = Math.sqrt(9.81 / 0.9);

/** The controller's step, seconds. */
const DT: number = 0.004;

/** A square support of a half width about the origin. */
function square(half: number): IPlane[] {
  return [
    { x: -half, y: -half },
    { x: half, y: -half },
    { x: half, y: half },
    { x: -half, y: half },
  ];
}

/** Assert a value matches a closed form to the accumulated rounding of its size. */
function close(title: string, actual: number, expected: number): void {
  TestValidator.predicate(
    `${title}: ${actual} vs ${expected}`,
    Math.abs(actual - expected) <=
      PhysicalTolerance.ACCUMULATED * Math.max(SCALE, Math.abs(expected)),
  );
}

/**
 * `physicalIcpController` follows IHMC's ICP feedback program
 * (`ICPControllerHelper`, `ICPControllerQPSolver`, `ICPController`,
 * `AngularMomentumIntegrator`), with Zulu's weights.
 *
 * Along one axis with the motion frame aligned, the program's tasks are `1/2 a
 * c^2 + 1/2 10 m^2 + 1/2 r (s - f)^2 + 2 * 1/2 w (s / k - e)^2` with `s = c +
 * m` the total feedback, `a` the CoP weight 0.5 over the gains' magnitude, `r`
 * the rate weight over `dt^2`, `f` the last total and `w` the dynamics weight,
 * counted twice; its stationary point is `s = (r f + 2 w e / k) / (10 a / (a +
 * 10) + r + 2 w / k^2)` with `a c = 10 m`.
 *
 * Scenarios:
 *
 * 1. Unconstrained, a plan moving along +x: a forward error takes `k = 1 + 2.5`, a
 *    lateral one `k = 1 + 2.0`, and at rest both take `k = 1 + 2.0`, each split
 *    by the closed form; a rate weight of 1e-4 and a last total of 0.03 m pulls
 *    the total toward it by the closed form.
 * 2. Over a 4 cm square: a 5 cm forward error holds the centre of pressure at the
 *    edge less the 2 mm safe distance and puts the rest in the pivot's offset,
 *    so the pivot leaves the support; a 4 mm error stays inside; a diagonal one
 *    ends on the shrunk corner; no support leaves it free.
 * 3. An exactly zero error at rest fails the program once, sticks the integral at
 *    zero and holds the pivot on the capture point; a 1 mm error then solves
 *    and gathers `K_i dt e`; a moving plan clears the integral.
 */
export function test_unit_engine_physics_physical_icp_controller(): void {
  const zulu = physicalIcpController.ZULU;
  const run = (props: {
    error: IPlane;
    desiredVelocity?: IPlane;
    support?: IPlane[];
    state?: physicalIcpController.IState;
    parameters?: Partial<physicalIcpController.IParameters>;
    center?: IPlane;
  }): physicalIcpController.IResult =>
    physicalIcpController({
      state: props.state ?? physicalIcpController.create(),
      support: props.support ?? square(1),
      desired: { x: 0, y: 0 },
      desiredVelocity: props.desiredVelocity ?? { x: 0, y: 0 },
      capture: props.error,
      center: props.center ?? { x: 0, y: 0 },
      omega: OMEGA,
      dt: DT,
      ...(props.parameters === undefined
        ? {}
        : { parameters: props.parameters }),
    });
  const split = (
    e: number,
    k: number,
    magnitude: number,
    rate: number = zulu.rateWeight,
    last: number = 0,
  ): { s: number; c: number; m: number } => {
    const a: number = zulu.forwardWeight / magnitude;
    const r: number = rate / (DT * DT);
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
  const moving: number = Math.hypot(1 + zulu.kpParallel, 1 + zulu.kpOrthogonal);
  const resting: number = Math.sqrt(2) * (1 + zulu.kpOrthogonal);

  // 1. Unconstrained feedback.
  const along: IPlane = { x: 0.2, y: 0 };
  const forward = run({ error: { x: 0.01, y: 0 }, desiredVelocity: along });
  const f = split(0.01, 1 + zulu.kpParallel, moving);
  close("forward dCoP", forward.state.copDelta.x, f.c);
  close("forward dCMP", forward.state.cmpDelta.x, f.m);
  close("forward CoP", forward.cop.x, -0.2 / OMEGA + f.c);
  const lateral = run({ error: { x: 0, y: 0.01 }, desiredVelocity: along });
  const l = split(0.01, 1 + zulu.kpOrthogonal, moving);
  close("lateral dCoP", lateral.state.copDelta.y, l.c);
  close("lateral dCMP", lateral.state.cmpDelta.y, l.m);
  const rest = run({ error: { x: 0.01, y: 0 } });
  const z = split(0.01, 1 + zulu.kpOrthogonal, resting);
  close("rest dCoP", rest.state.copDelta.x, z.c);
  close("rest dCMP", rest.state.cmpDelta.x, z.m);
  const pulled = run({
    error: { x: 0.01, y: 0 },
    desiredVelocity: along,
    state: {
      ...physicalIcpController.create(),
      copDelta: { x: 0.02, y: 0 },
      cmpDelta: { x: 0.01, y: 0 },
    },
    parameters: { rateWeight: 1e-4 },
  });
  const p = split(0.01, 1 + zulu.kpParallel, moving, 1e-4, 0.03);
  close("rate dCoP", pulled.state.copDelta.x, p.c);
  close("rate dCMP", pulled.state.cmpDelta.x, p.m);
  TestValidator.predicate(
    "the rate pulls toward the last total",
    p.s > 0.03 && p.s < f.s - PULL,
  );

  // 2. The support constrains the centre of pressure.
  const half: number = 0.02;
  const k: number = 1 + zulu.kpOrthogonal;
  const r: number = zulu.rateWeight / (DT * DT);
  const w: number = 2 * zulu.dynamicsWeight;
  const a: number = zulu.forwardWeight / (Math.sqrt(2) * k);
  const edge: number = half - zulu.safeCopDistance;
  const bound = run({ error: { x: 0.05, y: 0 }, support: square(half) });
  close("bound CoP", bound.cop.x, edge);
  close(
    "bound dCMP",
    bound.state.cmpDelta.x,
    (-(r + w / (k * k)) * edge + (w / k) * 0.05) /
      (zulu.cmpWeight + r + w / (k * k)),
  );
  TestValidator.predicate("the pivot leaves the support", bound.cmp.x > half);
  const inside = run({ error: { x: 0.004, y: 0 }, support: square(half) });
  const s: number =
    ((w / k) * 0.004) /
    ((zulu.cmpWeight * a) / (a + zulu.cmpWeight) + r + w / (k * k));
  close(
    "inside CoP",
    inside.cop.x,
    (zulu.cmpWeight * s) / (a + zulu.cmpWeight),
  );
  const corner = run({ error: { x: 0.05, y: 0.05 }, support: square(half) });
  close("corner x", corner.cop.x, edge);
  close("corner y", corner.cop.y, edge);
  const free = run({ error: { x: 0.05, y: 0 }, support: [] });
  TestValidator.predicate("no support, no constraint", free.cop.x > half);

  // 3. A zero error and the integral.
  const first = run({ error: { x: 0, y: 0 }, support: square(0.5) });
  TestValidator.equals(
    "a zero error",
    [
      first.converged,
      first.state.failures,
      first.state.integrator.stuck,
      first.state.integrator.integral,
      first.cmp,
    ],
    [false, 1, true, { x: 0, y: 0 }, { x: 0, y: 0 }],
  );
  const second = run({
    error: { x: 0.001, y: 0 },
    support: square(0.5),
    state: first.state,
  });
  TestValidator.predicate(
    "the integral gathers",
    second.converged &&
      Math.abs(second.state.integrator.integral.x - 2.0 * DT * 0.001) < INTEGRAL_ROUNDING,
  );
  const third = run({
    error: { x: 0.001, y: 0 },
    support: square(0.5),
    state: second.state,
    desiredVelocity: { x: 0.1, y: 0 },
  });
  TestValidator.equals("a moving plan clears it", third.state.integrator, {
    stuck: false,
    integral: { x: 0, y: 0 },
  });
}
