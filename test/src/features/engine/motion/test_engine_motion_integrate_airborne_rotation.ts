import {
  Quaternion,
  Vector3,
  AutoMovieEngineMotionAirborneRotation,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AIRBORNE_CORE } from "../../internal/AIRBORNE_CORE";
import { AIRBORNE_CORE_END_MASS } from "../../internal/AIRBORNE_CORE_END_MASS";
import { airborneBodyRate } from "../../internal/airborneBodyRate";
import { airbornePlaced } from "../../internal/airbornePlaced";
import { airbornePrimitive } from "../../internal/airbornePrimitive";
import { airborneSensitivity } from "../../internal/airborneSensitivity";
import { airborneStillHistory } from "../../internal/airborneStillHistory";
import { airborneTuckReach } from "../../internal/airborneTuckReach";
import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";
import { qunit } from "../../internal/qunit";

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

/**
 * `AutoMovieEngineMotionAirborneRotation` turns a body by its conserved angular momentum
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
 * 5. The isotropic body I = 2 with world momentum (3, 0, 0), fixed step or 1e-10
 *    adaptive, in a rotated world with mixed momentum directions and inertia
 *    scaled by 1e-3, 1 and 1e3, keeps its orientation (world times Rx(1.5 t))
 *    and its body sensitivities (t / 2, 0, 0), (0, sin 1.5t / 3, (cos 1.5t - 1)
 *    / 3) and (0, (1 - cos 1.5t) / 3, sin 1.5t / 3), scaled inversely.
 * 6. A body of moments (1, 2, 3) with momentum 40 along each principal axis turns
 *    about it at L / I within 1e-6 rad at 21 instants.
 * 7. A three-mass body whose end masses move from 0.6 m to 0.25 m over [0.4, 0.6]
 *    s turns afterwards at the earlier rate times I_layout / I_tuck within 1e-4
 *    relative (momentum conserved).
 * 8. A rigid body of moments (1, 2, 3) with momentum 0.01 rad off the intermediate
 *    axis flips past 90 degrees before 2 ln(4 / eps) / lambda, returns within
 *    20 degrees and keeps its world momentum within 1e-3 (Yeadon 1993 Part I).
 */
