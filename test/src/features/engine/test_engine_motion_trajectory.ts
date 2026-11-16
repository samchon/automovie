import { Quaternion, integrateMotionTrajectory } from "@automovie/engine";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The engine's integrator solves an ODE to fourth order at its fixed step and reads the solution by time, the same whatever times are read and in whatever order.
 *
 * Scenarios:
 * 1. Exponential decay `x' = -x` and the harmonic oscillator `x'' = -x`, integrated at a sixtieth of a second over 2 s, match `e^-t` and `(cos t, -sin t)` within 1e-8 at 101 times, knots and between.
 * 2. Reading the oscillator at 200 times in a shuffled order gives the same bits as reading them sorted.
 * 3. Reading it at 24 and at 60 frames a second gives the same bits at the instants the two grids share.
 * 4. A torque-free axisymmetric rigid body (Euler's equations with I1 = I2 = 1 and I3 = 2): its body-frame angular velocity precesses about the symmetry axis at (I3 - I1) / I1 times its axial rate, within 1e-6 rad/s, and its orientation, advanced on the exponential map, stays unit within 1e-12.
 * 5. Halving the step changes the decay's value at 2 s by about sixteen times the change from halving it again, between 12 and 20, the ratio of a fourth-order method.
 * 6. Under error control, a tolerance of 1e-10 relative and absolute: the decay and the oscillator, read at 101 times through the pair's continuous extension, match their closed forms within the steps' summed budgets (each step's error within 2e-10 on a value at most one, summed over the steps of flows that never amplify an error), on fewer knots than the fixed grid's, the knots running from 0 to 2 exactly.
 * 7. The steps follow the right-hand side: a pulse of width 0.02 s at 1 s draws steps under a tenth of the shortest step away from it.
 * 8. The symmetric top of 4 under error control: the same precession within 1e-6 rad/s, the orientation unit within 1e-12 and within 1e-6 rad of the fixed step's at 41 times.
 * 9. One step of the decay at 0.4 s and at 0.2 s, taken whatever its error, read at its end and at its middle, equals the same step worked by hand from Hairer and Wanner's DOPRI5 code (its coefficients and its dense output, as MESA's port carries it) within 64 ε, the rounding of seven stages of at most seven products on values at most one; and the halving's observed orders, the nearest integers to the log-ratios of the errors, are 6 at the end, a fifth-order step's local error, and 5 at the middle, the fourth-order extension's.
 * 10. An interval that does not run forward, a step that is not positive, a rate of the wrong length and a zero tolerance are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Integrates known ODEs and reads the trajectories; a lower-order step, a misplaced last step, an interpolation that depends on the reading grid or order, an orientation that drifts off the unit sphere or turns at the wrong rate, a wrong tableau or continuous extension, a controller that ignores the right-hand side, or a malformed input integrated anyway is caught.
 * @evidence contracts/development/testing.md#independent-expectations The closed forms of linear ODEs; Euler's equations for a symmetric top, whose transverse rate turns at (I3 - I1) w3 / I1; the step-halving ratio 2^4 of a fourth-order global error; DOPRI5's step and dense output worked by hand from its source, and the observed orders 6 and 5 of a fifth-order step and a fourth-order extension; the error budget a tolerance sums to over non-expansive flows.
 * @evidence contracts/development/testing.md#distinguishing-cases A scalar and a two-vector state, with and without an orientation, knots and between, shuffled and sorted, two frame rates, three steps, fixed and controlled, smooth and pulsed, and the refusals; the towed ride that uses it belongs to `test_archetype_ride_towed_track`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of a pure engine function, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the ten scenarios and what each pins.
 */
export function test_engine_motion_trajectory(): void {
  const findings: string[] = [];

  // 1. Closed forms.
  const decay: integrateMotionTrajectory.ITrajectory =
    integrateMotionTrajectory({
      f: (
        _t: number,
        x: readonly number[],
      ): integrateMotionTrajectory.IRate => ({ dx: [-x[0]!] }),
      x0: [1],
      t0: 0,
      t1: 2,
    });
  const spring: integrateMotionTrajectory.ITrajectory =
    integrateMotionTrajectory({
      f: (
        _t: number,
        x: readonly number[],
      ): integrateMotionTrajectory.IRate => ({ dx: [x[1]!, -x[0]!] }),
      x0: [1, 0],
      t0: 0,
      t1: 2,
    });
  for (let k: number = 0; k <= 100; k++) {
    const t: number = (2 * k) / 100;
    if (Math.abs(decay.at(t).x[0]! - Math.exp(-t)) > 1e-8)
      findings.push(`decay at ${t}`);
    const s: number[] = spring.at(t).x;
    if (
      Math.abs(s[0]! - Math.cos(t)) > 1e-8 ||
      Math.abs(s[1]! + Math.sin(t)) > 1e-8
    )
      findings.push(`oscillator at ${t}`);
  }

  // 2. Order invariance.
  const times: number[] = Array.from(
    { length: 200 },
    (_: unknown, k: number): number => (2 * k) / 199,
  );
  const sorted: string = JSON.stringify(
    times.map((t: number): number[] => spring.at(t).x),
  );
  const order: number[] = times.map(
    (_: number, k: number): number => (k * 73) % 200,
  );
  const shuffled: number[][] = new Array<number[]>(200);
  for (const k of order) shuffled[k] = spring.at(times[k]!).x;
  if (JSON.stringify(shuffled) !== sorted)
    findings.push("reading order changes the values");

  // 3. Rate invariance: frames at 24 and at 60 a second meet every twelfth of a second.
  for (let k: number = 0; k <= 24; k++) {
    const a: number[] = spring.at((k * 2) / 24).x;
    const b: number[] = spring.at((k * 5) / 60).x;
    if (JSON.stringify(a) !== JSON.stringify(b))
      findings.push(`frame grids disagree at ${k / 12} s`);
  }

  // 4. A torque-free symmetric top.
  const i1: number = 1;
  const i3: number = 2;
  const axial: number = 3;
  const top: integrateMotionTrajectory.ITrajectory = integrateMotionTrajectory({
    f: (_t: number, w: readonly number[]): integrateMotionTrajectory.IRate => ({
      dx: [
        ((i1 - i3) / i1) * w[1]! * w[2]!,
        ((i3 - i1) / i1) * w[0]! * w[2]!,
        0,
      ],
      w: { x: w[0]!, y: w[1]!, z: w[2]! },
    }),
    x0: [0.5, 0, axial],
    q0: { x: 0, y: 0, z: 0, w: 1 },
    t0: 0,
    t1: 2,
  });
  const precession: number = ((i3 - i1) / i1) * axial;
  for (let k: number = 0; k <= 20; k++) {
    const t: number = (2 * k) / 20;
    const state: integrateMotionTrajectory.IState = top.at(t);
    const expected: [number, number] = [
      0.5 * Math.cos(precession * t),
      0.5 * Math.sin(precession * t),
    ];
    if (
      Math.abs(state.x[0]! - expected[0]) > 1e-6 ||
      Math.abs(state.x[1]! - expected[1]) > 1e-6
    )
      findings.push(`the top's rate at ${t}`);
    const q: IAutoMovieQuaternion = state.q!;
    if (k % 2 === 0 && Math.abs(Math.hypot(q.x, q.y, q.z, q.w) - 1) > 1e-12)
      findings.push(`the orientation leaves the unit sphere at ${t}`);
  }
  if (Quaternion.angle(top.at(0).q!, top.at(2).q!) === 0)
    findings.push("the top does not turn");

  // 5. Fourth order.
  const at2 = (h: number): number =>
    integrateMotionTrajectory({
      f: (
        _t: number,
        x: readonly number[],
      ): integrateMotionTrajectory.IRate => ({ dx: [-x[0]!] }),
      x0: [1],
      t0: 0,
      t1: 2,
      h,
    }).at(2).x[0]!;
  const ratio: number = (at2(0.2) - at2(0.1)) / (at2(0.1) - at2(0.05));
  if (!(ratio > 12 && ratio < 20)) findings.push(`halving ratio ${ratio}`);

  // 6. Error control: the closed forms within the steps' summed budgets.
  const tight: integrateMotionTrajectory.ITolerance = {
    relative: 1e-10,
    absolute: 1e-10,
  };
  const decayed: integrateMotionTrajectory.ITrajectory =
    integrateMotionTrajectory({
      f: (
        _t: number,
        x: readonly number[],
      ): integrateMotionTrajectory.IRate => ({ dx: [-x[0]!] }),
      x0: [1],
      t0: 0,
      t1: 2,
      tolerance: tight,
    });
  const sprung: integrateMotionTrajectory.ITrajectory =
    integrateMotionTrajectory({
      f: (
        _t: number,
        x: readonly number[],
      ): integrateMotionTrajectory.IRate => ({ dx: [x[1]!, -x[0]!] }),
      x0: [1, 0],
      t0: 0,
      t1: 2,
      tolerance: tight,
    });
  for (const [name, path] of [
    ["decay", decayed],
    ["oscillator", sprung],
  ] as const) {
    // Each step's error within absolute + relative × |x| <= 2e-10, summed over
    // the steps of a flow that never amplifies an error.
    const budget: number = (path.knots - 1) * (tight.absolute + tight.relative);
    for (let k: number = 0; k <= 100; k++) {
      const t: number = (2 * k) / 100;
      const x: number[] = path.at(t).x;
      const miss: number =
        name === "decay"
          ? Math.abs(x[0]! - Math.exp(-t))
          : Math.max(
              Math.abs(x[0]! - Math.cos(t)),
              Math.abs(x[1]! + Math.sin(t)),
            );
      if (!(miss <= budget)) {
        findings.push(`controlled ${name} at ${t}: ${miss} over ${budget}`);
        break;
      }
    }
    if (!(path.knots < spring.knots))
      findings.push(
        `controlled ${name} takes ${path.knots} knots, the fixed grid ${spring.knots}`,
      );
    if (path.times[0] !== 0 || path.times[path.times.length - 1] !== 2)
      findings.push(
        `controlled ${name}'s knots run ${path.times[0]} to ${path.times.at(-1)}`,
      );
  }

  // 7. The steps follow the right-hand side: a narrow pulse draws short steps.
  const pulsed: integrateMotionTrajectory.ITrajectory =
    integrateMotionTrajectory({
      f: (
        t: number,
        x: readonly number[],
      ): integrateMotionTrajectory.IRate => ({
        dx: [-x[0]! + 50 * Math.exp(-(((t - 1) / 0.02) ** 2))],
      }),
      x0: [1],
      t0: 0,
      t1: 2,
      tolerance: { relative: 1e-8, absolute: 1e-8 },
    });
  const spans: [number, number][] = pulsed.times
    .slice(1)
    .map((t: number, k: number): [number, number] => [
      pulsed.times[k]!,
      t - pulsed.times[k]!,
    ]);
  const near: number = Math.min(
    ...spans
      .filter(([a]: [number, number]): boolean => Math.abs(a - 1) < 0.05)
      .map(([, s]: [number, number]): number => s),
  );
  const far: number = Math.min(
    ...spans
      .filter(([a]: [number, number]): boolean => a < 0.5 || a > 1.5)
      .map(([, s]: [number, number]): number => s)
      .slice(1, -1),
  );
  if (!(near < far / 10))
    findings.push(
      `a pulse draws steps of ${near} s against ${far} s away from it`,
    );

  // 8. The symmetric top under error control.
  const controlled: integrateMotionTrajectory.ITrajectory =
    integrateMotionTrajectory({
      f: (
        _t: number,
        w: readonly number[],
      ): integrateMotionTrajectory.IRate => ({
        dx: [
          ((i1 - i3) / i1) * w[1]! * w[2]!,
          ((i3 - i1) / i1) * w[0]! * w[2]!,
          0,
        ],
        w: { x: w[0]!, y: w[1]!, z: w[2]! },
      }),
      x0: [0.5, 0, axial],
      q0: { x: 0, y: 0, z: 0, w: 1 },
      t0: 0,
      t1: 2,
      tolerance: tight,
    });
  for (let k: number = 0; k <= 40; k++) {
    const t: number = (2 * k) / 40;
    const state: integrateMotionTrajectory.IState = controlled.at(t);
    const expected: [number, number] = [
      0.5 * Math.cos(precession * t),
      0.5 * Math.sin(precession * t),
    ];
    if (
      Math.abs(state.x[0]! - expected[0]) > 1e-6 ||
      Math.abs(state.x[1]! - expected[1]) > 1e-6
    )
      findings.push(`the controlled top's rate at ${t}`);
    const q: IAutoMovieQuaternion = state.q!;
    if (Math.abs(Math.hypot(q.x, q.y, q.z, q.w) - 1) > 1e-12)
      findings.push(
        `the controlled orientation leaves the unit sphere at ${t}`,
      );
    if (Quaternion.angle(q, top.at(t).q!) > 1e-6)
      findings.push(
        `the controlled top turns ${Quaternion.angle(q, top.at(t).q!)} rad off the fixed one at ${t}`,
      );
  }

  // 9. The pair's orders: one step of the decay, accepted whatever its error.
  const once = (h: number): integrateMotionTrajectory.ITrajectory =>
    integrateMotionTrajectory({
      f: (
        _t: number,
        x: readonly number[],
      ): integrateMotionTrajectory.IRate => ({ dx: [-x[0]!] }),
      x0: [1],
      t0: 0,
      t1: h,
      h,
      tolerance: { relative: 0, absolute: 1 },
    });
  // The same step by hand from Hairer and Wanner's DOPRI5 (CDOPRI's `a` and
  // `d`, DOPCOR's dense terms and CONTD5), as MESA's port carries it:
  // https://mesastar.org/mesa/num/private/mod_dopri5.f.gcov.html
  const TA: readonly (readonly number[])[] = [
    [],
    [0.2],
    [3 / 40, 9 / 40],
    [44 / 45, -56 / 15, 32 / 9],
    [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
    [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656],
    [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84],
  ];
  const TD: readonly number[] = [
    -12715105075 / 11282082432,
    0,
    87487479700 / 32700410799,
    -10690763975 / 1880347072,
    701980252875 / 199316789632,
    -1453857185 / 822651844,
    69997945 / 29380423,
  ];
  const reference = (h: number, theta: number): number => {
    const k: number[] = [];
    for (const row of TA)
      k.push(
        -(
          1 +
          h *
            row.reduce(
              (s: number, a: number, j: number): number => s + a * k[j]!,
              0,
            )
        ),
      );
    const ydiff: number = -k[6]! - 1;
    const bspl: number = h * k[0]! - ydiff;
    const third: number = ydiff - h * k[6]! - bspl;
    const fourth: number =
      h *
      TD.reduce((s: number, d: number, j: number): number => s + d * k[j]!, 0);
    const rest: number = 1 - theta;
    return (
      1 + theta * (ydiff + rest * (bspl + theta * (third + rest * fourth)))
    );
  };
  // Seven stages of at most seven products on values at most one: each value
  // within 49 roundings of the other's, under 64 ε.
  const rounding: number = 64 * Number.EPSILON;
  for (const h of [0.4, 0.2])
    for (const theta of [1, 0.5]) {
      const read: number = once(h).at(theta * h).x[0]!;
      if (!(Math.abs(read - reference(h, theta)) <= rounding))
        findings.push(
          `one step of ${h} s read at ${theta} of it: ${read}, DOPRI5's ${reference(h, theta)}`,
        );
    }
  // The observed orders, the nearest integers to the halving's log-ratios.
  const observed = (theta: number): number =>
    Math.round(
      Math.log2(
        Math.abs(once(0.4).at(0.4 * theta).x[0]! - Math.exp(-0.4 * theta)) /
          Math.abs(once(0.2).at(0.2 * theta).x[0]! - Math.exp(-0.2 * theta)),
      ),
    );
  if (once(0.4).knots !== 2)
    findings.push(`one step takes ${once(0.4).knots - 1}`);
  if (observed(1) !== 6)
    findings.push(
      `a step's local error has the observed order ${observed(1)}, not 6`,
    );
  if (observed(0.5) !== 5)
    findings.push(
      `the mid-step read's error has the observed order ${observed(0.5)}, not 5`,
    );

  // 10. Refusals.
  for (const [name, props] of [
    [
      "a backward interval",
      {
        f: (): integrateMotionTrajectory.IRate => ({ dx: [0] }),
        x0: [0],
        t0: 1,
        t1: 0,
      },
    ],
    [
      "a zero step",
      {
        f: (): integrateMotionTrajectory.IRate => ({ dx: [0] }),
        x0: [0],
        t0: 0,
        t1: 1,
        h: 0,
      },
    ],
    [
      "a rate of the wrong length",
      {
        f: (): integrateMotionTrajectory.IRate => ({ dx: [0, 0] }),
        x0: [0],
        t0: 0,
        t1: 1,
      },
    ],
    [
      "a zero tolerance",
      {
        f: (): integrateMotionTrajectory.IRate => ({ dx: [0] }),
        x0: [0],
        t0: 0,
        t1: 1,
        tolerance: { relative: 0, absolute: 0 },
      },
    ],
  ] as const) {
    let threw: boolean = false;
    try {
      integrateMotionTrajectory(props);
    } catch {
      threw = true;
    }
    if (!threw) findings.push(`${name} is integrated`);
  }
  TestValidator.equals(
    "the integrator solves to fourth order and reads by time",
    findings,
    [],
  );
}
