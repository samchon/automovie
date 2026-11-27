import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanJacobian,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanFitTargets
} from "../../../../../packages/motions/src/posture/internal/HumanFitTargets";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a few products and one quaternion's angle, metres or radians. */
const ROUNDING: number = 1e-12;

/** The rows' millimetres per metre. */
const MM: number = 1000;

/** No turn. */
const IDENTITY: IAutoMovieQuaternion = { x: 0, y: 0, z: 0, w: 1 };

/** The effector's point, world metres. */
const P: IAutoMovieVector3 = { x: 0.3, y: 1, z: 0.2 };

/**
 * Two variables: the root slid along +X, and the body turned about +Y through
 * the origin, which moves P at ω × P = (0.2, 0, −0.3).
 */
const MOTIONS: IAutoMovieMotionHumanJacobian.IMotion[] = [
  { angular: { x: 0, y: 0, z: 0 }, linear: { x: 1, y: 0, z: 0 }, moves: null },
  { angular: { x: 0, y: 1, z: 0 }, linear: { x: 0, y: 0, z: 0 }, moves: null },
];

/** A reading with the effector at a point, unturned, and the hips placed. */
function reading(
  point: IAutoMovieVector3,
  bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map(),
): HumanFitTargets.IReading {
  return { points: [point], turns: [IDENTITY], bones };
}

/** One row the builder was handed. */
interface IRow {
  key: string;
  f: (r: HumanFitTargets.IReading) => number;
  goal: number;
  coef: number[];
}

/** The rows a target gives at a reading. */
function rows(
  target: IAutoMovieMotionHumanBodyFitTypes.ITarget,
  at: HumanFitTargets.IReading,
): { equal: IRow[]; bounded: ReturnType<typeof HumanFitTargets.rows> } {
  const equal: IRow[] = [];
  const bounded: ReturnType<typeof HumanFitTargets.rows> = HumanFitTargets.rows(
    {
      at,
      motions: MOTIONS,
      units: [1, 1],
      index: [0, 1],
      targets: [target],
      price: 1,
    },
    (
      key: string,
      f: (r: HumanFitTargets.IReading) => number,
      goal: number,
      coef: number[],
    ): void => {
      equal.push({ key, f, goal, coef });
    },
    MM,
  );
  return { equal, bounded };
}

/** Whether two lists agree to the rounding. */
function agree(a: readonly number[], b: readonly number[]): boolean {
  return (
    a.length === b.length &&
    a.every((v: number, i: number): boolean => nclose(v, b[i]!, ROUNDING))
  );
}

/**
 * `HumanFitTargets` writes the body fit's contact and plant constraints: an
 * exact point contact as one equality row per held axis, its reading the
 * effector's coordinate and its slope the effector's velocity under each
 * variable (the twist `v + ω × p`) in millimetres; a contact allowed a radius
 * as one row bounding the distance, sloped along the miss; a held rotation as
 * the rotation vector to its goal; a planar contact's normal as its tilt across
 * the goal normal; and a goal on a moving bone (`on`) in that bone's frame, so
 * a plant on a moving support is held relative to it. `misses` and `residual`
 * measure the same errors.
 *
 * The effector at (0.3, 1, 0.2), unturned.
 *
 * Scenarios:
 *
 * 1. A goal 5 cm further along +Z: rows x, y and z with goals 0.3, 1 and 0.25,
 *    readings the effector's coordinates, slopes (1000, 200), (0, 0) and (0,
 *    −300); misses (0, 0, −0.05) and a 50 mm residual. A moved reading reads
 *    its own point.
 * 2. The same goal within 2 cm: one row, its upper bound (0.02 − 0.05) · 1000 =
 *    −30, its slope along the miss (0, 300); misses 0.03.
 * 3. Held on Y alone: one row, the y miss alone.
 * 4. A goal rotation of 90 degrees about +Z: misses (0, 0, π/2) after the point's,
 *    a 90-degree residual.
 * 5. A sole normal +Y brought to +Z: the tilt (−π/2, 0, 0), read across the goal
 *    normal as (0, π/2), a 90-degree residual.
 * 6. A goal on the hips, placed at (0, 1, 0) and turned 90 degrees about +Y, at
 *    the effector's place in the hips' frame, (−0.2, 0, 0.3): no miss.
 * 7. The same fixed frame rotates world X translation into local Z and the
 *    angular point velocity into local X and Z. The lateral interval keeps
 *    its signed slope at its centre and measures excess at both ends.
 */
