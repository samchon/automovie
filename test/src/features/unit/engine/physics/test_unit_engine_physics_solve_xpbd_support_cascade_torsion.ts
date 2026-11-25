import {
  AutoMoviePhysicalTracking,
  AutoMovieXpbdArticulation,
  AutoMovieXpbdSupportRows,
  Quaternion,
  physicalStanceBalance,
  solveXpbdArticulationContacts,
  solveXpbdSupportCascade,
} from "@automovie/engine";
import type {
  IAutoMoviePhysicalJointAxis,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { PhysicalTolerance } from "../../../internal/PhysicalTolerance";

/**
 * The ground's moment about the vertical: a sole's torsional friction is an
 * inequality on its impulse, never a hold, so it carries the moment the task
 * asks within its points' cones; a foot entering the holds is bounded by its
 * entry share; and the trunk's heading servo returns without overshoot.
 *
 * Scenarios, on a free 10 kg rigid body whose centre of mass lies on its soles'
 * plane, each sole's four corners at (+-0.1, 0, +-0.05) m from its centre, mu =
 * 0.8, one 1/480 s substep under gravity and a yaw moment:
 *
 * 1. Four coplanar soles on one body, none able to turn about the vertical against
 *    the others, as a four-legged body's two-axis legs: their torsional rows
 *    would be one hold four times over, yet the program solves, every sole's
 *    moment within its bound, and the task's cancelling moment, -5 N m, leaves
 *    the body without spin (TSID `contact-6d.cpp`: friction an inequality on
 *    the corner forces).
 * 2. The same with the task asking no moment: the body turns under the 5 N m as a
 *    free body would, so the torsional rows hold nothing of their own.
 * 3. One sole asked to cancel 30 N m, past its bound mu (|r . t1| + |r . t2|) m g
 *    = 0.8 0.15 98.1 = 11.77 N m: its moment stops at the bound and the body
 *    slips, its spin positive but below the free spin.
 * 4. One sole coming down at 0.3 m/s as it touches again, its normal rows bounded
 *    at a quarter of its weight over the substep, adds no more than that
 *    whatever its hold would need (design-4017-qp3, Section 3, rule 3).
 * 5. The trunk's heading servo, the root task's yaw on its saturated error (Human
 *    gains 5 m and m, the pelvis's 0.2 kg m^2 in its stable PD, the whole
 *    body's 1.5 kg m^2 about the vertical, stated), turns a 10 degree heading
 *    error back to under 0.5 degree in 2 s without passing zero; a 30 degree
 *    error asks the same moment as one at the saturation limit.
 * 6. Capacity: four loaded corners of a 0.2 by 0.1 m sole hold mu times 4 (0.1 +
 *    0.05) per unit impulse about the normal; a patch pressed at one point, or
 *    with its lever points unloaded, holds none and so gets no torsional row,
 *    whose cone would be the single point zero (TSID `contact-6d.cpp`: moments
 *    only from the points' levers).
 * 7. A bound's room never goes below nothing: an impact the contact passes already
 *    gave past the bound is the floor's, not taken back through the other
 *    supports (Herzog et al. 2016, Section 5.3; unilateral contact).
 */
export function test_unit_engine_physics_solve_xpbd_support_cascade_torsion(): void {
  const findings: string[] = [];
  const h: number = 1 / 480;
  const mass: number = 10;
  const g: number = 9.81;
  const mu: number = 0.8;
  const bound: number = mu * (0.1 + 0.05) * mass * g;
  const four: IAutoMovieVector3[] = [
    { x: 0.35, y: 0, z: 0.3 },
    { x: -0.35, y: 0, z: 0.3 },
    { x: 0.35, y: 0, z: -0.3 },
    { x: -0.35, y: 0, z: -0.3 },
  ];
  const torsion = (program: IProgram, solution: number[]): number[] =>
    program.torsions.map((r: number): number => solution[r]!);

  // 1. Four soles that cannot turn apart solve, cancelling the moment.
  const cancelled: IProgram = program(four, 5, -5, 0, undefined);
  const solved: number[] | null = solve(cancelled);
  if (solved === null) findings.push("four soles on one body have no solution");
  else {
    const moments: number[] = torsion(cancelled, solved);
    const sum: number = moments.reduce(
      (a: number, b: number): number => a + b,
      0,
    );
    if (!(Math.abs(spin(cancelled, solved)) < PhysicalTolerance.ACCUMULATED))
      findings.push(
        `four soles leave the body spinning at ${spin(cancelled, solved)}`,
      );
    if (!(Math.abs(sum + 5 * h) < PhysicalTolerance.ACCUMULATED))
      findings.push(`four soles take ${sum / h} N m against 5`);
    for (const [i, moment] of moments.entries()) {
      const normal: number = cancelled.normals[i]!.reduce(
        (total: number, r: number): number => total + solved[r]!,
        0,
      );
      if (!(Math.abs(moment) <= mu * 0.15 * normal + PhysicalTolerance.ACCUMULATED))
        findings.push(`sole ${i} takes ${moment / h} N m past its bound`);
    }
  }

  // 2. Asked no moment, the body turns freely: no torsional hold.
  const free: IProgram = program(four, 5, 0, 0, undefined);
  const turned: number[] | null = solve(free);
  if (turned === null) findings.push("an unasked yaw has no solution");
  else if (!(Math.abs(spin(free, turned) - (5 * h) / free.yaw) < PhysicalTolerance.ACCUMULATED))
    findings.push(
      `asked no moment, the body spins at ${spin(free, turned)} against ${(5 * h) / free.yaw}`,
    );

  // 3. Past its bound one sole slips at the bound.
  const one: IAutoMovieVector3[] = [{ x: 0, y: 0, z: 0 }];
  const slipping: IProgram = program(one, 30, -30, 0, undefined);
  const slid: number[] | null = solve(slipping);
  if (slid === null) findings.push("a slipping yaw has no solution");
  else {
    const normal: number = slipping.normals[0]!.reduce(
      (total: number, r: number): number => total + slid[r]!,
      0,
    );
    const moment: number = -slid[slipping.torsions[0]!]!;
    if (!(Math.abs(moment - mu * 0.15 * normal) < PhysicalTolerance.ACCUMULATED))
      findings.push(
        `a slipping sole takes ${moment / h} N m off its bound ${(mu * 0.15 * normal) / h}`,
      );
    if (!(Math.abs(normal - mass * g * h) < PhysicalTolerance.ACCUMULATED))
      findings.push(`a slipping sole carries ${normal / h} N`);
    if (!(moment / h > 0.99 * bound && moment / h < 30))
      findings.push(`a slipping sole takes ${moment / h} N m against ${bound}`);
    const left: number = spin(slipping, slid);
    if (!(left > 0 && left < (30 * h) / slipping.yaw))
      findings.push(`a slipping sole spins at ${left}`);
  }

  // 4. A sole touching again adds no more than its entry share.
  const share: number = 0.25 * mass * g * h;
  const entering: IProgram = program(one, 0, 0, -0.3, share);
  const entered: number[] | null = solve(entering);
  if (entered === null) findings.push("an entering sole has no solution");
  else {
    const normal: number = entering.normals[0]!.reduce(
      (total: number, r: number): number => total + entered[r]!,
      0,
    );
    if (!(normal <= share + PhysicalTolerance.ACCUMULATED))
      findings.push(`an entering sole adds ${normal} N s over its ${share}`);
  }

  // 5. The heading servo's return.
  const human: number = 78.5;
  const axes: IAutoMoviePhysicalJointAxis[] = (["x", "y", "z"] as const).map(
    (axis: "x" | "y" | "z"): IAutoMoviePhysicalJointAxis => ({
      axis,
      minimum: -Math.PI,
      maximum: Math.PI,
      channel: `root.${axis}`,
      stiffness: 5 * human,
      damping: human,
      maximumTorque: 6 * human,
    }),
  );
  const identity: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };
  const yawMoment = (degrees: number, rate: number): number => {
    const current: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 0, y: 1, z: 0 },
      degrees,
    );
    return AutoMoviePhysicalTracking.torque(
      current,
      physicalStanceBalance.saturate(
        current,
        identity,
        physicalStanceBalance.TORSO_ERROR,
      ),
      { x: 0, y: rate, z: 0 },
      axes,
      { x: 0.2, y: 0.2, z: 0.2 },
      h,
      1,
    ).torque.y;
  };
  let angle: number = 10;
  let rate: number = 0;
  let lowest: number = angle;
  let rising: boolean = false;
  for (let i: number = 0; i < 2 / h; i++) {
    rate += (yawMoment(angle, rate) / 1.5) * h;
    const next: number = angle + (rate * h * 180) / Math.PI;
    if (next > angle + PhysicalTolerance.ROUNDING) rising = true;
    angle = next;
    lowest = Math.min(lowest, angle);
  }
  if (!(Math.abs(angle) < 0.5) || lowest < -PhysicalTolerance.CONVERGED || rising)
    findings.push(
      `the heading servo ends at ${angle} degrees, lowest ${lowest}, rising ${rising}`,
    );
  const limit: number = (physicalStanceBalance.TORSO_ERROR * 180) / Math.PI;
  if (!(Math.abs(yawMoment(30, 0) - yawMoment(limit, 0)) < PhysicalTolerance.CONVERGED))
    findings.push(
      `a 30 degree error asks ${yawMoment(30, 0)} N m against ${yawMoment(limit, 0)} at the limit`,
    );

  // 6. Only a patch with an open cone gets a torsional row.
  const t: IAutoMovieVector3[] = [
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
  ];
  const corners: IAutoMovieVector3[] = [
    { x: 0.1, y: 0, z: 0.05 },
    { x: -0.1, y: 0, z: 0.05 },
    { x: -0.1, y: 0, z: -0.05 },
    { x: 0.1, y: 0, z: -0.05 },
  ];
  const open: number = AutoMovieXpbdSupportRows.capacity(
    corners,
    t,
    [1, 1, 1, 1],
  );
  if (!(Math.abs(open - 4 * 0.15) < PhysicalTolerance.ROUNDING))
    findings.push(`four loaded corners hold ${open} against 0.6`);
  if (AutoMovieXpbdSupportRows.capacity([{ x: 0, y: 0, z: 0 }], t, [5]) !== 0)
    findings.push("a patch pressed at one point has torsional capacity");
  if (AutoMovieXpbdSupportRows.capacity(corners, t, [0, 0, 0, 0]) !== 0)
    findings.push(
      "a patch with its lever points unloaded has torsional capacity",
    );

  // 7. A bound's room: a foot entering at a zero share whose landing impact
  // the contact passes already gave, 2849 N over the substep, has no room
  // left and none taken back; a 700 N bound with 0.5 N s given leaves 700 h
  // - 0.5.
  const substep: number = 1 / 480;
  if (
    solveXpbdArticulationContacts.room({
      force: 0,
      h: substep,
      given: 2849 * substep,
    }) !== 0
  )
    findings.push("a landing impact past its bound is taken back");
  const left: number = solveXpbdArticulationContacts.room({
    force: 700,
    h: substep,
    given: 0.5,
  });
  if (!(Math.abs(left - (700 * substep - 0.5)) < PhysicalTolerance.ROUNDING))
    findings.push(`a 700 N bound with 0.5 N s given leaves ${left}`);

  TestValidator.equals("support torsion", findings, []);
}

