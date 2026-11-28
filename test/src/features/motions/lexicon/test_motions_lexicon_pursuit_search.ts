import type {
  IAutoMovieMotionHumanLayer,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanPursuit
} from "../../../../../packages/motions/src/lexicon/internal/HumanPursuit";
import { TestValidator } from "@nestia/e2e";

/** A chain that records the walks and stands it is given. */
class Recorder {
  public constructor(public readonly steps: readonly string[] = []) {}

  public walk(params: { to: IAutoMovieVector3 }): Recorder {
    return new Recorder([...this.steps, `walk ${params.to.x},${params.to.z}`]);
  }

  public stand(params: { hold: number }, anchor?: string): Recorder {
    return new Recorder([
      ...this.steps,
      `stand ${params.hold} ${anchor ?? "-"}`,
    ]);
  }
}

/**
 * A search: `HumanPursuit.search` walks to each place and stands there a pause
 * under an anchor of its own, and `sweeps` schedules a look either way over
 * each of those stands.
 *
 * Scenarios:
 *
 * 1. Two places walk to the first, stand the default 2 s as `search0`, walk to the
 *    second and stand as `search1`; a named search with a 1 s pause anchors
 *    `look0` and stands 1 s.
 * 2. Three sweeps run from each anchor's start to its end.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines an authored search's ordered walk and stand sequence, anchor names and sweeps within each pause.
 * @evidence contracts/development/testing.md#behavioral-verification Builds default and custom named routes for specified virtual places and schedules sweeps across their returned anchor times.
 * @evidence contracts/development/testing.md#independent-expectations Two places yield successive default `search0` and `search1` holds of 2 s. The supplied 1 s pause and prefix change the first to `look0`, and three sweeps occupy the exact anchor span.
 */
export function test_motions_lexicon_pursuit_search(): void {
  TestValidator.equals(
    "the search",
    HumanPursuit.search(new Recorder(), [
      { x: 1, y: 0, z: 2 },
      { x: -1, y: 0, z: 3 },
    ]).steps,
    ["walk 1,2", "stand 2 search0", "walk -1,3", "stand 2 search1"],
  );
  TestValidator.equals(
    "a named search",
    HumanPursuit.search(new Recorder(), [{ x: 0, y: 0, z: 1 }], "look", 1)
      .steps,
    ["walk 0,1", "stand 1 look0"],
  );
  TestValidator.equals(
    "the sweeps",
    HumanPursuit.sweeps(3).map(
      (s: IAutoMovieMotionHumanLayer.IScheduled): unknown => [s.from, s.to],
    ),
    [0, 1, 2].map((i: number): unknown => [
      { of: `search${i}` },
      { of: `search${i}`, event: "end" },
    ]),
  );
}
