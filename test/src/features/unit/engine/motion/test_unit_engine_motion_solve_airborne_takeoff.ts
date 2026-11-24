import {
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  solveAirborneTakeoff,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieSolveAirborneTakeoff,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";

/**
 * Airborne shooting lands a full turn, respects momentum ceilings and avoids
 * repeating an equivalent solve.
 *
 * Scenarios:
 *
 * 1. A one-turn isotropic body has an independently known orientation and residual
 *    with unrestricted, half-turn and zero momentum ceilings.
 * 2. The impossible zero-momentum request uses no more than one distinct
 *    evaluation per continuation stage and playback performs no fresh reads.
 * 3. A zero tolerance and a zero fixed step are refused, and the least positive
 *    tolerance under a zero momentum ceiling ends unmet after at most 1075 + 1
 *    history starts (the halvings that take a whole stage to zero, plus the
 *    seed's read), where a ceiling of nothing is never met.
 * 4. A tilted anisotropic principal axis gives a known feasible turn. Fixed and
 *    adaptive shooting land across two world frames, including a native
 *    single-part history and raw history readers.
 *
 * An isotropic body with I=2 kg m², no relative shape momentum and one second
 * in flight has q(t)=Rx(Lx t/2), so one somersault requires Lx=4 pi. Half that
 * ceiling permits at most half a turn. A zero ceiling admits only identity,
 * with a full-request miss of minus one revolution.
 *
 * The zero-ceiling query also owns a history-read counter. Halving the
 * requested revolution reaches the public angular tolerance after at most
 * ceil(log2(2 pi/tolerance)) failed stages. Each stage has only one distinct
 * physical momentum, plus one initial linearization history read; rejected
 * step-halving trials need no fresh integration of that same zero point. This
 * is a deterministic work bound, separate from physical tolerances.
 */
export function test_unit_engine_motion_solve_airborne_takeoff(): void {
  const complaints: string[] = [];
  isotropic(complaints);
  tilted(complaints);
  admissions(complaints);
  TestValidator.equals(
    "shooting preserves the physical request",
    complaints,
    [],
  );
}

/** Isotropic feasibility, published residual and exact-point work bound. */
function isotropic(complaints: string[]): void {
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const maximum of [Infinity, 2 * Math.PI, 0]) {
    let starts: number = 0;
    const history: IAutoMovieIntegrateAirborneRotation.IHistory = (
      seconds: number,
    ): IAutoMovieIntegrateAirborneRotation.IInstant => {
      if (seconds === 0) starts++;
      return {
        inertia: { moments: { x: 2, y: 2, z: 2 }, rotation: identity },
        relative: origin,
      };
    };
    const result: IAutoMovieSolveAirborneTakeoff.ISolution =
      solveAirborneTakeoff({
        history,
        t0: 0,
        t1: 1,
        q0: identity,
        somersault: 1,
        twist: 0,
        maximum,
        h: 1 / 60,
      });
    const work: number = starts;
    if (result.met !== (maximum === Infinity))
      complaints.push(`ceiling ${maximum}: met ${result.met}`);
    if (!(Vector3.length(result.momentum) <= maximum))
      complaints.push(`ceiling ${maximum}: momentum escaped its ball`);
    if (
      maximum === Infinity &&
      !(
        Math.abs(result.momentum.x - 4 * Math.PI) <=
        2 * solveAirborneTakeoff.TOLERANCE
      )
    )
      complaints.push(`one somersault needs 4 pi, got ${result.momentum.x}`);
    if (!(Math.hypot(result.momentum.y, result.momentum.z) <= 1e-9))
      complaints.push(
        `isotropic somersault has transverse momentum ${JSON.stringify(result.momentum)}`,
      );
    for (let k: number = 0; k <= 10; k++) {
      const t: number = k / 10;
      const expected: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 1, y: 0, z: 0 },
        (result.momentum.x * t * 90) / Math.PI,
      );
      if (!(Quaternion.angle(result.flight.orientation(t), expected) <= 1e-6))
        complaints.push(
          `ceiling ${maximum}: actual attitude off its isotropic closed form at ${t}`,
        );
    }
    const fullMiss: number = result.momentum.x / (4 * Math.PI) - 1;
    if (
      !(
        Math.abs(result.residual.somersault - fullMiss) <=
        solveAirborneTakeoff.TOLERANCE / (2 * Math.PI)
      )
    )
      complaints.push(
        `ceiling ${maximum}: residual ${result.residual.somersault}, actual full-request miss ${fullMiss}`,
      );
    if (maximum === 0) {
      const stages: number = Math.ceil(
        Math.log2((2 * Math.PI) / solveAirborneTakeoff.TOLERANCE),
      );
      if (!(work > 0 && work <= stages + 1))
        complaints.push(
          `one distinct zero point per stage: ${work} start reads, bound ${stages + 1}`,
        );
    }
    if (starts !== work)
      complaints.push("playback reevaluated the released shooting history");
  }
}

/**
 * Check the nonlinear correction when the requested lateral axis differs from
 * the independently feasible turn axis. With moments (1,2,3) and principal
 * frame Rz(20°), a=Rz(20°)X gives L=2πa for one second. The long axis's YZ
 * ellipse encloses the origin because 20° is below 45°.
 */
