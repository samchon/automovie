import { Quaternion, physicalShapeSegmentDistance } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanArmClearance,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The bounding-sphere screen of a forearm's clearance changes nothing: the
 * public overshoot, which screens, equals an exhaustive reading of its
 * documented rule that queries every shape at every sample (exhaustive),
 * within 1e-12 degrees, for arms that hang clear, brush the flank, cross the chest and
 * reach into the thigh.
 *
 * Two real-body witnesses retain the outside flank and contralateral reach
 * against the original placed colliders. Analytic spheres then put the
 * elbow exactly at contact and on either side of it. A sphere centred at
 * the wrist separates an authored goal, a free obstacle and a resting
 * surface by their distinct allowances at the last forearm sample.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public `HumanArmClearance.overshoot` on real bodies' placed colliders against the exhaustive reading; a screen that spares a query whose result would have raised the depth fails.
 * @evidence contracts/development/testing.md#independent-expectations The exhaustive reading of the documented rule, written here, is the oracle; the screen claims to change nothing, so any difference beyond 1e-12 degrees, the rounding of a prepared against a direct distance query, is a defect.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite-side real bodies, a tangent with positive and negative clearance, and self, free and resting wrist obstacles.
 * @evidence contracts/development/testing.md#execution-ownership Two original real-body cases and closed-form contact witnesses require no performed film.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, what is swept and the comparison.
 */
export function test_human_motion_core_arm_clearance_screen(): void {
  const complaints: string[] = [];
  const stand = (
    name: "m-average" | "f-small",
    x: number,
  ): {
    body: IAutoMovieMotionHumanBody;
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  } => {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    return {
      body,
      bones: poseBones(
        body,
        resolveHumanPosture(body, {
          root: { x, y: body.measure.hipHeight, z: 0 },
          yaw: 0,
          pitch: 0,
          roll: 0,
          joints: {},
          limbs: {},
        }),
      ),
    };
  };
  // Two non-spherical scenes retain the original input coordinates and the
  // exhaustive oracle. The isolated spheres below determine each branch.
  for (const [name, otherName, side, ex, ez, wx, wy, wz, goal] of [
    ["m-average", "f-small", "right", 0.3, 1, 0.4, -1, 0.9, false],
    ["f-small", "m-average", "left", -0.3, 0, -1.2, 0.3, -0.2, true],
  ] as const) {
    const me: ReturnType<typeof stand> = stand(name, 0);
    const other: ReturnType<typeof stand> = stand(otherName, 0.35);
    const shapes = HumanArmClearance.obstacles(me.body, me.bones);
    const others = HumanArmClearance.trunk(other.body, other.bones);
    const shoulder: IAutoMovieVector3 = me.bones.get(
      `${side}UpperArm`,
    )!.worldPosition;
    const sign: number = side === "left" ? 1 : -1;
    const upper: number = me.body.measure.upperArm;
    const fore: number = me.body.measure.forearm;
    const elbow: IAutoMovieVector3 = {
      x: shoulder.x + sign * ex * upper,
      y: shoulder.y - upper * Math.sqrt(1 - ex * ex),
      z: shoulder.z + ez * upper * 0.6,
    };
    const wrist: IAutoMovieVector3 = {
      x: elbow.x + sign * wx * fore,
      y: elbow.y + wy * fore,
      z: elbow.z + wz * fore,
    };
    const full: number = exhaustive(
      me.body,
      shapes,
      elbow,
      wrist,
      side,
      others,
      goal,
    );
    const screened: number = HumanArmClearance.overshoot(
      me.body,
      shapes,
      elbow,
      wrist,
      side,
      others,
      goal,
    );
    if (!(Math.abs(screened - full) <= 1e-12))
      complaints.push(
        `${name} ${side}: ${screened} degrees screened, ${full} exhaustive`,
      );
  }

  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const forearm: number = body.measure.forearm;
  const radius: number = body.measure.forearmRadius;
  const elbow: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const wrist: IAutoMovieVector3 = { x: forearm, y: 0, z: 0 };
  const sphereRadius: number = forearm / 2;
  const sphere = (
    centre: IAutoMovieVector3,
  ): IAutoMovieMotionHumanColliders.IPlaced => ({
    bone: "hips",
    pose: { position: centre, rotation: Quaternion.identity() },
    shapes: [
      {
        id: "probe",
        material: "skin",
        kind: "sphere",
        radius: sphereRadius,
        transform: { position: elbow, rotation: Quaternion.identity() },
      },
    ],
  });
  const check = (label: string, degrees: number, metres: number): void => {
    const expected: number = ((metres / body.measure.upperArm) * 180) / Math.PI;
    if (!(Math.abs(degrees - expected) <= 1e-12))
      complaints.push(`${label}: ${degrees} degrees, expected ${expected}`);
  };

  // The elbow is the nearest sample and needs the full forearm radius.
  const skin: number = 0.01;
  for (const clearance of [-skin, 0, skin]) {
    const neighbour = sphere({
      x: 0,
      y: sphereRadius + radius + clearance,
      z: 0,
    });
    check(
      `elbow clearance ${clearance} m`,
      HumanArmClearance.overshoot(body, [], elbow, wrist, "right", [neighbour]),
      Math.max(0, -clearance),
    );
  }

  // At the wrist sphere each successive sample is closer by L/8. Even
  // the greatest linear goal allowance grows more slowly than that, so
  // the last sample is the maximum for every role.
  const contact = sphere(wrist);
  const share: number = 7 / 8;
  const needed: number = Math.max(radius * (1 - share), radius - skin);
  const free: number = needed + sphereRadius - (1 - share) * forearm;
  const ownGoalDepth: number = Math.max(0, free - share * sphereRadius);
  const restingDepth: number = Math.max(
    0,
    free - share * (sphereRadius + radius - skin),
  );
  if (!(free > ownGoalDepth && ownGoalDepth > restingDepth))
    complaints.push(
      "the wrist sphere must distinguish free, grazing and resting depths",
    );
  check(
    "unrequested own contact",
    HumanArmClearance.overshoot(
      body,
      [contact],
      elbow,
      wrist,
      "right",
      [],
      false,
    ),
    free,
  );
  check(
    "own goal",
    HumanArmClearance.overshoot(body, [contact], elbow, wrist, "right"),
    ownGoalDepth,
  );
  check(
    "free obstacle",
    HumanArmClearance.overshoot(body, [], elbow, wrist, "right", [contact]),
    free,
  );
  check(
    "resting goal",
    HumanArmClearance.overshoot(
      body,
      [],
      elbow,
      wrist,
      "right",
      [],
      true,
      undefined,
      undefined,
      [contact],
    ),
    restingDepth,
  );

  // Without another arm present the chest reserves one radius on each
  // side of its median plane. Reflect both endpoints to swap the side.
  const chest: IAutoMovieMotionHumanColliders.IPlaced = {
    bone: "chest",
    pose: { position: elbow, rotation: Quaternion.identity() },
    shapes: [],
  };
  for (const side of ["left", "right"] as const) {
    const sign: number = side === "left" ? 1 : -1;
    check(
      `${side} median plane`,
      HumanArmClearance.overshoot(
        body,
        [chest],
        { x: -sign * radius, y: 0, z: 0 },
        { x: sign * 2 * radius, y: 0, z: 0 },
        side,
      ),
      2 * radius,
    );
  }
  TestValidator.equals(
    "the clearance screen changes nothing",
    complaints.slice(0, 20),
    [],
  );
}

