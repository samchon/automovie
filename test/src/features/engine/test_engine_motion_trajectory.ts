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
 * 6. An interval that does not run forward, a step that is not positive, and a rate of the wrong length are refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Integrates known ODEs and reads the trajectories; a lower-order step, a misplaced last step, an interpolation that depends on the reading grid or order, an orientation that drifts off the unit sphere or turns at the wrong rate, or a malformed input integrated anyway is caught.
 * @evidence contracts/development/testing.md#independent-expectations The closed forms of linear ODEs; Euler's equations for a symmetric top, whose transverse rate turns at (I3 - I1) w3 / I1; the step-halving ratio 2^4 of a fourth-order global error.
 * @evidence contracts/development/testing.md#distinguishing-cases A scalar and a two-vector state, with and without an orientation, knots and between, shuffled and sorted, two frame rates, three steps, and the refusals; the towed ride that uses it belongs to `test_archetype_ride_towed_track`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of a pure engine function, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and what each pins.
 */
export function test_engine_motion_trajectory(): void {
  const findings: string[] = [];

  // 1. Closed forms.
  const decay: integrateMotionTrajectory.ITrajectory = integrateMotionTrajectory({
    f: (_t: number, x: readonly number[]): integrateMotionTrajectory.IRate => ({ dx: [-x[0]!] }),
    x0: [1],
    t0: 0,
    t1: 2,
  });
  const spring: integrateMotionTrajectory.ITrajectory = integrateMotionTrajectory({
    f: (_t: number, x: readonly number[]): integrateMotionTrajectory.IRate => ({ dx: [x[1]!, -x[0]!] }),
    x0: [1, 0],
    t0: 0,
    t1: 2,
  });
  for (let k: number = 0; k <= 100; k++) {
    const t: number = (2 * k) / 100;
    if (Math.abs(decay.at(t).x[0]! - Math.exp(-t)) > 1e-8) findings.push(`decay at ${t}`);
    const s: number[] = spring.at(t).x;
    if (Math.abs(s[0]! - Math.cos(t)) > 1e-8 || Math.abs(s[1]! + Math.sin(t)) > 1e-8)
      findings.push(`oscillator at ${t}`);
  }

  // 2. Order invariance.
  const times: number[] = Array.from({ length: 200 }, (_: unknown, k: number): number => (2 * k) / 199);
  const sorted: string = JSON.stringify(times.map((t: number): number[] => spring.at(t).x));
  const order: number[] = times.map((_: number, k: number): number => (k * 73) % 200);
  const shuffled: number[][] = new Array<number[]>(200);
  for (const k of order) shuffled[k] = spring.at(times[k]!).x;
  if (JSON.stringify(shuffled) !== sorted) findings.push("reading order changes the values");

  // 3. Rate invariance: frames at 24 and at 60 a second meet every twelfth of a second.
  for (let k: number = 0; k <= 24; k++) {
    const a: number[] = spring.at((k * 2) / 24).x;
    const b: number[] = spring.at((k * 5) / 60).x;
    if (JSON.stringify(a) !== JSON.stringify(b)) findings.push(`frame grids disagree at ${k / 12} s`);
  }

  // 4. A torque-free symmetric top.
  const i1: number = 1;
  const i3: number = 2;
  const axial: number = 3;
  const top: integrateMotionTrajectory.ITrajectory = integrateMotionTrajectory({
    f: (_t: number, w: readonly number[]): integrateMotionTrajectory.IRate => ({
      dx: [((i1 - i3) / i1) * w[1]! * w[2]!, ((i3 - i1) / i1) * w[0]! * w[2]!, 0],
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
    const expected: [number, number] = [0.5 * Math.cos(precession * t), 0.5 * Math.sin(precession * t)];
    if (Math.abs(state.x[0]! - expected[0]) > 1e-6 || Math.abs(state.x[1]! - expected[1]) > 1e-6)
      findings.push(`the top's rate at ${t}`);
    const q: IAutoMovieQuaternion = state.q!;
    if (k % 2 === 0 && Math.abs(Math.hypot(q.x, q.y, q.z, q.w) - 1) > 1e-12)
      findings.push(`the orientation leaves the unit sphere at ${t}`);
  }
  if (Quaternion.angle(top.at(0).q!, top.at(2).q!) === 0) findings.push("the top does not turn");

  // 5. Fourth order.
  const at2 = (h: number): number =>
    integrateMotionTrajectory({
      f: (_t: number, x: readonly number[]): integrateMotionTrajectory.IRate => ({ dx: [-x[0]!] }),
      x0: [1],
      t0: 0,
      t1: 2,
      h,
    }).at(2).x[0]!;
  const ratio: number = (at2(0.2) - at2(0.1)) / (at2(0.1) - at2(0.05));
  if (!(ratio > 12 && ratio < 20)) findings.push(`halving ratio ${ratio}`);

  // 6. Refusals.
  for (const [name, props] of [
    ["a backward interval", { f: (): integrateMotionTrajectory.IRate => ({ dx: [0] }), x0: [0], t0: 1, t1: 0 }],
    ["a zero step", { f: (): integrateMotionTrajectory.IRate => ({ dx: [0] }), x0: [0], t0: 0, t1: 1, h: 0 }],
    ["a rate of the wrong length", { f: (): integrateMotionTrajectory.IRate => ({ dx: [0, 0] }), x0: [0], t0: 0, t1: 1 }],
  ] as const) {
    let threw: boolean = false;
    try {
      integrateMotionTrajectory(props);
    } catch {
      threw = true;
    }
    if (!threw) findings.push(`${name} is integrated`);
  }
  TestValidator.equals("the integrator solves to fourth order and reads by time", findings, []);
}
