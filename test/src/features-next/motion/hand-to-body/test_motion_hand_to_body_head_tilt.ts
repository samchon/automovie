import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanHeadTilt,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { HUMAN_EVERYDAY_LAWS } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/**
 * A person inclines their head while walking and returns to the carrier's
 * head posture without breaking stride.
 *
 * Scenarios:
 * 1. On two bodies, each side reaches and holds the authored roll within 0.5 degrees, with no added pitch or twist.
 * 2. At the start and finish, the added roll is within 0.5 degrees of zero. Throughout the sampled phrase, pelvis and ankles stay within 1 mm of the unlayered walk.
 * 3. Angles beyond the admitted range and durations below 0.6 seconds are refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the action is exercised in playback and gives the angular, positional and admission bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the registered overlay through the public performance and reads the posed joints and ankle positions against the same walk without the overlay.
 * @evidence contracts/development/testing.md#independent-expectations The expected roll is the author's requested angle. Root and ankle positions come from the independent carrier. The tolerances allow small numerical differences.
 * @evidence contracts/development/testing.md#distinguishing-cases Both signed directions include the largest admitted magnitude, on two different Human bodies. Adjacent invalid angle and duration values are refused.
 * @evidence contracts/development/testing.md#execution-ownership A native motion feature test using prepared Human bodies and public performance. It uses no viewer or external host.
 */
export function test_motion_hand_to_body_head_tilt(): void {
  const Chain = HumanChain.extend(HUMAN_EVERYDAY_LAWS);
  for (const name of ["m-average", "f-small"] as const) {
    const walk = Chain.subject("a")
      .stand({ hold: 0.3 })
      .walk({ to: { x: 0, y: 0, z: 2 } });
    const performer: IAutoMovieMotionHumanPerformance.IInput["performers"][number] =
      {
        subject: "a",
        body: motionHumanBody(name),
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      };
    const perform = (
      params?: IAutoMovieMotionHumanHeadTilt,
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "head tilt",
        laws: Object.values(HUMAN_EVERYDAY_LAWS),
        performers: [performer],
        composition: (params === undefined
          ? walk
          : walk.over((overlay) => overlay.headTilt(params))
        ).node,
      });
    const carrier: HumanPerformance = perform();
    for (const degrees of [-20, 20] as const) {
      const film: HumanPerformance = perform({ degrees });
      const tilt: IAutoMovieMotionHumanSegment.IOverlay =
        film.overlays("a")[0]!;
      const duration: number = tilt.end - tilt.start;
      for (const [share, expected] of [
        [0, 0],
        [1 / 3, degrees],
        [1 / 2, degrees],
        [2 / 3, degrees],
        [1, 0],
      ] as const) {
        const at: number = tilt.start + share * duration;
        const tilted: IAutoMoviePose = film.pose("a", at);
        const original: IAutoMoviePose = carrier.pose("a", at);
        const cervical = (
          pose: IAutoMoviePose,
          axis: "flexion" | "abduction" | "twist",
        ): number =>
          (pose.joints.find((joint) => joint.bone === "neck")?.[axis] ?? 0) +
          (pose.joints.find((joint) => joint.bone === "head")?.[axis] ?? 0);
        const delta = (axis: "flexion" | "abduction" | "twist"): number =>
          cervical(tilted, axis) - cervical(original, axis);
        TestValidator.predicate(
          `${name} rolls ${expected} degrees at ${share}`,
          nclose(delta("abduction"), expected, 0.5) &&
            nclose(delta("flexion"), 0, 0.5) &&
            nclose(delta("twist"), 0, 0.5),
        );
        const posed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          film.bones("a", at);
        const unlayered: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          carrier.bones("a", at);
        TestValidator.predicate(
          `${name} keeps the pelvis and ankles at ${share}`,
          (["hips", "leftFoot", "rightFoot"] as const).every((bone): boolean =>
            vclose(
              posed.get(bone)!.worldPosition,
              unlayered.get(bone)!.worldPosition,
              0.001,
            ),
          ),
        );
      }
    }
    TestValidator.error(`${name} refuses an extra degree`, (): void => {
      perform({ degrees: 21 });
    });
    TestValidator.error(`${name} refuses a 0.59 s phrase`, (): void => {
      perform({ degrees: 15, duration: 0.59 });
    });
  }
}
