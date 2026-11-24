import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { climbStairsCarry } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** The disc's turning rate, degrees per second. */
const RATE: number = 8;

/** The disc's centre, world metres. */
const CENTRE: IAutoMovieVector3 = { x: 0, y: 0, z: 2 };

/** Rounding of a few rotations, metres. */
const ROUNDING: number = 1e-9;

/**
 * `climbStairsCarry` carries a climb planned in the world onto a moving prop:
 * a foot planted on the floor stays where it stands in the world, and a foot
 * planted on the prop is carried by it from its touchdown, so it stays put in
 * the prop's frame.
 *
 * Scenarios, a 2 s plan on a disc turning 8 degrees a second about (0, 0, 2),
 * the left foot planted on the floor over the first half and the right foot on
 * the disc over the second, the planned goals fixed:
 *
 * 1. The left foot's goal stays at its planned point through its plant.
 * 2. The right foot's goal is its planned point at its touchdown, 1 s, turned
 *    with the disc from the start to then.
 * 3. From then to the end it stays put in the disc's frame.
 * 4. `boarded` is whether both entry ankles stand above the world floor by more
 *    than the ankle's own height and a 2 cm give.
 */
export function test_unit_motions_terrain_climb_stairs_carry(): void {
  const p = (x: number, y: number, z: number): IAutoMovieVector3 => ({ x, y, z });
  const spin = (seconds: number): IAutoMovieQuaternion => {
    const half: number = (RATE * seconds * Math.PI) / 360;
    return { x: 0, y: Math.sin(half), z: 0, w: Math.cos(half) };
  };
  const turn = (q: IAutoMovieVector3, seconds: number): IAutoMovieVector3 => {
    const a: number = (RATE * seconds * Math.PI) / 180;
    const dx: number = q.x - CENTRE.x;
    const dz: number = q.z - CENTRE.z;
    return p(
      CENTRE.x + dx * Math.cos(a) + dz * Math.sin(a),
      q.y,
      CENTRE.z - dx * Math.sin(a) + dz * Math.cos(a),
    );
  };
  // The disc's frame: its origin at the world origin at the start, turning
  // about the centre.
  const frame = (seconds: number): IAutoMovieRigidTransform => ({
    position: turn(p(0, 0, 0), seconds),
    rotation: spin(seconds),
  });
  const left: IAutoMovieVector3 = p(0.1, 0.08, 0);
  const right: IAutoMovieVector3 = p(-0.1, 0.25, 0.3);
  const planned: IAutoMovieMotionHumanPosture = {
    root: p(0, 0.9, 0),
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {
      leftLeg: { point: left, bend: p(0.1, 0.5, 0.2) },
      rightLeg: { point: right, bend: p(-0.1, 0.6, 0.5) },
    },
  };
  const plan: IAutoMovieMotionHumanActionPlan = {
    duration: 2,
    events: [],
    contacts: [
      { part: "leftFoot", kind: "plant", from: 0, to: 0.5, support: { kind: "ground" } },
      {
        part: "rightFoot",
        kind: "plant",
        from: 0.5,
        to: 1,
        support: { kind: "prop", subject: "disc" },
      },
    ],
    posture: (): IAutoMovieMotionHumanPosture => planned,
  };
  const carried: IAutoMovieMotionHumanActionPlan = climbStairsCarry(
    { start: 0, prop: () => ({ frame }) },
    plan,
    "disc",
  );
  const goal = (limb: "leftLeg" | "rightLeg", seconds: number): IAutoMovieVector3 =>
    carried.posture(seconds).limbs[limb]!.point;

  // 1. On the floor.
  TestValidator.predicate(
    "the floor foot stays",
    [0, 0.5, 1].every((t: number): boolean => vclose(goal("leftLeg", t), left, ROUNDING)),
  );

  // 2. At the touchdown.
  const down: IAutoMovieVector3 = goal("rightLeg", 1);
  TestValidator.predicate(
    "the tread foot lands where the tread is",
    vclose(down, turn(right, 1), ROUNDING),
  );

  // 3. Riding the disc.
  TestValidator.predicate(
    "the tread foot rides the disc",
    [1.5, 2].every((t: number): boolean =>
      vclose(goal("rightLeg", t), turn(right, t), ROUNDING),
    ),
  );

  // 4. Boarded.
  const boarding = (y: number): climbStairsCarry.IBoarding => ({
    entry: { feet: { left: { ankle: p(0.1, y, 0) }, right: { ankle: p(-0.1, y, 0) } } },
    body: { measure: { ankleHeight: 0.08 } },
  });
  TestValidator.equals(
    "boarded",
    [climbStairsCarry.boarded(boarding(0.08)), climbStairsCarry.boarded(boarding(0.3))],
    [false, true],
  );
}
