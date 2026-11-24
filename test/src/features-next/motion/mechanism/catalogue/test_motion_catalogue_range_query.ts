import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClearance,
  IAutoMovieMotionHumanDrinkingArm,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTargetGrid,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanStance } from "@automovie/motions";
import {
  AutoMovieMotionHumanBend,
  AutoMovieMotionHumanClearance,
  AutoMovieMotionHumanDrinkingArm,
  AutoMovieMotionHumanDrinkingSwivel,
  AutoMovieMotionHumanGoal,
  AutoMovieMotionHumanTarget,
  AutoMovieMotionHumanTargetGrid,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { nclose } from "../../../../features/internal/nclose";

/**
 * The names of the place a world point falls in, the inverse of a named
 * place.
 *
 * The body is a stub 1.7 m tall with an upper arm of 0.3 m, a forearm of 0.25
 * m, a half shoulder width of 0.2 m and landmark heights of 0.5 m (knee, the
 * hip's 0.9 m less a thigh of 0.4 m), 0.9, 1.05, 1.25, 1.4, 1.48 and 1.6 m.
 *
 * Scenarios:
 * 1. For each of the 10 heights, 4 laterals and 4 distances, the point of
 *    the named place reads back as the same three names, for both hands, at
 *    a heading of 0° and of 90°, from a rig origin at (1, 0, 2).
 * 2. The root's own height is not read: a root lowered by 0.4 m in a crouch
 *    reads the same names.
 * 3. A point 1.3 m high, 0.05 m nearer the chest (1.25 m) than the shoulder
 *    (1.4 m), 0.19 m to the left and 0.4 m ahead at heading 0 reads chest,
 *    shoulder (0.2 m against 0.12 m for inside) and far (0.44 m against 0.33
 *    m for mid) for the left hand; for the right hand its lateral, on the
 *    other side of the midline, reads centre.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public functions and reads the three names; an axis read in the wrong frame, a lateral that does not mirror, or a root height that leaks in fails.
 * @evidence contracts/development/testing.md#independent-expectations Scenario 3's names are the nearest of the stated landmark lengths worked out by hand; scenario 1 states a law of two public functions, that one inverts the other.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers all 160 name combinations on both sides and two headings, a second root height, and an off-grid point whose lateral differs by side.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on a stub of the measures read. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the stub and lists the 3 scenarios with their numbers.
 */
export function test_motion_catalogue_range_query(): void {
  checkReachIntervals();
  checkElbowCircle();
  const body: IAutoMovieMotionHumanBody = {
    measure: {
      stature: 1.7,
      upperArm: 0.3,
      forearm: 0.25,
      shoulderHalfWidth: 0.2,
      shoulderHeight: 1.4,
      eyeHeight: 1.6,
      hipHeight: 0.9,
      thigh: 0.4,
      waistHeight: 1.05,
      chestHeight: 1.25,
      neckHeight: 1.48,
    },
  } as unknown as IAutoMovieMotionHumanBody;
  const laterals: IAutoMovieMotionHumanTargetGrid.Lateral[] = [
    "centre",
    "inside",
    "shoulder",
    "outside",
  ];
  const distances: IAutoMovieMotionHumanTargetGrid.Distance[] = [
    "close",
    "near",
    "mid",
    "far",
  ];

  const missed: string[] = [];
  for (const rootY of [0, -0.4])
    for (const yaw of [0, 90])
      for (const side of ["left", "right"] as const)
        for (const height of AutoMovieMotionHumanTargetGrid.HEIGHTS)
          for (const lateral of laterals)
            for (const distance of distances) {
              const posture = { root: { x: 1, y: rootY, z: 2 }, yaw };
              const found = AutoMovieMotionHumanTargetGrid.nearest(
                body,
                posture,
                side,
                AutoMovieMotionHumanTarget.fallback(
                  body,
                  posture,
                  AutoMovieMotionHumanTargetGrid.place(body, side, {
                    height,
                    lateral,
                    distance,
                  }),
                ).point,
              );
              if (
                found.height !== height ||
                found.lateral !== lateral ||
                found.distance !== distance
              )
                missed.push(
                  `${rootY} ${yaw} ${side} ${height} ${lateral} ${distance}`,
                );
            }
  TestValidator.equals("every named place reads back", missed, []);

  const posture = { root: { x: 0, y: 0, z: 0 }, yaw: 0 };
  const point = { x: 0.19, y: 1.3, z: 0.4 };
  TestValidator.equals(
    "an off-grid point for the left hand",
    AutoMovieMotionHumanTargetGrid.nearest(body, posture, "left", point),
    { height: "chest", lateral: "shoulder", distance: "far" },
  );
  TestValidator.equals(
    "the same point for the right hand",
    AutoMovieMotionHumanTargetGrid.nearest(body, posture, "right", point),
    { height: "chest", lateral: "centre", distance: "far" },
  );
}

/** Check constrained and unconstrained elbow targets against the shoulder/wrist reach circle. */
function checkElbowCircle(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const posture: IAutoMovieMotionHumanPosture =
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, { ...posture, limbs: {} }),
  );
  const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
    bones.get(bone)!.worldPosition;
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const shoulder: IAutoMovieVector3 = at("rightUpperArm");
  const upper: number = distance(at("rightLowerArm"), shoulder);
  const lower: number = distance(at("rightHand"), at("rightLowerArm"));
  const hint: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
    body,
    posture,
    "right",
  );
  const bound: (
    point: IAutoMovieVector3,
    hint: IAutoMovieVector3,
  ) => IAutoMovieVector3 = AutoMovieMotionHumanDrinkingSwivel.bounded(
    body,
    posture,
    "right",
  );
  // How far an elbow's shoulder lies past the range, degrees.
  const past = (elbow: IAutoMovieVector3): number => {
    const read: IAutoMovieMotionHumanDrinkingArm.IMeasuredResult =
      AutoMovieMotionHumanDrinkingArm.measured(
        new Map<
          AutoMovieHumanoidBone,
          Pick<IAutoMovieResolvedBone, "worldPosition">
        >([
          ["rightUpperArm", { worldPosition: shoulder }],
          ["rightLowerArm", { worldPosition: elbow }],
          ["rightUpperLeg", { worldPosition: at("rightUpperLeg") }],
        ]),
        "right",
        posture.yaw,
      );
    return Math.max(
      read.flexion - AutoMovieMotionHumanDrinkingArm.FLEXION,
      read.abduction - AutoMovieMotionHumanDrinkingArm.ABDUCTION,
    );
  };
  // The elbow on a wrist's circle at a swivel from the hint's side, degrees.
  const circle = (
    wrist: IAutoMovieVector3,
  ): ((swivel: number) => IAutoMovieVector3) => {
    const reach: IAutoMovieVector3 = {
      x: wrist.x - shoulder.x,
      y: wrist.y - shoulder.y,
      z: wrist.z - shoulder.z,
    };
    const d: number = Math.hypot(reach.x, reach.y, reach.z);
    const n: IAutoMovieVector3 = {
      x: reach.x / d,
      y: reach.y / d,
      z: reach.z / d,
    };
    const foot: number = (upper * upper - lower * lower + d * d) / (2 * d);
    const r: number = Math.sqrt(upper * upper - foot * foot);
    const h: IAutoMovieVector3 = {
      x: hint.x - shoulder.x,
      y: hint.y - shoulder.y,
      z: hint.z - shoulder.z,
    };
    const along: number = h.x * n.x + h.y * n.y + h.z * n.z;
    const raw: IAutoMovieVector3 = {
      x: h.x - n.x * along,
      y: h.y - n.y * along,
      z: h.z - n.z * along,
    };
    const size: number = Math.hypot(raw.x, raw.y, raw.z);
    const u: IAutoMovieVector3 = {
      x: raw.x / size,
      y: raw.y / size,
      z: raw.z / size,
    };
    const v: IAutoMovieVector3 = {
      x: n.y * u.z - n.z * u.y,
      y: n.z * u.x - n.x * u.z,
      z: n.x * u.y - n.y * u.x,
    };
    return (swivel: number): IAutoMovieVector3 => {
      const a: number = (swivel * Math.PI) / 180;
      return {
        x:
          shoulder.x + n.x * foot + r * (u.x * Math.cos(a) + v.x * Math.sin(a)),
        y:
          shoulder.y + n.y * foot + r * (u.y * Math.cos(a) + v.y * Math.sin(a)),
        z:
          shoulder.z + n.z * foot + r * (u.z * Math.cos(a) + v.z * Math.sin(a)),
      };
    };
  };

  // The width a fit keeps a hint's swivel to, degrees (the engine's
  // `hingedArmSwivel.RESOLUTION`: a two-degree bracket shrunk by the golden
  // ratio until it is within the joints' tolerance of 0.01 degrees).
  const GOLDEN: number = (Math.sqrt(5) - 1) / 2;
  const RESOLUTION: number =
    2 * GOLDEN ** Math.ceil(Math.log(0.01 / 2) / Math.log(GOLDEN));
  let moved: number = 0;
  let kept: number = 0;
  for (let ahead: number = 0.1; ahead <= 0.4 + 1e-9; ahead += 0.05)
    for (let up: number = -0.25; up <= 0.15 + 1e-9; up += 0.05)
      for (let out: number = -0.15; out <= 0.05 + 1e-9; out += 0.05) {
        // The right arm's outward is the body's -X; it faces +Z.
        const wrist: IAutoMovieVector3 = {
          x: shoulder.x - out,
          y: shoulder.y + up,
          z: shoulder.z + ahead,
        };
        const d: number = distance(wrist, shoulder);
        if (!(d < upper + lower) || !(d > Math.abs(upper - lower))) continue;
        const where: string = `wrist (${ahead.toFixed(2)} ahead, ${up.toFixed(2)} up, ${out.toFixed(2)} out)`;
        const result: IAutoMovieVector3 = bound(wrist, hint);
        if (result !== hint) {
          moved++;
          // 1. A moved hint.
          TestValidator.predicate(
            `${where}: the moved hint lies on the elbow's circle`,
            nclose(distance(result, shoulder), upper, 1e-9) &&
              nclose(distance(result, wrist), lower, 1e-9),
          );
          // The hint's swivel on the circle, read off the circle's own points,
          // and the elbow the swivel's resolution to either side of it.
          const on: (swivel: number) => IAutoMovieVector3 = circle(wrist);
          const centre: IAutoMovieVector3 = {
            x: (on(0).x + on(180).x) / 2,
            y: (on(0).y + on(180).y) / 2,
            z: (on(0).z + on(180).z) / 2,
          };
          const along = (to: IAutoMovieVector3): number =>
            (result.x - centre.x) * (to.x - centre.x) +
            (result.y - centre.y) * (to.y - centre.y) +
            (result.z - centre.z) * (to.z - centre.z);
          const swivel: number =
            (Math.atan2(along(on(90)), along(on(0))) * 180) / Math.PI;
          const edge: number = Math.min(
            Math.abs(past(result)),
            Math.abs(past(on(swivel - RESOLUTION))),
            Math.abs(past(on(swivel + RESOLUTION))),
          );
          TestValidator.predicate(
            `${where}: the moved hint's shoulder is inside the range (${past(result).toFixed(6)} degrees past it), at its edge or the swivel's resolution inside it (${edge.toExponential(2)} degrees from the edge there)`,
            past(result) <= 1e-6 && edge <= 1e-6,
          );
        } else {
          kept++;
          // 2. A kept hint.
          const on: (swivel: number) => IAutoMovieVector3 = circle(wrist);
          const reaches: boolean = Array.from(
            { length: 360 },
            (_: unknown, k: number): number => past(on(k)),
          ).some((excess: number): boolean => excess <= 0);
          TestValidator.predicate(
            `${where}: the kept hint's swivel is inside the range, or no swivel is (${past(on(0)).toFixed(6)} degrees past it)`,
            past(on(0)) <= 1e-6 || !reaches,
          );
        }
      }
  // 3. Both cases.
  TestValidator.predicate(
    `both cases occur (${moved} moved, ${kept} kept)`,
    moved > 0 && kept > 0,
  );
}

