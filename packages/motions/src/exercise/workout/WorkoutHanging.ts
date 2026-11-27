import type { IAutoMovieMotionHumanBody, IAutoMovieMotionHumanWorkoutHanging, IAutoMovieMotionHumanWorkoutKind } from "@automovie/interface";

import { ExerciseKey } from "../internal/ExerciseKey";
import { WorkoutKind } from "./WorkoutKind";
import {
  hang as WorkoutHangingDataHang,
  kind as WorkoutHangingDataKind,
} from "./internal/WorkoutHangingData";

/*
 * The exercises of the workout law done hanging from a bar by both hands (bars,
 * pull-ups): the dead hang, the pull-up, the chin-up, the hanging knee raise
 * and the swing.
 *
 * The fists' mean (the hands' grip sockets) stays on the bar and everything
 * else follows from the joints: a pull-up is the elbows' and the shoulders'
 * flexion with the hands fixed, so the body rises by what the arms shorten; a
 * swing is the whole body's pitch about the hands. Angles are provisional
 * (NSCA's Essentials of Strength Training, 4th ed., for the pull-up's top: the
 * chin over the bar, the elbows beside the ribs).
 *
 * First pass: the body is lifted to the bar from standing without a jump being
 * planned; a swing's rate is keyed, not a pendulum's; a chin-up differs from a
 * pull-up by the elbows kept ahead, the forearm's turn not written.
 */
export namespace WorkoutHanging {
  /*
   * The exercises.
   */
  export const KINDS: Readonly<
    Record<
      IAutoMovieMotionHumanWorkoutHanging.Name,
      IAutoMovieMotionHumanWorkoutKind
    >
  > = {
    /*
     * A dead hang, held 10 s.
     */
    deadHang: WorkoutHangingDataKind(
      1,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.pose(WorkoutHangingDataHang(body), 0, 10),
      ],
    ),

    /*
     * A pull-up: 1 s up, 1.5 s down (provisional).
     */
    pullUp: WorkoutHangingDataKind(
      3,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(WorkoutHangingDataHang(body), 1.5, "lower", "hang"),
        WorkoutKind.step(
          ExerciseKey.from(body, {}, { shoulder: 60, raise: 60, elbow: 140 }),
          1,
          "pull",
          "top",
        ),
      ],
    ),

    /*
     * A chin-up: the elbows kept ahead of the trunk.
     */
    chinUp: WorkoutHangingDataKind(
      3,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(WorkoutHangingDataHang(body), 1.5, "lower", "hang"),
        WorkoutKind.step(
          ExerciseKey.from(body, {}, { shoulder: 100, raise: 5, elbow: 145 }),
          1,
          "pull",
          "top",
        ),
      ],
    ),

    /*
     * A hanging knee raise: the thighs brought level.
     */
    kneeRaise: WorkoutHangingDataKind(
      5,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(WorkoutHangingDataHang(body), 1, "lower", "hang"),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            {},
            { hip: 90, knee: 90, shoulder: 178, raise: 10, elbow: 3 },
          ),
          1,
          "raise",
          "top",
        ),
      ],
    ),

    /*
     * A swing on the bar: the body pitched 25 degrees behind and ahead of the
     * hands (provisional).
     */
    barSwing: WorkoutHangingDataKind(
      3,
      (
        body: IAutoMovieMotionHumanBody,
      ): IAutoMovieMotionHumanWorkoutKind.IStep[] => [
        WorkoutKind.step(WorkoutHangingDataHang(body), 0.5, "pass", "under"),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: -25 },
            { hip: -15, shoulder: 165, raise: 10, elbow: 3 },
          ),
          0.5,
          "swingBack",
          "behind",
        ),
        WorkoutKind.step(
          ExerciseKey.from(
            body,
            { pitch: 25 },
            { hip: 30, shoulder: 150, raise: 10, elbow: 3 },
          ),
          0.9,
          "swing",
          "ahead",
        ),
      ],
    ),
  };
}