/** One support program over a free rigid body and the indices to read it by. */
interface IProgram {
  /** The cascade's input. */
  input: solveXpbdSupportCascade.IInput;

  /** Each sole's normal rows. */
  normals: number[][];

  /** Each sole's torsional row. */
  torsions: number[];

  /** The body's inertia about the vertical, kg m^2. */
  yaw: number;
}

/**
 * A 10 kg body standing on soles centred at `centres`, each sole free in its
 * own translation and tilt but all turning about the vertical together, as a
 * four-legged body's two-axis legs leave them: four normal rows at each sole's
 * corners, two tangential rows and the torsional row at its centre, under
 * gravity and a yaw moment over one 1/480 s substep, coming down at `descent`,
 * the task asking the weight and the yaw moment `asked`, and the first sole's
 * normal rows bounded by `entry` when given.
 */
function program(
  centres: readonly IAutoMovieVector3[],
  moment: number,
  asked: number,
  descent: number,
  entry: number | undefined,
): IProgram {
  const h: number = 1 / 480;
  const mass: number = 10 / centres.length;
  const inertia: IAutoMovieVector3 = { x: 1, y: 2, z: 1 };
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const rows: solveXpbdSupportCascade.IRow[] = [];
  const patches: solveXpbdArticulationContacts.IPatch[] = [];
  const normals: number[][] = [];
  const torsions: number[] = [];
  centres.forEach((_: IAutoMovieVector3, state: number): void => {
    const first: number = rows.length;
    for (const [x, z] of [
      [0.1, 0.05],
      [-0.1, 0.05],
      [-0.1, -0.05],
      [0.1, -0.05],
    ] as const)
      rows.push({
        state,
        point: { x, y: 0, z },
        direction: up,
        lower: 0,
        velocity: descent,
      });
    const centre: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    rows.push(
      { state, point: centre, direction: { x: 1, y: 0, z: 0 }, velocity: 0 },
      { state, point: centre, direction: { x: 0, y: 0, z: 1 }, velocity: 0 },
      { state, point: centre, direction: up, moment: true, velocity: 0 },
    );
    normals.push([first, first + 1, first + 2, first + 3]);
    torsions.push(first + 6);
    patches.push({
      friction: 0.8,
      normal: 0,
      prior: { first: 0, second: 0 },
      normals: [first, first + 1, first + 2, first + 3],
      tangents: [first + 4, first + 5],
      torsion: first + 6,
    });
  });
  // Each sole's response to a spatial impulse about its own centre: its own
  // tilt and translation, and the yaw every sole shares.
  const respond = (
    impulse: readonly number[],
    on: number,
  ): AutoMovieXpbdArticulation.IResponse => ({
    change: centres.map((_: IAutoMovieVector3, state: number): number[] =>
      state === on
        ? [
            impulse[0]! / inertia.x,
            impulse[1]! / inertia.y,
            impulse[2]! / inertia.z,
            impulse[3]! / mass,
            impulse[4]! / mass,
            impulse[5]! / mass,
          ]
        : [0, impulse[1]! / inertia.y, 0, 0, 0, 0],
    ),
    rates: [],
  });
  const responses: AutoMovieXpbdArticulation.IResponse[] = rows.map(
    (row: solveXpbdSupportCascade.IRow): AutoMovieXpbdArticulation.IResponse =>
      respond(AutoMovieXpbdSupportRows.impulse(row), row.state),
  );
  const free: AutoMovieXpbdArticulation.IResponse = {
    change: centres.map((): number[] => [
      0,
      (moment * h) / inertia.y,
      0,
      0,
      -9.81 * h,
      0,
    ]),
    rates: [],
  };
  return {
    input: {
      k: rows.map((row: solveXpbdSupportCascade.IRow): number[] =>
        responses.map((response: AutoMovieXpbdArticulation.IResponse): number =>
          AutoMovieXpbdSupportRows.along(row, response),
        ),
      ),
      u: rows.map((row: solveXpbdSupportCascade.IRow): number =>
        AutoMovieXpbdSupportRows.along(row, free),
      ),
      // The wrench about the body's centre: each sole's rows at its place.
      columns: rows.map((row: solveXpbdSupportCascade.IRow): number[] => {
        const impulse: number[] = AutoMovieXpbdSupportRows.impulse({
          ...row,
          point: {
            x: row.point.x + centres[row.state]!.x,
            y: row.point.y,
            z: row.point.z + centres[row.state]!.z,
          },
        });
        return [
          impulse[3]!,
          impulse[4]!,
          impulse[5]!,
          impulse[0]!,
          impulse[1]!,
          impulse[2]!,
        ];
      }),
      target: [0, mass * 9.81 * h, 0, 0, asked * h, 0],
      set: { rows, patches },
      actuators: [],
      motion: [],
      ...(entry !== undefined
        ? { bounds: [{ rows: normals[0]!, impulse: entry }] }
        : {}),
      warm: { first: [], second: [] },
    },
    normals,
    torsions,
    yaw: inertia.y,
  };
}

/** The cascade's solution of a program, or null. */
function solve(program: IProgram): number[] | null {
  return solveXpbdSupportCascade(program.input);
}

/** The body's spin about the vertical after the substep, rad/s. */
function spin(program: IProgram, solution: readonly number[]): number {
  const r: number = program.torsions[0]!;
  return (
    program.input.u[r]! +
    program.input.k[r]!.reduce(
      (sum: number, value: number, s: number): number =>
        sum + value * solution[s]!,
      0,
    )
  );
}
