import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidRegion,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanHandToBody,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A hair tuck follows the same-side ear on a bare polygon man.
 *
 * Scenarios:
 *
 * 1. The smallest body's right fingertip and the largest body's left fingertip
 *    sweep from in front of the respective ear to behind it, at ear height.
 * 2. In both cases, the hand retracts to its entry height after the sweep.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the two bodies, handedness, ear-relative trajectory and return.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the named row through a public chain and measures the posed fingertip against the corresponding ear at both stroke boundaries and its height at entry and exit.
 * @evidence contracts/development/testing.md#independent-expectations Checks the order of the fingertip around the ear, proximity to that ear, and return toward rest, without reconstructing the row's offsets or timing.
 * @evidence contracts/development/testing.md#distinguishing-cases Opposite hands on two contrasting body sizes distinguish a mirrored tuck from a same-side-only or stationary pose.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two standard bare bodies and samples the public performance without a viewer.
 */
export function test_motion_hand_to_body_tuck_hair(): void {
  for (const [name, side] of [
    ["f-small", "right"],
    ["m-large", "left"],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "hair-tuck",
      laws: [AutoMovieMotionHumanHandToBody.tuckHair],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ hold: 0.3 })
        .registered("tuckHair", { hand: side }).node,
    });
    const segment: IAutoMovieMotionHumanSegment = performance
      .segments("a")
      .at(-1)!;
    const region: AutoMovieHumanoidRegion =
      side === "right" ? "earRight" : "earLeft";
    const ear: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions[region];

    /** Return the posed fingertip relative to the ear at a time within the tuck. */
    const point: (share: number) => IAutoMovieVector3 = (
      share: number,
    ): IAutoMovieVector3 => {
      const bones: ReturnType<IAutoMovieMotionHumanPerformance["bones"]> =
        performance.bones("a", segment.start + share * segment.plan.duration);
      return Vector3.subtract(
        HumanHand.frame(body, bones, side, "indexTip", "relaxed").point,
        resolveAutoMovieHumanoidSurfaces.place(ear, bones.get(ear.bone)!).point,
      );
    };
    const front: IAutoMovieVector3 = point(
      segment.plan.events.find((event) => event.name === "strokeStart")
        ?.share ?? NaN,
    );
    const back: IAutoMovieVector3 = point(
      segment.plan.events.find((event) => event.name === "strokeEnd")?.share ??
        NaN,
    );
    TestValidator.predicate(
      `${name} ${side}: the fingertip sweeps past the near ear from front to back`,
      front.z > 0.01 &&
        back.z < -0.01 &&
        Math.abs(front.y) < 0.09 &&
        Math.abs(back.y) < 0.06 &&
        Vector3.length(front) < 0.15 &&
        Vector3.length(back) < 0.1,
    );
    TestValidator.predicate(
      `${name} ${side}: the hand returns to its entry height`,
      Math.abs(point(1).y - point(0).y) < 0.04,
    );
  }
}
