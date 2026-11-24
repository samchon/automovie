import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanPerformance,
  AutoMovieMotionHumanGetDressed,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { AutoMovieMotionHumanTouchEffector, AutoMovieMotionHumanTouchForm } =
  AutoMovieMotionHumanTouch;

/**
 * Stage wrist presentation and fingertip placement for a cuff adjustment.
 *
 * Scenarios:
 * 1. Each cuff comes forward by at least 8 cm and meets the opposite fingertips within 3 cm.
 * 2. The hand contact is on the selected wrist during the anchored adjustment.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the mirrored cases and the bounds on presentation and contact.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the placed contact window and posed bones through HumanPerformance.
 * @evidence contracts/development/testing.md#independent-expectations Advances a worn cuff toward the other hand by a visible distance and compares the fingertips against the wrist surface on the displayed body.
 * @evidence contracts/development/testing.md#distinguishing-cases Left and right cuffs exercise opposite reaching and presenting arms.
 * @evidence contracts/development/testing.md#execution-ownership Builds two in-memory performances with one shared polygon body and samples only the entry and decisive poses.
 */
export function test_motion_get_dressed_adjust_cuff(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  for (const cuff of ["left", "right"] as const) {
    const hand: AutoMovieHumanSide = cuff === "left" ? "right" : "left";
    const wrist: "wristLeft" | "wristRight" =
      cuff === "left" ? "wristLeft" : "wristRight";
    const film: HumanPerformance = new HumanPerformance({
      seed: "cuff",
      performers: [
        {
          subject: "actor",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: AutoMovieMotionHumanGetDressed.adjustCuff(
        HumanChain.subject("actor"),
        { cuff },
        "cuff",
      ).node,
    });
    const segment: IAutoMovieMotionHumanSegment = film.segments("actor")[0]!;
    const ready: number =
      segment.start +
      segment.plan.duration *
        segment.plan.events.find(
          (event: IAutoMovieMotionEvent): boolean => event.name === "ready",
        )!.share;
    const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
      "actor",
      ready,
    );
    const region: (typeof body.surfaces.regions)[typeof wrist] =
      body.surfaces.regions[wrist];
    const target: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      region,
      bones.get(region.bone)!,
    ).point;
    const fingertips: IAutoMovieVector3 =
      AutoMovieMotionHumanTouchEffector.point(
        body,
        bones,
        hand,
        AutoMovieMotionHumanTouchForm.curled(
          AutoMovieMotionHumanTouch.touch.EFFECTORS.fingertips,
          "squeeze",
        ),
      );
    const before: IAutoMovieVector3 = film
      .bones("actor", segment.start)
      .get(`${cuff}Hand`)!.worldPosition;
    const presented: IAutoMovieVector3 = bones.get(
      `${cuff}Hand`,
    )!.worldPosition;
    TestValidator.predicate(
      `${cuff} cuff is presented forward`,
      presented.z - before.z > 0.08,
    );
    TestValidator.predicate(
      `${hand} fingertips reach the ${cuff} cuff`,
      Vector3.length(Vector3.subtract(fingertips, target)) < 0.03,
    );
    TestValidator.equals(
      "the placed adjustment retains its anchor",
      film.schedule.entries[0]!.intent.anchor,
      "cuff",
    );
    TestValidator.predicate(
      "the contact is on the selected cuff",
      segment.plan.contacts.some(
        (contact: IAutoMovieMotionHumanContactWindow): boolean =>
          contact.part === `${hand}Hand` &&
          contact.support.kind === "person" &&
          contact.support.subject === "actor" &&
          "region" in contact.support &&
          contact.support.region === wrist,
      ),
    );
  }
}
