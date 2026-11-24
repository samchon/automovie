import { Quaternion, integrateAirborneRotation } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { qunit } from "../internal/qunit";

/**
 * A physical gyrostat's small world momentum includes cancellation between the
 * body's turn and relative spin, rather than a relative rate budget.
 *
 * The root-frame tensor is diag(1,2,1) kg m squared, relative momentum is
 * (0,-2,0) kg m squared per second and world momentum is (0.01,0,0). These
 * moments satisfy the inertia triangle inequalities: an ideal planar rotor
 * about Y has moments (1,2,1). Sorted principal moments (1,1,2) and an X
 * quarter-turn express that same tensor in the history.
 *
 * The exact solution is q(t)=Rx(0.01t) Ry(t), whose body rate is (0.01
 * cos(t),1,0.01 sin(t)). Thus I omega+h is (0.01 cos(t),0,0.01 sin(t)); Ry(t)
 * sends it to 0.01X and Rx leaves X unchanged. A 0.001 rad/s Y-rate error
 * instead adds 0.002 world momentum at zero: twenty times a one-percent budget
 * of the true 0.01 magnitude.
 *
 * Scenarios:
 *
 * 1. One integration uses the existing analytic rotation tests' 1e-10 local Q
 *    budget and the explicit physical momentum budget 0.01/(2+0.01). Actual
 *    orientations match the independent closed form within 1e-6 rad.
 * 2. Nineteen fixed interior instants observe actual dense body rates from q(t)'s
 *    local centered logarithmic difference at +/-1e-5 seconds. Rates meet the
 *    existing 1e-6 rad/s bound. Independent world rotation of
 *    (omega.x,2*omega.y-2,omega.z) conserves the declared 0.01X to 1%.
 * 3. A hand-derived public rate query on the same tensor/spin exposes the
 *    conditioning: momentum (0.01,0.002,0) needs rate (0.01,1.001,0). Completed
 *    playback does not query the history again.
 * 4. One spherical gyrostat has I=diag(2,2,2), declared relative spin2X and zero
 *    world momentum. Its exact rate is -X and q(t)=Rx(-t). An actual
 *    factory-issued tensor observes that numeric spin through its public
 *    mutable relative field. The public rate must reconstruct zero exactly, and
 *    actual integration must accept relative momentum budget 0.01 with
 *    absolute0. Independent dense orientation/rate observations retain 1e-6
 *    precision; their finite-difference roundoff is not asserted to be exactly
 *    zero physical error.
 *
 * These are two small numeric gyrostat models, not another Human fixture. Its
 * tight Q budget checks dense physics and the physical control's actual public
 * wiring; it does not prove that every incorrect normalization would fail, nor
 * that finite observations certify every intermediate instant. The unchanged
 * Human sample owns complete displayed-body read-back.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Derives realizable rotor tensors, relative-spin cancellation, nonzero/zero world-momentum solutions, principal frames, finite-difference precision, exact zero physical acceptance and their distinct coverage limits in four scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Integrates two declared physical histories through public momentumTolerance, reads actual dense orientations/rates and reconstructs world momentum independently. The zero case uses an actual unobserved factory tensor with explicitly authored numeric spin and checks exact diagonal division, actual zero-budget acceptance and playback history release without private imports.
 * @evidence contracts/development/testing.md#independent-expectations Differentiating Rx(0.01t) Ry(t) and rotating its declared diag(1,2,1) tensor gives constant0.01X. For I=2 identity and h=2X, I omega+h=0 requires exact omega=-X and q=Rx(-t); all scalars in -2/2 and 2*(-1)+2 are exactly representable. A shell diag(1,1.5,1.5) plus a rotor diag(1,0.5,0.5) spinning2rad/s realizes that spherical gyrostat. Numeric spin is an explicit model input, never inferred from an implementation output. Finite-difference rate observation retains1e-6 rather than manufacturing a nonzero absolute physical floor.
 * @evidence contracts/development/testing.md#distinguishing-cases Keeps the realizable anisotropic, small-nonzero, noncommuting control and adds one zero-world-momentum, spherical, canonical-axis counterspin. Actual factory factor ownership, explicit current relative spin, zero absolute budget, closed-form dense playback, positive derivative coverage and no history rereads distinguish exact cancellation from a normalized epsilon or an observer-roundoff false failure.
 * @evidence contracts/development/testing.md#execution-ownership One CPU unit owns the original numeric gyrostat and one added single-part factory tensor with declared numeric spin. It starts no runner/host, replaces no method, adds no Human or repeated law matrix and releases the added history in finally; representative Human input and bounds stay unchanged.
 */