/** Restrict goal interpolation and the clearance profile to their authored endpoint interval. */
function checkReachIntervals(): void {
  const from: IAutoMovieHumanLimbGoal = {
    point: { x: 0, y: 1, z: 0 },
    bend: { x: 0, y: 1, z: 0 },
  };
  const to: IAutoMovieHumanLimbGoal = {
    point: { x: 2, y: 1, z: 0 },
    bend: { x: 0, y: 1, z: 0 },
  };
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: { leftArm: from },
  };
  const path = AutoMovieMotionHumanClearance.path(
    { z: 0, y: 0 },
    { z: 1, y: 0 },
    (z: number): number => (z >= 0.3 && z <= 0.5 ? 0.2 : -1),
  );
  for (const weight of [-1, 0, 0.5, 1, 2]) {
    const expected: number = Math.max(0, Math.min(1, weight));
    const mixed = AutoMovieMotionHumanGoal.mix(from, to, weight);
    const toward = AutoMovieMotionHumanGoal.toward(
      { limb: "leftArm", from: 0, to: 1, goal: () => to, weight: () => weight },
      posture,
      0.5,
    );
    TestValidator.equals(
      "goal projection clamps at both ends " + weight,
      [mixed.point.x, toward.point.x],
      [2 * expected, 2 * expected],
    );
  }
  const samples: IAutoMovieMotionHumanClearance.IPoint[] = Array.from(
    { length: 101 },
    (_, index: number) => path(index / 100),
  );
  TestValidator.predicate(
    "clearance traverses the raised profile in order",
    samples.every(
      (point, index) =>
        (index === 0 || point.z >= samples[index - 1]!.z) &&
        (point.z < 0.3 ||
          point.z > 0.5 ||
          point.y >= 0.2 - AutoMovieMotionHumanClearance.RADIUS),
    ),
  );
  TestValidator.equals(
    "profile endpoint clamping",
    [path(-1), path(2)],
    [
      { z: 0, y: 0 },
      { z: 1, y: 0 },
    ],
  );
}
