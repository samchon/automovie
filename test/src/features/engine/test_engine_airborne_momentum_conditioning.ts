import { Quaternion, integrateAirborneRotation } from "@automovie/engine";
import type { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { qunit } from "../internal/qunit";

/**
 * A physical gyrostat's small world momentum includes cancellation between
 * the body's turn and relative spin, rather than a relative rate budget.
 *
 * The root-frame tensor is diag(1,2,1) kg m squared, relative momentum is
 * (0,-2,0) kg m squared per second and world momentum is (0.01,0,0).
 * These moments satisfy the inertia triangle inequalities: an ideal planar
 * rotor about Y has moments (1,2,1). Sorted principal moments (1,1,2) and
 * an X quarter-turn express that same tensor in the history.
 *
 * The exact solution is q(t)=Rx(0.01t) Ry(t), whose body rate is
 * (0.01 cos(t),1,0.01 sin(t)). Thus I omega+h is
 * (0.01 cos(t),0,0.01 sin(t)); Ry(t) sends it to 0.01X and Rx leaves X
 * unchanged. A 0.001 rad/s Y-rate error instead adds 0.002 world momentum
 * at zero: twenty times a one-percent budget of the true 0.01 magnitude.
 *
 * Scenarios:
 * 1. One integration uses the existing analytic rotation tests' 1e-10 local
 *    Q budget and the explicit physical momentum budget 0.01/(2+0.01).
 *    Actual orientations match the independent closed form within 1e-6 rad.
 * 2. Nineteen fixed interior instants observe actual dense body rates from
 *    q(t)'s local centered logarithmic difference at +/-1e-5 seconds.
 *    Rates meet the existing 1e-6 rad/s bound. Independent world rotation
 *    of (omega.x,2*omega.y-2,omega.z) conserves the declared 0.01X to 1%.
 * 3. A hand-derived public rate query on the same tensor/spin exposes the
 *    conditioning: momentum (0.01,0.002,0) needs rate (0.01,1.001,0).
 *    Completed playback does not query the history again.
 *
 * This is a single deferred physical model, not another Human fixture.
 * Its tight Q budget checks dense physics and the physical control's actual
 * public wiring; it does not prove that every incorrect normalization would
 * fail, nor that finite observations certify every intermediate instant.
 * The unchanged Human sample remains the existing failing read-back control.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Derives the realizable rotor tensor, relative-spin cancellation, exact body/world solution, principal frame, finite-difference observer, original precision bounds, physical budget and explicit coverage limits.
 * @evidence contracts/development/testing.md#behavioral-verification Integrates one declared physical history through public momentumTolerance, reads actual dense orientations and rates, reconstructs world momentum independently and exercises the public rate's small-momentum conditioning without private imports.
 * @evidence contracts/development/testing.md#independent-expectations Differentiating Rx(0.01t) Ry(t) and rotating its explicitly declared diag(1,2,1) tensor gives constant 0.01X. Scalar balance independently gives the perturbed Y rate; no integrator stage, private defect ratio, alternate solver or output snapshot supplies the expected physics.
 * @evidence contracts/development/testing.md#distinguishing-cases A realizable anisotropic tensor, nonzero opposing relative spin, small nonzero total momentum, a nontrivial principal frame, noncommuting exact motion, positive fixed observation coverage, actual dense derivatives and no playback history reads distinguish rate-only assumptions and frame or dense-curve errors.
 * @evidence contracts/development/testing.md#execution-ownership One deferred CPU unit owns one pure gyrostat history and its observations, starts no runner or host, replaces no foreign method and changes neither representative Human input nor its bounds.
 */
export function test_engine_airborne_momentum_conditioning(): void {
  const findings: string[] = [];
  const epsilon: number = 1e-5;
  const limit: number = 1e-6;
  const instant: integrateAirborneRotation.IInstant = {
    inertia: {
      moments: { x: 1, y: 1, z: 2 },
      rotation: { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
    },
    relative: { x: 0, y: -2, z: 0 },
  };
  let reads: number = 0;
  const history: integrateAirborneRotation.IHistory =
    (_seconds: number): integrateAirborneRotation.IInstant => {
      reads++;
      return instant;
    };
  const rate: IAutoMovieVector3 = integrateAirborneRotation.rate(
    instant, { x: 0.01, y: 0.002, z: 0 },
  );
  if (!(nclose(rate.x, 0.01, 1e-12) && nclose(rate.y, 1.001, 1e-12) &&
    nclose(rate.z, 0, 1e-12)))
    findings.push("the actual tensor/spin did not give the hand-derived rate");
  const flight: integrateAirborneRotation.IFlight = integrateAirborneRotation({
    history,
    t0: 0,
    t1: 1,
    q0: { x: 0, y: 0, z: 0, w: 1 },
    momentum: { x: 0.01, y: 0, z: 0 },
    h: 0.25,
    tolerance: { relative: 1e-10, absolute: 1e-10 },
    momentumTolerance: { relative: 0.01 / (2 + 0.01), absolute: 0 },
  });
  const completedReads: number = reads;
  let observed: number = 0;

  /** A local rotation vector from actual orientations, up to quaternion sign. */
  function logarithm(
    origin: IAutoMovieQuaternion,
    sample: IAutoMovieQuaternion,
  ): IAutoMovieVector3 {
    const q: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.inverse(origin), sample,
    );
    const sine: number = Math.hypot(q.x, q.y, q.z);
    const factor: number = (q.w < 0 ? -1 : 1) *
      (sine === 0 ? 2 : 2 * Math.atan2(sine, Math.abs(q.w)) / sine);
    return { x: factor * q.x, y: factor * q.y, z: factor * q.z };
  }

  for (let k: number = 0; k <= 20; k++) {
    const seconds: number = k / 20;
    const q: IAutoMovieQuaternion = flight.orientation(seconds);
    const a: number = 0.005 * seconds;
    const b: number = 0.5 * seconds;
    const expected: IAutoMovieQuaternion = {
      x: Math.sin(a) * Math.cos(b),
      y: Math.cos(a) * Math.sin(b),
      z: Math.sin(a) * Math.sin(b),
      w: Math.cos(a) * Math.cos(b),
    };
    const angle: number = Quaternion.angle(q, expected);
    if (!(qunit(q, 1e-12) && Number.isFinite(angle) && angle <= limit)) {
      findings.push(`gyrostat orientation error ${angle} at ${seconds}`);
      continue;
    }
    if (k === 0 || k === 20) continue;
    const before: IAutoMovieQuaternion = flight.orientation(seconds - epsilon);
    const after: IAutoMovieQuaternion = flight.orientation(seconds + epsilon);
    if (!(qunit(before, 1e-12) && qunit(after, 1e-12))) {
      findings.push(`gyrostat derivative has a nonunit endpoint at ${seconds}`);
      continue;
    }
    const low: IAutoMovieVector3 = logarithm(q, before);
    const high: IAutoMovieVector3 = logarithm(q, after);
    const omega: IAutoMovieVector3 = {
      x: (high.x - low.x) / (2 * epsilon),
      y: (high.y - low.y) / (2 * epsilon),
      z: (high.z - low.z) / (2 * epsilon),
    };
    const rateError: number = Math.hypot(
      omega.x - 0.01 * Math.cos(seconds),
      omega.y - 1,
      omega.z - 0.01 * Math.sin(seconds),
    );
    if (!(Number.isFinite(rateError) && rateError <= limit))
      findings.push(`gyrostat dense body-rate error ${rateError} at ${seconds}`);

    // Explicit R(q) applies the declared body tensor and spin without the
    // production principal-axis reconstruction or its defect callback.
    const x: number = omega.x;
    const y: number = 2 * omega.y - 2;
    const z: number = omega.z;
    const world: IAutoMovieVector3 = {
      x: (1 - 2 * (q.y * q.y + q.z * q.z)) * x +
        2 * (q.x * q.y - q.z * q.w) * y +
        2 * (q.x * q.z + q.y * q.w) * z,
      y: 2 * (q.x * q.y + q.z * q.w) * x +
        (1 - 2 * (q.x * q.x + q.z * q.z)) * y +
        2 * (q.y * q.z - q.x * q.w) * z,
      z: 2 * (q.x * q.z - q.y * q.w) * x +
        2 * (q.y * q.z + q.x * q.w) * y +
        (1 - 2 * (q.x * q.x + q.y * q.y)) * z,
    };
    const error: number = Math.hypot(world.x - 0.01, world.y, world.z);
    if (!(Number.isFinite(error) && error <= 0.01 * 0.01))
      findings.push(`gyrostat world-momentum error ${error} at ${seconds}`);
    observed++;
  }
  if (observed !== 19)
    findings.push(`only ${observed} of nineteen physical instants were observed`);
  if (!(completedReads > 0 && reads === completedReads))
    findings.push("completed gyrostat playback reread its shape history");
  TestValidator.equals("dense gyrostat motion conserves its small world momentum", findings, []);
}
