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
 * Scenarios, the average man and the small woman, each standing upright
 * with the colliders of the trunk and both thighs placed: a sweep of elbow
 * and wrist places on a grid around each shoulder (elbows from the flank
 * outward and forward, wrists from beside the thigh to across the chest
 * and in front of the face), each read for the left and the right arm,
 * with the wrist's goal excusing its own depth and without, and against
 * the other body's colliders as `others`. Every reading with the screen
 * equals the exhaustive reading.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public `HumanArmClearance.overshoot` on real bodies' placed colliders against the exhaustive reading; a screen that spares a query whose result would have raised the depth fails.
 * @evidence contracts/development/testing.md#independent-expectations The exhaustive reading of the documented rule, written here, is the oracle; the screen claims to change nothing, so any difference beyond 1e-12 degrees, the rounding of a prepared against a direct distance query, is a defect.
 * @evidence contracts/development/testing.md#distinguishing-cases Arms clear of every shape, against the flank, across the chest, inside a thigh and inside another body, on both sides, with and without a goal.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and reads a few thousand overshoots with no performance; one standing pose each, since the screen reads the shapes, not the pose.
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
  const pair: readonly ["m-average", "f-small"] = ["m-average", "f-small"];
  let compared: number = 0;
  for (let k: number = 0; k < pair.length; ++k) {
    const me: ReturnType<typeof stand> = stand(pair[k]!, 0);
    const other: ReturnType<typeof stand> = stand(pair[1 - k]!, 0.35);
    const shapes: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanArmClearance.obstacles(me.body, me.bones);
    const others: IAutoMovieMotionHumanColliders.IPlaced[] =
      HumanArmClearance.trunk(other.body, other.bones);
    for (const side of ["left", "right"] as const) {
      const shoulder: IAutoMovieVector3 = me.bones.get(
        `${side}UpperArm`,
      )!.worldPosition;
      const sign: number = side === "left" ? 1 : -1;
      const upper: number = me.body.measure.upperArm;
      const fore: number = me.body.measure.forearm;
      for (const ex of [-0.3, 0, 0.3])
        for (const ez of [0, 0.5, 1]) {
          const elbow: IAutoMovieVector3 = {
            x: shoulder.x + sign * ex * upper,
            y: shoulder.y - upper * Math.sqrt(Math.max(0.05, 1 - ex * ex)),
            z: shoulder.z + ez * upper * 0.6,
          };
          for (const wx of [-1.2, -0.6, 0, 0.4])
            for (const wy of [-1, -0.4, 0.3])
              for (const wz of [-0.2, 0.3, 0.9]) {
                const wrist: IAutoMovieVector3 = {
                  x: elbow.x + sign * wx * fore,
                  y: elbow.y + wy * fore,
                  z: elbow.z + wz * fore,
                };
                for (const goal of [true, false])
                  for (const against of [
                    [],
                    others,
                  ] as readonly (readonly IAutoMovieMotionHumanColliders.IPlaced[])[]) {
                    const full: number = exhaustive(
                      me.body,
                      shapes,
                      elbow,
                      wrist,
                      side,
                      against,
                      goal,
                    );
                    const screened: number = HumanArmClearance.overshoot(
                      me.body,
                      shapes,
                      elbow,
                      wrist,
                      side,
                      against,
                      goal,
                    );
                    ++compared;
                    if (!(Math.abs(full - screened) <= 1e-12))
                      complaints.push(
                        `${pair[k]!} ${side} arm, elbow (${ex}, ${ez}), wrist (${wx}, ${wy}, ${wz}), goal ${goal}, ${against.length === 0 ? "alone" : "beside the other body"}: ${screened} degrees with the screen and ${full} without`,
                      );
                  }
              }
        }
    }
  }
  if (compared < 1000)
    complaints.push(
      `only ${compared} readings compared, at least 1000 expected`,
    );
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
  const own: (p: IAutoMovieVector3, centre: IAutoMovieVector3, out: IAutoMovieVector3) => number = (
    p: IAutoMovieVector3, centre: IAutoMovieVector3, out: IAutoMovieVector3,
  ): number =>
    (p.x - centre.x) * out.x + (p.y - centre.y) * out.y + (p.z - centre.z) * out.z;
  let depth: number = 0;
  const chest: IAutoMovieMotionHumanColliders.IPlaced | undefined =
    shapes.find((s: IAutoMovieMotionHumanColliders.IPlaced): boolean => s.bone === "upperChest") ??
    shapes.find((s: IAutoMovieMotionHumanColliders.IPlaced): boolean => s.bone === "chest");
  if (chest !== undefined) {
    const out: IAutoMovieVector3 = Quaternion.rotateVector(chest.pose.rotation, {
      x: side === "left" ? 1 : -1,
      y: 0,
      z: 0,
    });
    const centre: IAutoMovieVector3 = chest.pose.position;
    depth = Math.max(0, Math.min(radius, own(wrist, centre, out)) - own(elbow, centre, out));
  }
  const all: { segment: IAutoMovieMotionHumanColliders.IPlaced; free: boolean }[] = [
    ...shapes.map((segment: IAutoMovieMotionHumanColliders.IPlaced): { segment: IAutoMovieMotionHumanColliders.IPlaced; free: boolean } => ({ segment, free: false })),
    ...others.map((segment: IAutoMovieMotionHumanColliders.IPlaced): { segment: IAutoMovieMotionHumanColliders.IPlaced; free: boolean } => ({ segment, free: true })),
  ];
  type IShape = IAutoMovieMotionHumanColliders.IPlaced["shapes"][number];
  const distance: (segment: IAutoMovieMotionHumanColliders.IPlaced, shape: IShape, p: IAutoMovieVector3) => number = (
    segment: IAutoMovieMotionHumanColliders.IPlaced, shape: IShape, p: IAutoMovieVector3,
  ): number =>
    physicalShapeSegmentDistance(segment.pose, shape, p, p);
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
        depth = Math.max(depth, needed + (free ? 0 : grazing * s) - distance(segment, shape, at));
  }
  return ((depth / body.measure.upperArm) * 180) / Math.PI;
}