export function test_engine_airborne_momentum_conditioning(): void {
  const findings: string[] = [];
  const epsilon: number = 1e-5;
  const limit: number = 1e-6;
  const instant: IAutoMovieIntegrateAirborneRotation.IInstant = {
    inertia: {
      moments: { x: 1, y: 1, z: 2 },
      rotation: { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
    },
    relative: { x: 0, y: -2, z: 0 },
  };
  let reads: number = 0;
  const history: IAutoMovieIntegrateAirborneRotation.IHistory = (
    _seconds: number,
  ): IAutoMovieIntegrateAirborneRotation.IInstant => {
    reads++;
    return instant;
  };
  const rate: IAutoMovieVector3 = integrateAirborneRotation.rate(instant, {
    x: 0.01,
    y: 0.002,
    z: 0,
  });
  if (
    !(
      nclose(rate.x, 0.01, 1e-12) &&
      nclose(rate.y, 1.001, 1e-12) &&
      nclose(rate.z, 0, 1e-12)
    )
  )
    findings.push("the actual tensor/spin did not give the hand-derived rate");
  const flight: IAutoMovieIntegrateAirborneRotation.IFlight =
    integrateAirborneRotation({
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
      Quaternion.inverse(origin),
      sample,
    );
    const sine: number = Math.hypot(q.x, q.y, q.z);
    const factor: number =
      (q.w < 0 ? -1 : 1) *
      (sine === 0 ? 2 : (2 * Math.atan2(sine, Math.abs(q.w))) / sine);
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
    if (!(qunit(q, 1e-12) && angle <= limit)) {
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
    if (!(rateError <= limit))
      findings.push(
        `gyrostat dense body-rate error ${rateError} at ${seconds}`,
      );

    // Explicit R(q) applies the declared body tensor and spin without the
    // production principal-axis reconstruction or its defect callback.
    const x: number = omega.x;
    const y: number = 2 * omega.y - 2;
    const z: number = omega.z;
    const world: IAutoMovieVector3 = {
      x:
        (1 - 2 * (q.y * q.y + q.z * q.z)) * x +
        2 * (q.x * q.y - q.z * q.w) * y +
        2 * (q.x * q.z + q.y * q.w) * z,
      y:
        2 * (q.x * q.y + q.z * q.w) * x +
        (1 - 2 * (q.x * q.x + q.z * q.z)) * y +
        2 * (q.y * q.z - q.x * q.w) * z,
      z:
        2 * (q.x * q.z - q.y * q.w) * x +
        2 * (q.y * q.z + q.x * q.w) * y +
        (1 - 2 * (q.x * q.x + q.y * q.y)) * z,
    };
    const error: number = Math.hypot(world.x - 0.01, world.y, world.z);
    if (!(error <= 0.01 * 0.01))
      findings.push(`gyrostat world-momentum error ${error} at ${seconds}`);
    observed++;
  }
  if (observed !== 19)
    findings.push(
      `only ${observed} of nineteen physical instants were observed`,
    );
  if (!(completedReads > 0 && reads === completedReads))
    findings.push("completed gyrostat playback reread its shape history");
  counterspin(findings, epsilon, limit, logarithm);
  TestValidator.equals(
    "dense gyrostat motion conserves its small world momentum",
    findings,
    [],
  );
}

/**
 * Separate exact zero-momentum admission from a finite-precision observer of
 * the known counterspin.
 */
function counterspin(
  findings: string[],
  epsilon: number,
  limit: number,
  logarithm: (
    origin: IAutoMovieQuaternion,
    sample: IAutoMovieQuaternion,
  ) => IAutoMovieVector3,
): void {
  const zero: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const model: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 1,
    segments: [
      {
        bone: "hips",
        mass: 1,
        point: zero,
        inertia: { x: 2, y: 2, z: 2 },
        axes: identity,
      },
    ],
  };
  const numeric: integrateAirborneRotation.ICachedHistory =
    integrateAirborneRotation.history(
      model,
      (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
        new Map([
          [
            "hips",
            {
              bone: "hips",
              localRotation: identity,
              worldPosition: zero,
              worldRotation: identity,
            },
          ],
        ]),
    );
  let reads: number = 0;

  // The geometry supplies the spherical tensor. Rotor spin is a declared
  // independent numeric gyrostat input through the existing mutable field.
  const history: IAutoMovieIntegrateAirborneRotation.IHistory = (
    seconds: number,
  ): IAutoMovieIntegrateAirborneRotation.IInstant => {
    reads++;
    const instant: IAutoMovieIntegrateAirborneRotation.IInstant =
      numeric(seconds);
    instant.relative = { x: 2, y: 0, z: 0 };
    return instant;
  };
  try {
    const rate: IAutoMovieVector3 = integrateAirborneRotation.rate(
      history(0),
      zero,
    );
    if (
      !(
        nclose(rate.x, -1, 0) &&
        nclose(rate.y, 0, 0) &&
        nclose(rate.z, 0, 0) &&
        nclose(2 * rate.x + 2, 0, 0)
      )
    )
      findings.push(
        `zero-momentum diagonal counterspin has wrong exact rate ${JSON.stringify(rate)}`,
      );
    let flight: IAutoMovieIntegrateAirborneRotation.IFlight;
    try {
      flight = integrateAirborneRotation({
        history,
        t0: 0,
        t1: 1,
        q0: identity,
        momentum: zero,
        h: 0.25,
        tolerance: { relative: 1e-10, absolute: 1e-10 },
        momentumTolerance: { relative: 0.01, absolute: 0 },
      });
    } catch (error) {
      findings.push(
        `exactly feasible zero-momentum counterspin failed physical acceptance: ${String(error)}`,
      );
      return;
    }
    const completed: number = reads;
    let observed: number = 0;
    for (let index: number = 0; index <= 20; index++) {
      const seconds: number = index / 20;
      const q: IAutoMovieQuaternion = flight.orientation(seconds);
      const expected: IAutoMovieQuaternion = {
        x: -Math.sin(seconds / 2),
        y: 0,
        z: 0,
        w: Math.cos(seconds / 2),
      };
      const angle: number = Quaternion.angle(q, expected);
      if (!(qunit(q, 1e-12) && angle <= limit))
        findings.push(
          `zero-momentum counterspin orientation error ${angle} at ${seconds}`,
        );
      if (index === 0 || index === 20) continue;
      const before: IAutoMovieQuaternion = flight.orientation(
        seconds - epsilon,
      );
      const after: IAutoMovieQuaternion = flight.orientation(seconds + epsilon);
      if (!(qunit(before, 1e-12) && qunit(after, 1e-12))) {
        findings.push(
          `zero-momentum counterspin derivative has a nonunit endpoint at ${seconds}`,
        );
        continue;
      }
      const low: IAutoMovieVector3 = logarithm(q, before);
      const high: IAutoMovieVector3 = logarithm(q, after);
      const error: number = Math.hypot(
        (high.x - low.x) / (2 * epsilon) + 1,
        (high.y - low.y) / (2 * epsilon),
        (high.z - low.z) / (2 * epsilon),
      );
      if (!(error <= limit))
        findings.push(
          `zero-momentum counterspin observed rate error ${error} at ${seconds}`,
        );
      observed++;
    }
    if (observed !== 19 || !(completed > 1 && reads === completed))
      findings.push(
        `zero-momentum counterspin lacks nineteen observations or rereads history: ${observed}, ${completed}, ${reads}`,
      );
  } catch (error) {
    findings.push(
      `zero-momentum counterspin public rate or observation failed: ${String(error)}`,
    );
  } finally {
    numeric.clear();
  }
}
