import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import {
  AutoMovieMotionHumanReach,
  HumanHand,
  HumanSport,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";

import { motionComplaints } from "../../../internal/motionComplaints";
import { motionContactArmFixture as fixture } from "../../../internal/motionContactArmFixture";
import { motionHumanBody } from "../../../internal/motionHumanBody";

/**
 * Both palms in the public two-arm stage motion must follow their own
 * shoulder-relative targets.
 *
 * Scenarios:
 *
 * 1. Resolve the same public standing entry and the same named exercise on the
 *    small, average and large bodies.
 * 2. Measure each palm at the near and far phases and compare against the body's
 *    chest level and bilateral reach grid.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Both palms in the public two-arm stage motion must follow their own shoulder-relative targets.
 * @evidence contracts/development/testing.md#independent-expectations The physical sites are the authored chest-height grid locations at a quarter and four-fifths of the arm length. The 10 mm site disk and 1 mm FK allowance apply separately to each palm.
 * @evidence contracts/development/testing.md#distinguishing-cases Resolve the same public standing entry and the same named exercise on the small, average and large bodies. Measure each palm at the near and far phases and compare against the body's chest level and bilateral reach grid.
 * @evidence contracts/development/testing.md#execution-ownership Runs the named public operation in memory and samples its observable outputs.
 * @evidence contracts/development/common.md#meaningful-documentation States the phase, coordinate frame and quantitative basis of the check.
 */
export function test_motion_contact_two_arm_coordination(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["f-small", "m-average", "m-large"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const rest = AutoMovieMotionHumanStance.stand.posture(
      body,
      { x: 0, y: 0, z: 0 },
      0,
    );
    const resting = poseBones(body, resolveHumanPosture(body, rest));
    const shoulder0 = resting.get("leftUpperArm")!.worldPosition;
    const outside = Vector3.add(shoulder0, {
      x: 0,
      y: 0,
      z: body.measure.upperArm + body.measure.forearm + body.measure.hand,
    });
    let refused = false;
    try {
      AutoMovieMotionHumanReach.fit(body, rest, "leftArm", outside, "refuse");
    } catch (error: unknown) {
      refused = error instanceof Error;
    }
    all.check(
      `${name}: a fixed-shoulder marker beyond both links is refused`,
      refused,
    );
    try {
      const film: HumanPerformance = new HumanPerformance({
        seed: "lexicon",
        laws: [HumanSport.taiChiPush],
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
          .registered("taiChiPush", {}).node,
      });
      const span: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
      const arm: number = body.measure.upperArm + body.measure.forearm;
      for (const [event, share] of [
        ["strokeStart", 0.25],
        ["stroke", 0.8],
        ["strokeEnd", 0.25],
      ] as const) {
        const time: number =
          span.start +
          span.plan.duration *
            span.plan.events.find((item) => item.name === event)!.share;
        const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
          "a",
          time,
        );
        const gap: number = fixture.separation(
          body,
          bones,
          /^left(Hand|Thumb|Index|Middle|Ring|Little)/,
          body,
          bones,
          /^right(Hand|Thumb|Index|Middle|Ring|Little)/,
        );
        all.check(
          `the two moving hands do not penetrate beyond the skin allowance: ${gap} m`,
          gap >= -0.01,
        );
        for (const side of ["left", "right"] as const) {
          const shoulder: IAutoMovieVector3 = bones.get(
            `${side}UpperArm`,
          )!.worldPosition;
          const target: IAutoMovieVector3 = Vector3.add(shoulder, {
            x:
              (side === "left" ? -1 : 1) * 0.4 * body.measure.shoulderHalfWidth,
            y: body.measure.chestHeight - body.measure.shoulderHeight,
            z: arm * share,
          });
          const palm: IAutoMovieVector3 = HumanHand.frame(
            body,
            bones,
            side,
            "palm",
            "flat",
          ).point;
          const error: number = Vector3.distance(target, palm);
          all.check(
            `${name} ${event}: ${side} palm misses by ${error} m`,
            error <= 0.011,
          );
        }
      }
    } catch (error: unknown) {
      all.check(
        `${name}: public two-arm stage must admit its original body: ${String(error)}`,
        false,
      );
    }
  }
  all.assert("both arm channels share the planted stage");
}