export function test_motions_posture_fit_targets(): void {
  const at: HumanFitTargets.IReading = reading(P);
  const goal: IAutoMovieVector3 = { x: 0.3, y: 1, z: 0.25 };

  // 1. An exact contact.
  const exact: IAutoMovieMotionHumanBodyFitTypes.ITarget = {
    bone: "leftHand",
    goal,
  };
  const point: ReturnType<typeof rows> = rows(exact, at);
  TestValidator.predicate(
    "an exact contact's rows",
    point.equal.map((r: IRow): string => r.key).join() === "x:0,y:0,z:0" &&
      agree(
        point.equal.map((r: IRow): number => r.goal),
        [0.3, 1, 0.25],
      ) &&
      agree(
        point.equal.map((r: IRow): number => r.f(at)),
        [0.3, 1, 0.2],
      ) &&
      agree(point.equal[0]!.coef, [1000, 200]) &&
      agree(point.equal[1]!.coef, [0, 0]) &&
      agree(point.equal[2]!.coef, [0, -300]) &&
      nclose(point.equal[2]!.f(reading({ ...P, z: 0.21 })), 0.21, ROUNDING) &&
      agree(HumanFitTargets.misses(exact, at, 0), [0, 0, -0.05]) &&
      nclose(HumanFitTargets.residual(exact, at, 0).point, 50, 1e-9),
  );

  // 2. A contact within a radius.
  const within: IAutoMovieMotionHumanBodyFitTypes.ITarget = {
    ...exact,
    bound: 0.02,
  };
  const ball: ReturnType<typeof rows> = rows(within, at);
  TestValidator.predicate(
    "a contact within a radius",
    ball.equal.length === 0 &&
      ball.bounded.length === 1 &&
      ball.bounded[0]!.row.key === "point-ball:0" &&
      nclose(ball.bounded[0]!.row.u, -30, 1e-9) &&
      ball.bounded[0]!.row.l === -Infinity &&
      agree(ball.bounded[0]!.row.coef, [0, 300]) &&
      agree(HumanFitTargets.misses(within, at, 0), [0.03]),
  );

  // 3. One axis.
  const level: IAutoMovieMotionHumanBodyFitTypes.ITarget = {
    bone: "leftHand",
    goal: { x: 9, y: 1.1, z: 9 },
    axes: ["y"],
  };
  TestValidator.predicate(
    "a contact held on one axis",
    rows(level, at).equal.length === 1 &&
      agree(HumanFitTargets.misses(level, at, 0), [-0.1]),
  );

  // 4. A held rotation.
  const turned: IAutoMovieMotionHumanBodyFitTypes.ITarget = {
    bone: "leftHand",
    goal: P,
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, 90),
  };
  TestValidator.predicate(
    "a held rotation",
    agree(HumanFitTargets.misses(turned, at, 0), [
      0,
      0,
      0,
      0,
      0,
      Math.PI / 2,
    ]) && nclose(HumanFitTargets.residual(turned, at, 0).turn, 90, 1e-9),
  );

  // 5. A planar contact's normal.
  const flat: IAutoMovieMotionHumanBodyFitTypes.ITarget = {
    bone: "leftFoot",
    goal: P,
    axes: [],
    normal: { local: { x: 0, y: 1, z: 0 }, world: { x: 0, y: 0, z: 1 } },
  };
  const tilt: IAutoMovieVector3 = HumanFitTargets.tilt(flat, IDENTITY);
  TestValidator.predicate(
    "a planar contact's normal",
    agree([tilt.x, tilt.y, tilt.z], [-Math.PI / 2, 0, 0]) &&
      agree(HumanFitTargets.misses(flat, at, 0), [0, Math.PI / 2]) &&
      nclose(HumanFitTargets.residual(flat, at, 0).turn, 90, 1e-9),
  );

  // 6. A plant on a moving bone.
  const hips: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
    { x: 0, y: 1, z: 0 },
    90,
  );
  const carried: HumanFitTargets.IReading = reading(
    P,
    new Map([
      [
        "hips",
        {
          bone: "hips",
          localRotation: hips,
          worldPosition: { x: 0, y: 1, z: 0 },
          worldRotation: hips,
        },
      ],
    ]),
  );
  TestValidator.predicate(
    "a plant held in its support's frame",
    agree(
      HumanFitTargets.misses(
        { bone: "leftHand", on: "hips", goal: { x: -0.2, y: 0, z: 0.3 } },
        carried,
        0,
      ),
      [0, 0, 0],
    ),
  );

  // 7. The fixed frame's own points, velocities and orientation.
  const material: IAutoMovieRigidTransform = {
    position: { x: 0, y: 1, z: 0 },
    rotation: hips,
  };
  const fixed: IAutoMovieMotionHumanBodyFitTypes.ITarget = {
    bone: "leftHand",
    frame: material,
    goal: { x: 0, y: 0, z: 0.35 },
    axes: ["y", "z"],
    rotation: AutoMovieEngineQuaternion.inverse(hips),
    normal: { local: { x: 0, y: 0, z: 1 }, world: { x: -1, y: 0, z: 0 } },
  };
  const lateral: IAutoMovieMotionHumanBodyFitTypes.ITarget = {
    bone: "leftHand",
    frame: material,
    goal: { x: -0.22, y: 0, z: 0 },
    axes: ["x"],
    bound: 0.005,
  };
  const exactRows: ReturnType<typeof rows> = rows(fixed, at);
  const lateralRow: ReturnType<typeof rows>["bounded"][number] = rows(
    lateral,
    at,
  ).bounded[0]!;
  const attained: HumanFitTargets.IReading = reading({ x: 0.35, y: 1, z: 0.22 });
  const centredRow: ReturnType<typeof rows>["bounded"][number] = rows(
    lateral,
    attained,
  ).bounded[0]!;
  const below: HumanFitTargets.IReading = reading({ ...P, z: 0.23 });
  const requiredRow: ReturnType<typeof rows>["bounded"][number] = rows(
    { ...lateral, required: true, price: 7 },
    attained,
  ).bounded[0]!;
  TestValidator.predicate(
    "fixed goal axes transform point, normal, rotation and Jacobian together",
    agree(exactRows.equal[0]!.coef, [0, 0]) &&
      agree(exactRows.equal[1]!.coef, [1000, 200]) &&
      HumanFitTargets.misses(fixed, attained, 0).every(
        (miss: number): boolean => nclose(miss, 0, ROUNDING),
      ),
  );
  TestValidator.predicate(
    "a lateral interval keeps both limits and the same signed slope at its centre",
    lateralRow.row.key === "point-interval:0" &&
      agree(lateralRow.row.coef, [0, 300]) &&
      agree([lateralRow.row.l, lateralRow.row.u], [-25, -15]) &&
      agree([lateralRow.f(at), lateralRow.f(below)], [0.02, -0.01]) &&
      agree(centredRow.row.coef, [0, 350]) &&
      agree([centredRow.row.l, centredRow.row.u], [-5, 5]) &&
      requiredRow.row.weight === undefined &&
      agree([requiredRow.row.l, requiredRow.row.u], [-5, 5]) &&
      agree(HumanFitTargets.misses(lateral, at, 0), [0.015]) &&
      agree(HumanFitTargets.misses(lateral, below, 0), [0.005]) &&
      agree(HumanFitTargets.misses(lateral, attained, 0), [0]),
  );
}