function tilted(complaints: string[]): void {
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const moments: IAutoMovieVector3 = { x: 1, y: 2, z: 3 };
  const principal: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 0, y: 0, z: 1 },
    20,
  );
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(principal, {
    x: 1,
    y: 0,
    z: 0,
  });
  const history: IAutoMovieIntegrateAirborneRotation.IHistory =
    (): IAutoMovieIntegrateAirborneRotation.IInstant => ({
      inertia: { moments, rotation: principal },
      relative: origin,
    });
  const model: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 1,
    segments: [
      {
        bone: "hips",
        mass: 1,
        point: origin,
        inertia: moments,
        axes: identity,
      },
    ],
  };
  const native: integrateAirborneRotation.ICachedHistory =
    integrateAirborneRotation.history(
      model,
      (): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
        new Map([
          [
            "hips",
            {
              bone: "hips",
              localRotation: identity,
              worldPosition: origin,
              worldRotation: principal,
            },
          ],
        ]),
    );
  // The flight pass's adaptive integration budget, with zero absolute tolerance.
  const precision: NonNullable<
    IAutoMovieIntegrateAirborneRotation.IProps["tolerance"]
  > = { relative: 0.005, absolute: 0 };
  try {
    for (const q0 of [
      identity,
      Quaternion.fromAxisAngle({ x: 1, y: 2, z: 3 }, 97),
    ])
      for (const adaptive of [false, true]) {
        const selected: IAutoMovieIntegrateAirborneRotation.IHistory =
          adaptive && q0 === identity ? native : history;
        const known: IAutoMovieIntegrateAirborneRotation.IFlight =
          integrateAirborneRotation({
            history: selected,
            t0: 0,
            t1: 1,
            q0,
            momentum: Quaternion.rotateVector(
              q0,
              Vector3.scale(axis, 2 * Math.PI),
            ),
            ...(adaptive ? { tolerance: precision } : {}),
          });
        const solved: IAutoMovieSolveAirborneTakeoff.ISolution =
          solveAirborneTakeoff({
            history: selected,
            t0: 0,
            t1: 1,
            q0,
            somersault: 1,
            twist: 0,
            ...(adaptive ? { integration: precision } : {}),
          });
        const world: string =
          q0 === identity ? "identity world" : "rotated world";
        for (const [label, flight] of [
          ["known", known],
          ["solved", solved.flight],
        ] as const) {
          const winding: number = turns(flight, q0);
          const landing: number = Quaternion.angle(q0, flight.orientation(1));
          const tolerance: number = solveAirborneTakeoff.TOLERANCE;
          if (
            !(
              Math.abs(winding - 2 * Math.PI) <= tolerance &&
              landing <= tolerance
            )
          )
            complaints.push(
              `tilted ${label}, ${world}, adaptive=${adaptive}: winding=${winding}, landing=${landing}`,
            );
        }
        if (!solved.met)
          complaints.push(
            `tilted ${world}, adaptive=${adaptive}: known-feasible request refused with ${JSON.stringify(solved.residual)}`,
          );
      }
  } finally {
    native.clear();
  }
}

/** Unwrap the observed long-axis direction in the takeoff's YZ plane. */
function turns(
  flight: IAutoMovieIntegrateAirborneRotation.IFlight,
  q0: IAutoMovieQuaternion,
): number {
  let winding: number = 0;
  let previous: number = 0;
  const inverse: IAutoMovieQuaternion = Quaternion.inverse(q0);
  // Two reads per 60 Hz display frame keep adjacent samples well within a half turn.
  const samples: number = 120;
  for (let k: number = 0; k <= samples; ++k) {
    const relative: IAutoMovieQuaternion = Quaternion.multiply(
      inverse,
      flight.orientation(k / samples),
    );
    const long: IAutoMovieVector3 = Quaternion.rotateVector(relative, {
      x: 0,
      y: 1,
      z: 0,
    });
    const angle: number = Math.atan2(long.z, long.y);
    const change: number = angle - previous;
    winding += change - 2 * Math.PI * Math.round(change / (2 * Math.PI));
    previous = angle;
  }
  return winding;
}

/** Refusals, and the bounded end of a request that no stage can meet. */
function admissions(complaints: string[]): void {
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const origin: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  let starts: number = 0;
  const history: IAutoMovieIntegrateAirborneRotation.IHistory = (
    seconds: number,
  ): IAutoMovieIntegrateAirborneRotation.IInstant => {
    if (seconds === 0) ++starts;
    return {
      inertia: { moments: { x: 2, y: 2, z: 2 }, rotation: identity },
      relative: origin,
    };
  };
  const shoot: (
    change: Partial<IAutoMovieSolveAirborneTakeoff.IProps>,
  ) => IAutoMovieSolveAirborneTakeoff.ISolution = (
    change: Partial<IAutoMovieSolveAirborneTakeoff.IProps>,
  ): IAutoMovieSolveAirborneTakeoff.ISolution =>
    solveAirborneTakeoff({
      history,
      t0: 0,
      t1: 1,
      q0: identity,
      somersault: 1,
      twist: 0,
      h: 1 / 60,
      ...change,
    });
  if (!throwsError((): unknown => shoot({ tolerance: 0 })))
    complaints.push("a zero tolerance was shot");
  if (!throwsError((): unknown => shoot({ h: 0 })))
    complaints.push("a zero fixed step was shot");
  starts = 0;
  const unmet: IAutoMovieSolveAirborneTakeoff.ISolution = shoot({
    tolerance: Number.MIN_VALUE,
    maximum: 0,
  });
  if (!(unmet.met === false && starts > 0 && starts <= 1075 + 1))
    complaints.push(
      `an underflowing share ended met=${unmet.met} after ${starts} starts`,
    );
}
