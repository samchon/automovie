import type { IAutoMovieMotionHumanPerformanceState } from "@automovie/interface";
import {
  HumanPerformanceObject
} from "../../../../../packages/motions/src/perform/internal/HumanPerformanceObject";
import { TestValidator } from "@nestia/e2e";

/**
 * `HumanPerformanceObject.travel` gives one input per coupled degree of freedom
 * of a prop at a second from its writers in film order: the latest writer begun
 * of each degree, read within its window and held at its last travel after it;
 * a later writer of another coordinate of the same degree replaces the old
 * one.
 *
 * A door's hinge is written by one action from 0 to 1 s at 10 degrees a second,
 * and by another, in its mirrored coordinate, from 2 to 3 s.
 *
 * Scenarios:
 *
 * 1. Before any writer the record is empty.
 * 2. Inside the first writer, its travel: 5 at 0.5 s.
 * 3. After it, its last travel held: 10 at 1.5 s.
 * 4. Inside the second, its coordinate alone: 102.5 at 2.5 s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names writer activation, held travel after a window, and replacement by a coupled coordinate sharing the same leader.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `HumanPerformanceObject.travel` with two typed writer records and checks exact travel maps before, inside and after their windows.
 * @evidence contracts/development/testing.md#independent-expectations The first writer gives 10t degrees and stops at 1 s, so at 0.5 and 1.5 s the values are 5 and 10. The mirror writer evaluates 100 + 2.5 as 102.5 and is the only key because it shares the hinge leader.
 */
export function test_motions_perform_object_state(): void {
  const writers: readonly IAutoMovieMotionHumanPerformanceState.IWriter[] = [
    {
      articulation: "hinge",
      leader: "hinge",
      from: 0,
      to: 1,
      travel: (seconds: number): number => 10 * seconds,
    },
    {
      articulation: "hingeMirror",
      leader: "hinge",
      from: 2,
      to: 3,
      travel: (seconds: number): number => 100 + seconds,
    },
  ];
  const at = (seconds: number): Record<string, number> =>
    HumanPerformanceObject.travel(writers, seconds);

  TestValidator.equals("before any writer", at(-1), {});
  TestValidator.equals("inside the first", at(0.5), { hinge: 5 });
  TestValidator.equals("held after it", at(1.5), { hinge: 10 });
  TestValidator.equals("the second replaces its coordinate", at(2.5), {
    hingeMirror: 102.5,
  });
}
