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

import { nclose } from "../../../internal/nclose";
import { qclose } from "../../../internal/qclose";
import { qunit } from "../../../internal/qunit";
import { rotationLogarithm } from "../../../internal/rotationLogarithm";

/** Orientation agreement with a closed form, in radians. */
const ANGLE: number = 1e-6;

/** Body-rate agreement with a closed form, in rad/s. */
const RATE: number = 1e-6;

/** Offset of the centered difference that observes a dense body rate, in s. */
const OFFSET: number = 1e-5;

/** Agreement of a hand-derived rate to rounding. */
const ROUNDING: number = 1e-12;

/** The identity orientation. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** The centered body rate of an orientation curve at a time, in rad/s. */
const bodyRate: (
  flight: IAutoMovieIntegrateAirborneRotation.IFlight,
  seconds: number,
) => IAutoMovieVector3 = (
  flight: IAutoMovieIntegrateAirborneRotation.IFlight,
  seconds: number,
): IAutoMovieVector3 => {
  const origin: IAutoMovieQuaternion = flight.orientation(seconds);
  const low: IAutoMovieVector3 = rotationLogarithm(
    origin,
    flight.orientation(seconds - OFFSET),
  );
  const high: IAutoMovieVector3 = rotationLogarithm(
    origin,
    flight.orientation(seconds + OFFSET),
  );
  return {
    x: (high.x - low.x) / (2 * OFFSET),
    y: (high.y - low.y) / (2 * OFFSET),
    z: (high.z - low.z) / (2 * OFFSET),
  };
};

/**
 * `integrateAirborneRotation` turns a body by its conserved angular momentum
 * and its shape history, and reads the orientation and its sensitivities by
 * time.
 *
 * Scenarios:
 *
 * 1. A gyrostat of root-frame tensor diag(1, 2, 1) with relative momentum (0, -2,
 *    0) and world momentum (0.01, 0, 0) has the exact motion q(t) = Rx(0.01 t)
 *    Ry(t) and body rate (0.01 cos t, 1, 0.01 sin t): orientations agree within
 *    1e-6 rad at 21 instants, body rates at 19 interior instants, and the
 *    tensor and spin carry the declared world momentum to 1% of 0.01 (I omega +
 *    h is (0.01 cos t, 0, 0.01 sin t), and Ry(t) sends it to 0.01 X).
 * 2. The same tensor and spin queried for world momentum (0.01, 0.002, 0) need the
 *    rate (0.01, 1.001, 0): the cancellation that a relative rate budget would
 *    miss. Completed playback reads the history no more.
 * 3. A spherical gyrostat I = 2 with spin 2 X and zero world momentum counter-
 *    turns exactly at -X, so q(t) = Rx(-t) and the rate query reads exactly
 *    -1.
 * 4. A body of tensor diag(2, 3, 4) and world momentum 2 X whose principal frame
 *    is rewritten in place from identity to Rz(pi) at t = 0.5, the same tensor,
 *    turns by q(t) = Rx(t) with X sensitivity t / 2 at eleven shuffled instants
 *    whether fixed or adaptive, with no reread after completion.
 */
