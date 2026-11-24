import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanDress,
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { AutoMovieMotionHumanTouchEffector } = AutoMovieMotionHumanTouch;

/**
 * Stage a short smoothing movement along the front blade of a tie.
 *
 * Scenarios:
 * 1. The selected hand reaches the sternum within 3 cm.
 * 2. The fingertips descend by at least 2.5 cm between the stroke's quarter points and stay within 3 cm horizontally.
 * @evidence contracts/development/common.md#meaningful-documentation States the target and vertical travel bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads displayed fingertips against the fitted sternum and compares the high and low points of the smoothing movement.
 * @evidence contracts/development/testing.md#independent-expectations Uses the actor's displayed sternum as the landmark and checks a visible vertical movement with tightly bounded horizontal drift.
 * @evidence contracts/development/testing.md#distinguishing-cases Contact at the center and movement across two opposite phases distinguish a reach, a stationary grasp and a horizontal rub from the vertical pass.
 * @evidence contracts/development/testing.md#execution-ownership Builds a polygon performer and samples three poses through the public performance, with no host.
 */
export function test_motion_dress_straighten_tie(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("f-average");
  const film: HumanPerformance = new HumanPerformance({
    seed: "tie",
    performers: [
      {
        subject: "actor",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: AutoMovieMotionHumanDress.composeHumanStraightenTie(
      HumanChain.subject("actor"),
      "left",
      "tie",
    ).node,
  });
  const segment: IAutoMovieMotionHumanSegment = film.segments("actor")[0]!;
  const instant = (name: string): number =>
    segment.start +
    segment.plan.duration *
      segment.plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === name,
      )!.share;
  const offset = (seconds: number): IAutoMovieVector3 => {
    const bones: ReturnType<HumanPerformance["bones"]> = film.bones(
      "actor",
      seconds,
    );
    const region: (typeof body.surfaces.regions)["sternum"] =
      body.surfaces.regions.sternum;
    const chest: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
      region,
      bones.get(region.bone)!,
    ).point;
    return Vector3.subtract(
      AutoMovieMotionHumanTouchEffector.point(
        body,
        bones,
        "left",
        AutoMovieMotionHumanTouch.touch.EFFECTORS.fingertips,
      ),
      chest,
    );
  };
  const start: number = instant("strokeStart");
  const duration: number = instant("strokeEnd") - start;
  const travel: IAutoMovieVector3 = Vector3.subtract(
    offset(start + 0.25 * duration),
    offset(start + 0.75 * duration),
  );
  TestValidator.predicate(
    "the smoothing hand meets the tie at the sternum",
    Vector3.length(offset(instant("ready"))) < 0.03,
  );
  TestValidator.predicate(
    "the fingertips travel along the vertical blade of the tie",
    travel.y > 0.025 && Math.hypot(travel.x, travel.z) < 0.03,
  );
}
