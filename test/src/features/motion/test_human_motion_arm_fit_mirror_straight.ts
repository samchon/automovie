import type { IAutoMovieQuaternion } from "@automovie/interface";
import {
  AutoMovieMotionHumanArm,
  type IHumanPosture,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An arm straightened past its reach fits the same on either side: the left
 * arm's fit of a request mirrored in the median plane is the right arm's fit
 * mirrored, as the body is its own mirror.
 *
 * A thigh slapped while standing is leaned into, and the hand's goal lies
 * just past the straight arm (the slap's own arrival: the trunk leaned 30 to
 * 34 degrees, the palm laid on the thigh with its rotation, the bend hint and
 * the stroke's reference, the goal moved out by 0, 10 and 20 mm). With the
 * elbow straight the swivel only turns the upper arm about its own length,
 * so every swivel overshoots the shoulder's range by one amount, and what
 * parts them is the decomposition's rounding, which is not mirrored; the
 * ranking that read those digits turned the left arm's twist 14 degrees off
 * the right's, and to the other chart (180 degrees) at the slap's arrival.
 *
 * Scenarios, on the average man:
 * 1. Each of the 15 requests' left fit gives the right fit's clinical angles
 *    on the shoulder, the elbow and the wrist within 1e-5 degree (rounding
 *    through the fit, as `test_motion_split_distal_twist`'s mirror).
 * 2. At least 5 of the requests are met with the elbow straight (its flexion
 *    0), so scenario 1 reads the straight arm it is about.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves the real postures of the polygon man through the public resolver and reads the clinical angles it writes; a ranking that reads rounding digits fails three of the requests by 14 to 180 degrees.
 * @evidence contracts/development/testing.md#independent-expectations The body's rest bones are each other's mirror, so a mirrored request has the mirrored fit; the bound is the fit's rounding.
 * @evidence contracts/development/testing.md#distinguishing-cases Five leans and three reaches past the straight arm, bent and straight elbows among them, on both arms.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and resolves 30 postures in memory, in seconds; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the act, where the requests come from, why a straight arm is the case and the 2 scenarios with their bounds.
 */
export function test_human_motion_arm_fit_mirror_straight(): void {
  const body = motionHumanBody("m-average");
  const hand: IAutoMovieQuaternion = {
    x: -0.38515675514906855,
    y: -0.5480685035499147,
    z: -0.5646728859244284,
    w: -0.48209928570925653,
  };
  const request = (
    side: "left" | "right",
    lean: number,
    out: number,
  ): IHumanPosture => {
    const s: number = side === "right" ? 1 : -1;
    return {
      root: { x: 0, y: 0.16163033154866546, z: -0.5261963588588866 },
      yaw: 0,
      pitch: lean,
      roll: 0,
      joints: {
        spine: [3.9974700528856673, 0, 0],
        chest: [3.9974700528856673, 0, 0],
        neck: [-20, 0, 0],
        head: [12.005059894254373, 0, 0],
      },
      limbs: {
        [`${side}Arm`]: {
          point: {
            x: s * (-0.11860429292290262 - out),
            y: 0.7723869928421696,
            z: 0.18149775956010597,
          },
          rotation:
            side === "right"
              ? hand
              : { x: hand.x, y: -hand.y, z: -hand.z, w: hand.w },
          bend: {
            x: s * -0.1755733556734619,
            y: 1.2120646069448684,
            z: -0.3786623243193796,
          },
          contact: {
            x: s * -0.04410114031684509,
            y: -0.02809251226887377,
            z: 0,
          },
          reference: {
            upper: [23.178066207869172, 4.238677883803305, -49.877460944654686],
            lower: [25.927119191962216, 0, 36.27476618174254],
          },
        },
      },
    };
  };
  const complaints: string[] = [];
  let straight: number = 0;
  // The leans around the slap's own, 32.3061155207404 degrees.
  for (const lean of [30, 31, 32.3061155207404, 33, 34])
    for (const out of [0, 0.01, 0.02]) {
      const right: AutoMovieMotionHumanArm.IAngles =
        AutoMovieMotionHumanArm.angles(
          resolveHumanPosture(body, request("right", lean, out)),
          "right",
        );
      const left: AutoMovieMotionHumanArm.IAngles =
        AutoMovieMotionHumanArm.angles(
          resolveHumanPosture(body, request("left", lean, out)),
          "left",
        );
      if (right.lower[0] === 0) ++straight;
      for (const joint of ["upper", "lower", "hand"] as const) {
        const apart: number = Math.max(
          ...[0, 1, 2].map((i: number): number =>
            Math.abs(right[joint][i]! - left[joint][i]!),
          ),
        );
        if (apart > 1e-5)
          complaints.push(
            `lean ${lean} out ${out * 1000} mm: the left ${joint} stands ${apart.toFixed(6)} degrees off the right's (right ${right[joint].map((x: number): string => x.toFixed(3)).join("/")}, left ${left[joint].map((x: number): string => x.toFixed(3)).join("/")})`,
          );
      }
    }
  if (straight < 5)
    complaints.push(
      `${straight} of the 15 requests are met with the elbow straight, at least 5 expected`,
    );
  TestValidator.equals(
    "a straight arm fits the same on either side",
    complaints,
    [],
  );
}