export function test_unit_engine_motion_integrate_airborne_rotation(): void {
  const spin: IAutoMovieIntegrateAirborneRotation.IInstant = {
    inertia: {
      moments: { x: 1, y: 1, z: 2 },
      rotation: { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
    },
    relative: { x: 0, y: -2, z: 0 },
  };
  let reads: number = 0;
  const flight: IAutoMovieIntegrateAirborneRotation.IFlight =
    integrateAirborneRotation({
      history: (): IAutoMovieIntegrateAirborneRotation.IInstant => {
        ++reads;
        return spin;
      },
      t0: 0,
      t1: 1,
      q0: IDENTITY,
      momentum: { x: 0.01, y: 0, z: 0 },
      h: 0.25,
      tolerance: { relative: 1e-10, absolute: 1e-10 },
      momentumTolerance: { relative: 0.01 / (2 + 0.01), absolute: 0 },
    });
  const completed: number = reads;
  let orientations: boolean = true;
  let rates: boolean = true;
  let momentum: boolean = true;
  for (let step: number = 0; step <= 20; ++step) {
    const t: number = step / 20;
    const q: IAutoMovieQuaternion = flight.orientation(t);
    const a: number = 0.005 * t;
    const b: number = 0.5 * t;
    orientations &&=
      qunit(q, 1e-12) &&
      Quaternion.angle(q, {
        x: Math.sin(a) * Math.cos(b),
        y: Math.cos(a) * Math.sin(b),
        z: Math.sin(a) * Math.sin(b),
        w: Math.cos(a) * Math.cos(b),
      }) <= ANGLE;
    if (step === 0 || step === 20) continue;
    const omega: IAutoMovieVector3 = bodyRate(flight, t);
    rates &&=
      Math.hypot(
        omega.x - 0.01 * Math.cos(t),
        omega.y - 1,
        omega.z - 0.01 * Math.sin(t),
      ) <= RATE;
    const world: IAutoMovieVector3 = Quaternion.rotateVector(q, {
      x: omega.x,
      y: 2 * omega.y - 2,
      z: omega.z,
    });
    momentum &&= Math.hypot(world.x - 0.01, world.y, world.z) <= 0.01 * 0.01;
  }
  TestValidator.predicate("gyrostat orientations", orientations);
  TestValidator.predicate("gyrostat body rates", rates);
  TestValidator.predicate("gyrostat world momentum", momentum);
  const needed: IAutoMovieVector3 = integrateAirborneRotation.rate(spin, {
    x: 0.01,
    y: 0.002,
    z: 0,
  });
  TestValidator.predicate(
    "the rate that the cancellation needs",
    nclose(needed.x, 0.01, ROUNDING) &&
      nclose(needed.y, 1.001, ROUNDING) &&
      nclose(needed.z, 0, ROUNDING) &&
      reads === completed,
  );
  TestValidator.predicate("counterspin", counterspin());
  TestValidator.predicate("a principal frame rewritten in place", frames());
  TestValidator.predicate(
    "sensitivities of an isotropic body",
    sensitivities(),
  );
}

/** The spherical counterspin of scenario 3. */
function counterspin(): boolean {
  const model: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 1,
    segments: [
      {
        bone: "hips",
        mass: 1,
        point: { x: 0, y: 0, z: 0 },
        inertia: { x: 2, y: 2, z: 2 },
        axes: IDENTITY,
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
              localRotation: IDENTITY,
              worldPosition: { x: 0, y: 0, z: 0 },
              worldRotation: IDENTITY,
            },
          ],
        ]),
    );
  const history: IAutoMovieIntegrateAirborneRotation.IHistory = (
    seconds: number,
  ): IAutoMovieIntegrateAirborneRotation.IInstant => {
    const instant: IAutoMovieIntegrateAirborneRotation.IInstant =
      numeric(seconds);
    instant.relative = { x: 2, y: 0, z: 0 };
    return instant;
  };
  try {
    const rate: IAutoMovieVector3 = integrateAirborneRotation.rate(history(0), {
      x: 0,
      y: 0,
      z: 0,
    });
    const flight: IAutoMovieIntegrateAirborneRotation.IFlight =
      integrateAirborneRotation({
        history,
        t0: 0,
        t1: 1,
        q0: IDENTITY,
        momentum: { x: 0, y: 0, z: 0 },
        h: 0.25,
        tolerance: { relative: 1e-10, absolute: 1e-10 },
        momentumTolerance: { relative: 0.01, absolute: 0 },
      });
    let holds: boolean = rate.x === -1 && rate.y === 0 && rate.z === 0;
    for (let step: number = 0; step <= 20; ++step) {
      const t: number = step / 20;
      holds &&=
        Quaternion.angle(flight.orientation(t), {
          x: -Math.sin(t / 2),
          y: 0,
          z: 0,
          w: Math.cos(t / 2),
        }) <= ANGLE;
      if (step === 0 || step === 20) continue;
      const omega: IAutoMovieVector3 = bodyRate(flight, t);
      holds &&= Math.hypot(omega.x + 1, omega.y, omega.z) <= RATE;
    }
    return holds;
  } finally {
    numeric.clear();
  }
}