export function test_engine_motion_integrate_airborne_rotation(): void {
  const spin: IAutoMovieIntegrateAirborneRotation.IInstant = {
    inertia: {
      moments: { x: 1, y: 1, z: 2 },
      rotation: { x: Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 },
    },
    relative: { x: 0, y: -2, z: 0 },
  };
  let reads: number = 0;
  const flight: IAutoMovieIntegrateAirborneRotation.IFlight =
    AutoMovieEngineMotionAirborneRotation.integrate({
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
  let observed: number = 0;
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
    ++observed;
    orientations &&=
      qunit(flight.orientation(t - OFFSET), 1e-12) &&
      qunit(flight.orientation(t + OFFSET), 1e-12);
    const omega: IAutoMovieVector3 = airborneBodyRate(flight, t, OFFSET);
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
  TestValidator.predicate(
    "gyrostat orientations",
    orientations && observed === 19,
  );
  TestValidator.predicate("gyrostat body rates", rates);
  TestValidator.predicate("gyrostat world momentum", momentum);
  const needed: IAutoMovieVector3 = AutoMovieEngineMotionAirborneRotation.rate(spin, {
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
  TestValidator.predicate("a rotated world, mixed basis and scale", scaled());
  TestValidator.predicate("a principal axis", principalAxes());
  TestValidator.predicate("a tuck raises the rate", tuck());
  TestValidator.predicate("the intermediate axis flips", flip());
}

/** The spherical counterspin of scenario 3. */
function counterspin(): boolean {
  const numeric: AutoMovieEngineMotionAirborneRotation.ICachedHistory =
    airborneStillHistory(
      airbornePrimitive([
        { bone: "hips", mass: 1, inertia: { x: 2, y: 2, z: 2 } },
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
    const rate: IAutoMovieVector3 = AutoMovieEngineMotionAirborneRotation.rate(history(0), {
      x: 0,
      y: 0,
      z: 0,
    });
    const flight: IAutoMovieIntegrateAirborneRotation.IFlight =
      AutoMovieEngineMotionAirborneRotation.integrate({
        history,
        t0: 0,
        t1: 1,
        q0: IDENTITY,
        momentum: { x: 0, y: 0, z: 0 },
        h: 0.25,
        tolerance: { relative: 1e-10, absolute: 1e-10 },
        momentumTolerance: { relative: 0.01, absolute: 0 },
      });
    let holds: boolean =
      rate.x === -1 && rate.y === 0 && rate.z === 0 && 2 * rate.x + 2 === 0;
    let observed: number = 0;
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
      ++observed;
      holds &&=
        qunit(flight.orientation(t - OFFSET), 1e-12) &&
        qunit(flight.orientation(t + OFFSET), 1e-12);
      const omega: IAutoMovieVector3 = airborneBodyRate(flight, t, OFFSET);
      holds &&= Math.hypot(omega.x + 1, omega.y, omega.z) <= RATE;
    }
    return holds && observed === 19;
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
      AutoMovieEngineMotionAirborneRotation.integrate({
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

/**
 * The rotated-world, mixed-basis, scaled cells of scenario 5, fixed and
 * adaptive.
 */
function scaled(): boolean {
  const units: readonly IAutoMovieVector3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 1, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];
  const turned: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 2, z: 3 },
    97,
  );
  const mixed: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 2, y: -1, z: 1 },
    53,
  );
  let holds: boolean = true;
  for (const world of [IDENTITY, turned])
    for (const basis of [IDENTITY, mixed])
      for (const scale of [1e-3, 1, 1e3])
        for (const adaptive of [false, true]) {
          const columns: IAutoMovieVector3[] = units.map(
            (unit: IAutoMovieVector3): IAutoMovieVector3 =>
              Quaternion.rotateVector(basis, unit),
          );
          const flight: IAutoMovieIntegrateAirborneRotation.IFlight =
            AutoMovieEngineMotionAirborneRotation.integrate({
              history: (): IAutoMovieIntegrateAirborneRotation.IInstant => ({
                inertia: {
                  moments: { x: 2 * scale, y: 2 * scale, z: 2 * scale },
                  rotation: IDENTITY,
                },
                relative: { x: 0, y: 0, z: 0 },
              }),
              t0: 0,
              t1: 1,
              q0: world,
              momentum: Quaternion.rotateVector(world, {
                x: 3 * scale,
                y: 0,
                z: 0,
              }),
              variations: columns.map(
                (column: IAutoMovieVector3): IAutoMovieVector3 =>
                  Quaternion.rotateVector(world, column),
              ),
              ...(adaptive
                ? { tolerance: { relative: 1e-10, absolute: 0 } }
                : {}),
            });
          for (let step: number = 0; step <= 10; ++step) {
            const t: number = step / 10;
            const angle: number = 1.5 * t;
            const expected: IAutoMovieVector3[] = airborneSensitivity(t);
            holds &&=
              Quaternion.angle(
                flight.orientation(t),
                Quaternion.multiply(
                  world,
                  Quaternion.fromAxisAngle(units[0]!, (angle * 180) / Math.PI),
                ),
              ) <= ANGLE;
            flight
              .variations(t)
              .forEach((value: IAutoMovieVector3, index: number): void => {
                const column: IAutoMovieVector3 = columns[index]!;
                const target: IAutoMovieVector3 = {
                  x:
                    expected[0]!.x * column.x +
                    expected[1]!.x * column.y +
                    expected[2]!.x * column.z,
                  y:
                    expected[0]!.y * column.x +
                    expected[1]!.y * column.y +
                    expected[2]!.y * column.z,
                  z:
                    expected[0]!.z * column.x +
                    expected[1]!.z * column.y +
                    expected[2]!.z * column.z,
                };
                holds &&=
                  Math.hypot(
                    scale * value.x - target.x,
                    scale * value.y - target.y,
                    scale * value.z - target.z,
                  ) <= ANGLE;
              });
          }
        }
  return holds;
}
/** Scenario 6: constant rate L / I about each principal axis. */
function principalAxes(): boolean {
  const moments: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
  const body: IAutoMovieResolveCenterOfMass.IModel = airbornePrimitive([
    { bone: "hips", mass: 1, inertia: moments },
  ]);
  const history: IAutoMovieIntegrateAirborneRotation.IHistory =
    airborneStillHistory(body);
  let holds: boolean = true;
  for (const axis of ["x", "y", "z"] as const) {
    const direction: IAutoMovieVector3 = {
      x: axis === "x" ? 1 : 0,
      y: axis === "y" ? 1 : 0,
      z: axis === "z" ? 1 : 0,
    };
    const flight: IAutoMovieIntegrateAirborneRotation.IFlight =
      AutoMovieEngineMotionAirborneRotation.integrate({
        history,
        t0: 0,
        t1: 1,
        q0: IDENTITY,
        momentum: Vector3.scale(direction, 40),
      });
    for (let step: number = 0; step <= 20; ++step) {
      const t: number = step / 20;
      holds &&=
        Quaternion.angle(
          flight.orientation(t),
          Quaternion.fromAxisAngle(
            direction,
            ((40 / moments[axis]) * t * 180) / Math.PI,
          ),
        ) <= ANGLE;
    }
  }
  return holds;
}

/** Scenario 7: the rate rises by I_layout / I_tuck after the tuck. */
function tuck(): boolean {
  const flight: IAutoMovieIntegrateAirborneRotation.IFlight =
    AutoMovieEngineMotionAirborneRotation.integrate({
      history: AutoMovieEngineMotionAirborneRotation.history(
        AIRBORNE_CORE,
        (
          t: number,
        ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
          airbornePlaced({
            hips: { x: 0, y: 0, z: 0 },
            head: { x: 0, y: airborneTuckReach(t), z: 0 },
            leftFoot: { x: 0, y: -airborneTuckReach(t), z: 0 },
          }),
      ),
      t0: 0,
      t1: 1,
      q0: IDENTITY,
      momentum: { x: 20, y: 0, z: 0 },
      h: 1 / 120,
    });
  const layout: number = 1.2 + 2 * (0.02 + AIRBORNE_CORE_END_MASS * 0.6 * 0.6);
  const tucked: number =
    1.2 + 2 * (0.02 + AIRBORNE_CORE_END_MASS * 0.25 * 0.25);
  const ratio: number =
    Vector3.length(airborneBodyRate(flight, 0.8, 0.01)) /
    Vector3.length(airborneBodyRate(flight, 0.2, 0.01)) /
    (layout / tucked);
  return Math.abs(ratio - 1) <= 1e-4;
}

/** Scenario 8: the flip of the intermediate axis, momentum conserved. */
function flip(): boolean {
  const body: IAutoMovieResolveCenterOfMass.IModel = airbornePrimitive([
    { bone: "hips", mass: 1, inertia: { x: 1, y: 2, z: 3 } },
  ]);
  const epsilon: number = 0.01;
  const w: number = 2 * Math.PI;
  const momentum: IAutoMovieVector3 = Vector3.scale(
    { x: Math.sin(epsilon), y: Math.cos(epsilon), z: 0 },
    2 * w,
  );
  const lambda: number = w * Math.sqrt((1 * 1) / (1 * 3));
  const bound: number = (2 * Math.log(4 / epsilon)) / lambda;
  const flight: IAutoMovieIntegrateAirborneRotation.IFlight =
    AutoMovieEngineMotionAirborneRotation.integrate({
      history: airborneStillHistory(body),
      t0: 0,
      t1: 3 * bound,
      q0: IDENTITY,
      momentum,
      h: 1 / 240,
    });
  let flipped: number | null = null;
  let returned: boolean = false;
  let drift: number = 0;
  for (let t: number = 0.02; t <= 3 * bound - 0.02; t += 0.01) {
    const q: IAutoMovieQuaternion = flight.orientation(t);
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(q, {
      x: 0,
      y: 1,
      z: 0,
    });
    const away: number =
      (Math.acos(Math.max(-1, Math.min(1, axis.y))) * 180) / Math.PI;
    if (flipped === null && away > 90) flipped = t;
    if (flipped !== null && t > flipped && away < 20) returned = true;
    const body: IAutoMovieVector3 = airborneBodyRate(flight, t, 1e-3);
    const world: IAutoMovieVector3 = Quaternion.rotateVector(q, {
      x: body.x,
      y: 2 * body.y,
      z: 3 * body.z,
    });
    drift = Math.max(
      drift,
      Vector3.length(Vector3.subtract(world, momentum)) /
        Vector3.length(momentum),
    );
  }
  return flipped !== null && flipped <= bound && returned && drift <= 1e-3;
}
