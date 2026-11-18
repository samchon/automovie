import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanHand,
  HumanPerformance,
  HumanSport,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { LexiconRowNet } from "../internal/LexiconRowNet";
import { motionHumanBody } from "../internal/motionHumanBody";
import { profileHumanMotion } from "../internal/profileHumanMotion";

/**
 * A child's pose lowers both knees and a toe touch reaches the top of the right foot while the left hand braces on the thigh.
 *
 * Scenarios:
 * 1. The short, average and large builds enter the full authored holds from the same stand. Measure both knees at the seat-on-heels event and both hands at the deepest bend.
 * 2. Cross the other named rows over builds. Each fixed yoga support, slide and additional swimming stroke must still plan under its name.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the real figure, contact and support observations.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the two knees or the two palms and target foot from the displayed skeleton at the public event. A failure to plan records the exact row and build.
 * @evidence contracts/development/testing.md#independent-expectations The knee height uses the kneeling pose tests' six percent of stature. The foot target and support hand follow the toe touch and bend contract, with the arm region's ten-millimetre allowance.
 * @evidence contracts/development/testing.md#distinguishing-cases Retains all three builds for the narrow hand contact and seated-on-heels geometry. The other supports and strokes have one standing entry each.
 * @evidence contracts/development/testing.md#execution-ownership Builds one local performance per selected row and body, observes both relevant sites in one resolved skeleton and releases the film.
 */
export function test_human_motion_lexicon_rows_sport_remaining(): void {
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small", "m-large"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const pose of ["childsPose", "toeTouch"] as const) {
      try {
        const film: IAutoMovieMotionHumanPerformance = profileHumanMotion(
          pose + "/" + name,
          (): IAutoMovieMotionHumanPerformance =>
            new HumanPerformance({
              seed: "lexicon",
              laws: [HumanSport[pose]],
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
                .stand({ seconds: 0.3 })
                .registered(pose).node,
            }),
          ["a"],
          pose,
        );
        const segment: IAutoMovieMotionHumanSegment = film.segments("a")[1]!;
        if (segment.name !== pose || !(segment.end > segment.entryTime))
          throw new Error(
            "expected a positive-duration " + pose + " after the stand",
          );
        const event: string = pose === "childsPose" ? "seatOnHeels" : "deepest";
        const share: number | undefined = segment.plan.events.find(
          (
            entry: IAutoMovieMotionHumanSegment["plan"]["events"][number],
          ): boolean => entry.name === event,
        )?.share;
        if (share === undefined) throw new Error("missing " + event);
        const bones: ReturnType<IAutoMovieMotionHumanPerformance["bones"]> =
          film.bones("a", segment.start + share * segment.plan.duration);
        if (pose === "childsPose") {
          const high: number = Math.max(
            bones.get("leftLowerLeg")!.worldPosition.y,
            bones.get("rightLowerLeg")!.worldPosition.y,
          );
          if (!(high <= 0.06 * body.measure.stature))
            complaints.push(
              name + " child's pose higher knee at " + high + " m above floor",
            );
        } else {
          const foot: IAutoMovieHumanoidSurfaces.IFrame =
            body.surfaces.regions.footTopRight;
          const target: ReturnType<
            typeof resolveAutoMovieHumanoidSurfaces.place
          > = resolveAutoMovieHumanoidSurfaces.place(
            foot,
            bones.get(foot.bone)!,
          );
          const palm: IAutoMovieMotionHumanHand.IFrame = HumanHand.frame(
            body,
            bones,
            "right",
            "palm",
            "flat",
          );
          const delta: IAutoMovieVector3 = Vector3.subtract(
            palm.point,
            target.point,
          );
          const miss: number = Vector3.length(
            Vector3.subtract(
              delta,
              Vector3.scale(target.normal, Vector3.dot(delta, target.normal)),
            ),
          );
          if (!(miss <= 0.01))
            complaints.push(
              name +
                " toe touch palm misses the foot site along its surface by " +
                miss +
                " m",
            );
          const knee: IAutoMovieVector3 =
            bones.get("leftLowerLeg")!.worldPosition;
          const femur: IAutoMovieVector3 = Vector3.subtract(
            bones.get("leftUpperLeg")!.worldPosition,
            knee,
          );
          const brace: IAutoMovieMotionHumanHand.IFrame = HumanHand.frame(
            body,
            bones,
            "left",
            "palm",
            "flat",
          );
          const axis: IAutoMovieVector3 = Vector3.normalize(femur);
          const offset: IAutoMovieVector3 = Vector3.subtract(brace.point, knee);
          const along: number = Vector3.dot(offset, axis);
          const radial: IAutoMovieVector3 = Vector3.subtract(
            offset,
            Vector3.scale(axis, along),
          );
          if (!(Vector3.dot(brace.normal, radial) < 0))
            complaints.push(
              name + " toe touch support palm faces away from its thigh",
            );
          if (
            !(
              along >= body.measure.hand / 2 - 0.01 &&
              along <= Vector3.length(femur) - body.measure.hand / 2 + 0.01
            )
          )
            complaints.push(
              name +
                " toe touch support palm lies " +
                along +
                " m along the thigh from the knee",
            );
        }
      } catch (error) {
        complaints.push(
          pose +
            "/" +
            name +
            ": " +
            (error instanceof Error ? error.message : String(error)),
        );
      }
    }
  }
  complaints.push(
    ...LexiconRowNet.rows(
      "sport",
      ["defensiveSlide", "hipFlexorStretch", "floating"],
      false,
      "m-average",
    ),
    ...LexiconRowNet.rows(
      "sport",
      ["chairPose", "breaststroke"],
      false,
      "f-small",
    ),
    ...LexiconRowNet.rows(
      "sport",
      ["corpsePose", "backstroke"],
      false,
      "m-large",
    ),
  );
  TestValidator.equals(
    "sport supports, foot contact and swimming entries",
    complaints,
    [],
  );
}
