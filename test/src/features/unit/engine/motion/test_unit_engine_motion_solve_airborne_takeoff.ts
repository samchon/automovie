import {
  Quaternion,
  Vector3,
  integrateAirborneRotation,
  resolveAutoMovieCenterOfMass,
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

import {
  AIRBORNE_CORE,
  AIRBORNE_CORE_END_MASS,
} from "../../../internal/AIRBORNE_CORE";
import { airborneHumanLayout } from "../../../internal/airborneHumanLayout";
import { airbornePlaced } from "../../../internal/airbornePlaced";
import { airborneWinding } from "../../../internal/airborneWinding";
import type { IHumanFixture } from "../../../internal/fixtures/IHumanFixture";
import { humanFixture } from "../../../internal/fixtures/humanFixture";
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
 * is a deterministic work bound, separate from physical tolerances. 6. A tuck
 * between laid-out ends (three masses folding from 0.6 m to 0.25 m over [0.05,
 * 0.15] s and back over [0.51, 0.61] s of a 0.66 s flight) is solved for one
 * somersault at the planar closed form L = 2 pi / the integral of dt / I(t)
 * (the integral taken by the midpoint rule), with no momentum off the axis,
 * within a hundredth of L. 7. The stored average man in a layout (arms lowered
 * to the sides) lands one somersault with 0, 1 and 2 twists within 0.02
 * revolution on every axis, and a flight of a third of the time under 1.5 times
 * the plain momentum is a miss.
 */
export async function test_unit_engine_motion_solve_airborne_takeoff(): Promise<void> {
  const complaints: string[] = [];
  isotropic(complaints);
  tilted(complaints);
  admissions(complaints);
  ringPair(complaints);
  tuckBetweenEnds(complaints);
  await layout(complaints);
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
          const winding: number = airborneWinding(flight, q0);
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

/** The ring pair of scenario 5: I = 4 and a constant relative momentum X. */
function ringPair(complaints: string[]): void {
  const identity: IAutoMovieQuaternion = Quaternion.identity();
  const history: IAutoMovieIntegrateAirborneRotation.IHistory =
    (): IAutoMovieIntegrateAirborneRotation.IInstant => ({
      inertia: { moments: { x: 4, y: 4, z: 4 }, rotation: identity },
      relative: { x: 1, y: 0, z: 0 },
    });
  const integration: { relative: number; absolute: number } = {
    relative: 1e-10,
    absolute: 0,
  };
  const solution: IAutoMovieSolveAirborneTakeoff.ISolution =
    solveAirborneTakeoff({
      history,
      t0: 0,
      t1: 1,
      q0: identity,
      somersault: 1,
      twist: 0,
      integration,
    });
  if (
    !solution.met ||
    !(
      Math.abs(solution.momentum.x - (8 * Math.PI + 1)) <=
      4 * solveAirborneTakeoff.TOLERANCE
    ) ||
    !(Math.hypot(solution.momentum.y, solution.momentum.z) <= 1e-9)
  )
    complaints.push(
      `a turned ring pair needs (8 pi + 1) X, got ${JSON.stringify(solution.momentum)}`,
    );
  let winding: number = 0;
  let previous: number = 0;
  for (let step: number = 0; step <= 10; ++step) {
    const t: number = step / 10;
    const actual: IAutoMovieQuaternion = solution.flight.orientation(t);
    if (
      !(
        Quaternion.angle(
          actual,
          Quaternion.fromAxisAngle(
            { x: 1, y: 0, z: 0 },
            ((solution.momentum.x - 1) * t * 45) / Math.PI,
          ),
        ) <= 1e-6
      )
    )
      complaints.push(`the ring attitude misses its closed form at ${t}`);
    const up: IAutoMovieVector3 = Quaternion.rotateVector(actual, {
      x: 0,
      y: 1,
      z: 0,
    });
    const angle: number = Math.atan2(up.z, up.y);
    if (step > 0)
      winding += Math.atan2(
        Math.sin(angle - previous),
        Math.cos(angle - previous),
      );
    previous = angle;
  }
  if (!(Math.abs(winding - 2 * Math.PI) <= solveAirborneTakeoff.TOLERANCE))
    complaints.push(`the ring flight winds ${winding / (2 * Math.PI)} turns`);
  const miss: number = (solution.momentum.x - 1) / (8 * Math.PI) - 1;
  if (!(Math.abs(solution.residual.somersault - miss) <= 1e-6 / (2 * Math.PI)))
    complaints.push(
      `the residual ${solution.residual.somersault} is not the miss ${miss}`,
    );
}

/** Scenario 6: the planar closed form of a tuck between laid-out ends. */
function tuckBetweenEnds(complaints: string[]): void {
  const smooth: (u: number) => number = (u: number): number => {
    const c: number = Math.max(0, Math.min(1, u));
    return 10 * c ** 3 - 15 * c ** 4 + 6 * c ** 5;
  };
  const reach: (t: number) => number = (t: number): number =>
    0.6 - 0.35 * (smooth((t - 0.05) / 0.1) - smooth((t - 0.51) / 0.1));
  const inertia: (t: number) => number = (t: number): number =>
    1.2 + 2 * (0.02 + AIRBORNE_CORE_END_MASS * reach(t) ** 2);
  let inverse: number = 0;
  for (let index: number = 0; index < 20000; ++index)
    inverse += 0.66 / 20000 / inertia((0.66 * (index + 0.5)) / 20000);
  const planar: number = (2 * Math.PI) / inverse;
  const tucked: IAutoMovieSolveAirborneTakeoff.ISolution = solveAirborneTakeoff(
    {
      history: integrateAirborneRotation.history(
        AIRBORNE_CORE,
        (
          t: number,
        ): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
          airbornePlaced({
            hips: { x: 0, y: 0, z: 0 },
            head: { x: 0, y: reach(t), z: 0 },
            leftFoot: { x: 0, y: -reach(t), z: 0 },
          }),
      ),
      t0: 0,
      t1: 0.66,
      q0: Quaternion.identity(),
      somersault: 1,
      twist: 0,
    },
  );
  // The somersault angle is L times the integral, linear in L, so a residual
  // within the solver's tolerance bounds L's relative error by that many turns.
  const within: number = solveAirborneTakeoff.TOLERANCE / (2 * Math.PI);
  if (
    !tucked.met ||
    !(Math.abs(tucked.momentum.x - planar) <= within * planar) ||
    !(Math.hypot(tucked.momentum.y, tucked.momentum.z) <= within * planar)
  )
    complaints.push(
      `a tuck between laid-out ends: ${JSON.stringify(tucked.momentum)}, planar ${planar}`,
    );
}

/** Scenario 7: one somersault with twists for the stored average man. */
async function layout(complaints: string[]): Promise<void> {
  const person: IHumanFixture = await humanFixture("m-average");
  const model: IAutoMovieResolveCenterOfMass.IModel =
    resolveAutoMovieCenterOfMass(person.skeleton, person.profile);
  const shape: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    airborneHumanLayout(person)(0, 0);
  const history: IAutoMovieIntegrateAirborneRotation.IHistory =
    integrateAirborneRotation.history(model, () => shape);
  const request: (
    flight: number,
    twist: number,
    maximum?: number,
  ) => IAutoMovieSolveAirborneTakeoff.ISolution = (
    flight: number,
    twist: number,
    maximum?: number,
  ): IAutoMovieSolveAirborneTakeoff.ISolution =>
    solveAirborneTakeoff({
      history,
      t0: 0,
      t1: flight,
      q0: Quaternion.identity(),
      somersault: 1,
      twist,
      ...(maximum === undefined ? {} : { maximum }),
    });
  let plain: number = 0;
  for (const twist of [0, 1, 2]) {
    const solved: IAutoMovieSolveAirborneTakeoff.ISolution = request(1, twist);
    if (twist === 0) plain = Vector3.length(solved.momentum);
    const worst: number = Math.max(
      Math.abs(solved.residual.somersault),
      Math.abs(solved.residual.tilt),
      Math.abs(solved.residual.twist),
    );
    if (!(solved.met && worst <= 0.02))
      complaints.push(
        `one somersault with ${twist} twist(s): ${JSON.stringify(solved.residual)}`,
      );
  }
  if (request(1 / 3, 0, 1.5 * plain).met)
    complaints.push(
      "a third of the flight was met under 1.5 times the momentum",
    );
}