/**
 * A forearm's overshoot as `HumanArmClearance.overshoot` documents it, read
 * with no screen: every shape queried at every one of the eight axis samples
 * and at the wrist. The elbow keeps its side of the chest's median plane by
 * the forearm's radius (no other arm is among the shapes), and each sample
 * keeps the forearm's radius falling linearly to the wrist but never below
 * the radius less the audit's 10 mm skin, the wrist's own depth excused in
 * proportion where a goal put it.
 */
function exhaustive(
  body: IAutoMovieMotionHumanBody,
  shapes: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  elbow: IAutoMovieVector3,
  wrist: IAutoMovieVector3,
  side: "left" | "right",
  others: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  goal: boolean,
): number {
  const radius: number = body.measure.forearmRadius;
  const tissue: number = 0.01;
  const own: (
    p: IAutoMovieVector3,
    centre: IAutoMovieVector3,
    out: IAutoMovieVector3,
  ) => number = (
    p: IAutoMovieVector3,
    centre: IAutoMovieVector3,
    out: IAutoMovieVector3,
  ): number =>
    (p.x - centre.x) * out.x +
    (p.y - centre.y) * out.y +
    (p.z - centre.z) * out.z;
  let depth: number = 0;
  const chest: IAutoMovieMotionHumanColliders.IPlaced | undefined =
    shapes.find(
      (s: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
        s.bone === "upperChest",
    ) ??
    shapes.find(
      (s: IAutoMovieMotionHumanColliders.IPlaced): boolean =>
        s.bone === "chest",
    );
  if (chest !== undefined) {
    const out: IAutoMovieVector3 = Quaternion.rotateVector(
      chest.pose.rotation,
      {
        x: side === "left" ? 1 : -1,
        y: 0,
        z: 0,
      },
    );
    const centre: IAutoMovieVector3 = chest.pose.position;
    depth = Math.max(
      0,
      Math.min(radius, own(wrist, centre, out)) - own(elbow, centre, out),
    );
  }
  const all: {
    segment: IAutoMovieMotionHumanColliders.IPlaced;
    free: boolean;
  }[] = [
    ...shapes.map(
      (
        segment: IAutoMovieMotionHumanColliders.IPlaced,
      ): {
        segment: IAutoMovieMotionHumanColliders.IPlaced;
        free: boolean;
      } => ({ segment, free: false }),
    ),
    ...others.map(
      (
        segment: IAutoMovieMotionHumanColliders.IPlaced,
      ): {
        segment: IAutoMovieMotionHumanColliders.IPlaced;
        free: boolean;
      } => ({ segment, free: true }),
    ),
  ];
  type IShape = IAutoMovieMotionHumanColliders.IPlaced["shapes"][number];
  const distance: (
    segment: IAutoMovieMotionHumanColliders.IPlaced,
    shape: IShape,
    p: IAutoMovieVector3,
  ) => number = (
    segment: IAutoMovieMotionHumanColliders.IPlaced,
    shape: IShape,
    p: IAutoMovieVector3,
  ): number => physicalShapeSegmentDistance(segment.pose, shape, p, p);
  let grazing: number = 0;
  if (goal)
    for (const { segment, free } of all)
      if (!free)
        for (const shape of segment.shapes)
          grazing = Math.min(grazing, distance(segment, shape, wrist));
  for (let i: number = 0; i < 8; i++) {
    const s: number = i / 8;
    const at: IAutoMovieVector3 = {
      x: elbow.x + (wrist.x - elbow.x) * s,
      y: elbow.y + (wrist.y - elbow.y) * s,
      z: elbow.z + (wrist.z - elbow.z) * s,
    };
    const needed: number = Math.max(radius * (1 - s), radius - tissue);
    for (const { segment, free } of all)
      for (const shape of segment.shapes)
        depth = Math.max(
          depth,
          needed + (free ? 0 : grazing * s) - distance(segment, shape, at),
        );
  }
  return ((depth / body.measure.upperArm) * 180) / Math.PI;
}