/** The in-place principal frame rewrite of scenario 4. */
function frames(): boolean {
  let holds: boolean = true;
  for (const adaptive of [false, true]) {
    const frame: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
    let before: number = 0;
    let after: number = 0;
    const flight: IAutoMovieIntegrateAirborneRotation.IFlight =
      integrateAirborneRotation({
        history: (
          seconds: number,
        ): IAutoMovieIntegrateAirborneRotation.IInstant => {
          const turned: boolean = seconds >= 0.5;
          if (turned) ++after;
          else ++before;
          frame.z = turned ? 1 : 0;
          frame.w = turned ? 0 : 1;
          return {
            inertia: { moments: { x: 2, y: 3, z: 4 }, rotation: frame },
            relative: { x: 0, y: 0, z: 0 },
          };
        },
        t0: 0,
        t1: 1,
        q0: IDENTITY,
        momentum: { x: 2, y: 0, z: 0 },
        variations: [{ x: 1, y: 0, z: 0 }],
        h: 1 / 60,
        ...(adaptive
          ? { tolerance: { relative: 1e-10, absolute: 1e-10 } }
          : {}),
      });
    const completed: number = before + after;
    holds &&= before > 0 && after > 0;
    frame.x = 1;
    frame.y = 0;
    frame.z = 0;
    frame.w = 0;
    for (const index of [10, 0, 7, 3, 9, 1, 5, 2, 8, 4, 6]) {
      const t: number = index / 10;
      const shown: IAutoMovieQuaternion = flight.orientation(t);
      const tangent: IAutoMovieVector3 = flight.variations(t)[0]!;
      holds &&=
        qunit(shown, 1e-12) &&
        qclose(
          shown,
          { x: Math.sin(t / 2), y: 0, z: 0, w: Math.cos(t / 2) },
          1e-12,
        ) &&
        nclose(tangent.x, t / 2, RATE) &&
        nclose(tangent.y, 0, RATE) &&
        nclose(tangent.z, 0, RATE);
    }
    holds &&= before + after === completed;
  }
  return holds;
}

/** The body-frame sensitivities of scenario 5. */
function sensitivities(): boolean {
  let holds: boolean = true;
  for (const adaptive of [false, true]) {
    const flight: IAutoMovieIntegrateAirborneRotation.IFlight =
      integrateAirborneRotation({
        history: (): IAutoMovieIntegrateAirborneRotation.IInstant => ({
          inertia: { moments: { x: 2, y: 2, z: 2 }, rotation: IDENTITY },
          relative: { x: 0, y: 0, z: 0 },
        }),
        t0: 0,
        t1: 1,
        q0: IDENTITY,
        momentum: { x: 3, y: 0, z: 0 },
        variations: [
          { x: 1, y: 0, z: 0 },
          { x: 0, y: 1, z: 0 },
          { x: 0, y: 0, z: 1 },
        ],
        h: 1 / 60,
        ...(adaptive ? { tolerance: { relative: 1e-10, absolute: 0 } } : {}),
      });
    for (let step: number = 0; step <= 10; ++step) {
      const t: number = step / 10;
      const sine: number = Math.sin(1.5 * t);
      const cosine: number = Math.cos(1.5 * t);
      const tangents: readonly IAutoMovieVector3[] = flight.variations(t);
      const expected: readonly IAutoMovieVector3[] = [
        { x: t / 2, y: 0, z: 0 },
        { x: 0, y: sine / 3, z: (cosine - 1) / 3 },
        { x: 0, y: (1 - cosine) / 3, z: sine / 3 },
      ];
      holds &&= expected.every(
        (want: IAutoMovieVector3, index: number): boolean =>
          nclose(tangents[index]!.x, want.x, RATE) &&
          nclose(tangents[index]!.y, want.y, RATE) &&
          nclose(tangents[index]!.z, want.z, RATE),
      );
    }
  }
  return holds;
}
