import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanArmClearance,
  type HumanColliders,
  type IHumanBody,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The bounding-sphere screen of a forearm's clearance changes nothing: the
 * overshoot read with the screen is the overshoot read without it, to the
 * last bit, for arms that hang clear, brush the flank, cross the chest and
 * reach into the thigh.
 *
 * Scenarios, the average man and the small woman, each standing upright
 * with the colliders of the trunk and both thighs placed: a sweep of elbow
 * and wrist places on a grid around each shoulder (elbows from the flank
 * outward and forward, wrists from beside the thigh to across the chest
 * and in front of the face), each read for the left and the right arm,
 * with the wrist's goal excusing its own depth and without, and against
 * the other body's colliders as `others`. Every reading with the screen
 * equals the reading without it as a number.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public `HumanArmClearance.overshoot` on real bodies' placed colliders with the screen on and off; a screen that spares a query whose result would have raised the depth fails.
 * @evidence contracts/development/testing.md#independent-expectations The reading without the screen is the oracle; the screen claims to change nothing, so any difference is a defect, whatever its size.
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
    body: IHumanBody;
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  } => {
    const body: IHumanBody = motionHumanBody(name);
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
    const shapes: HumanColliders.IPlaced[] = HumanArmClearance.obstacles(
      me.body,
      me.bones,
    );
    const others: HumanColliders.IPlaced[] = HumanArmClearance.trunk(
      other.body,
      other.bones,
    );
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
                  ] as readonly (readonly HumanColliders.IPlaced[])[]) {
                    const read = (on: boolean): number => {
                      HumanArmClearance.broad(on);
                      return HumanArmClearance.overshoot(
                        me.body,
                        shapes,
                        elbow,
                        wrist,
                        side,
                        against,
                        goal,
                      );
                    };
                    const full: number = read(false);
                    const screened: number = read(true);
                    ++compared;
                    if (!Object.is(full, screened))
                      complaints.push(
                        `${pair[k]!} ${side} arm, elbow (${ex}, ${ez}), wrist (${wx}, ${wy}, ${wz}), goal ${goal}, ${against.length === 0 ? "alone" : "beside the other body"}: ${screened} degrees with the screen and ${full} without`,
                      );
                  }
              }
        }
    }
  }
  HumanArmClearance.broad(true);
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
