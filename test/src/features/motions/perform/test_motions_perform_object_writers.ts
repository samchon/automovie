import type { IAutoMovieMotionHumanProp } from "@automovie/interface";
import {
  HumanPerformanceObject
} from "../../../../../packages/motions/src/perform/internal/HumanPerformanceObject";
import {
  AutoMovieMotionHumanRefusal
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { drivenDoorState } from "../../internal/fixtures/drivenDoorState";

/**
 * How far a read travel may stand from its closed form, degrees: a product of a
 * rate and a second, far above its rounding.
 */
const TRAVEL: number = 1e-12;

/**
 * `HumanPerformanceObject` collects a prop's writers, reads its state, poses
 * its points and admits its drives.
 *
 * A door's hinge is driven by a first action (zero at 1 s, 2 s long, ending at
 * 3 s) from a quarter to three quarters of its plan at 10 degrees a second of
 * plan time; by a second (zero at 4 s, entered at 4.2 s, cut at 4.6 s) over its
 * first half at 20 degrees a second; and by a third (zero at 6 s, cut at 6.5 s)
 * over its second half. The door's own track turns its `mirror`, coupled to the
 * hinge, from 5 s for half a second.
 *
 * Scenarios:
 *
 * 1. `collect` clips each drive to its action's active span: 1.5 to 2.5 s, 4.2 to
 *    4.6 s; drops the third, which starts after its cut; places the track at
 *    its instant for its duration; resolves the mirror's leader to the hinge;
 *    and orders them by their start.
 * 2. `writers` returns the prepared writers when the performance has them.
 * 3. `state` reads nothing before any writer, 10 degrees at 2 s, holds 15 after
 *    the first writer's end, reads the second's 8 at 4.4 s and, from 5.2 s, the
 *    mirror alone at -0.2, held at -0.5 after the track.
 * 4. `point` and `pose` place the handle where the hinge's travel moves it; a
 *    prop nothing drives, or that does not articulate, keeps its rest point,
 *    and a point it does not have is none.
 * 5. `admit` passes these drives; it refuses a mirror drive from 1 s overlapping
 *    a hinge drive to 1.2469 s, offering from 1.247 s, the first's end rounded
 *    up to the millisecond, and a drive to 200 degrees, past the hinge's 100.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names clipped drives, the prop track and its leader, prepared writer identity, travel and posed-point reads, and the two admission refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Calls writer collection, state, point, pose and admission on a typed door fixture with actor drives and a prop track. It reads explicit windows and travel, checks prepared-array identity, tests through the reader, and observes `AutoMovieMotionHumanRefusal` fields for overlapping and out-of-range drives.
 * @evidence contracts/development/testing.md#independent-expectations The first normalized drive gives 1 + 2·[0.25, 0.75] = [1.5, 2.5] s. The later drive clips to 4.2–4.6 s. The mirror track advances -0.2 degrees by 5.2 s and holds -0.5. An overlap ending at 2·0.62345 s moves the next feasible start up to 1.247 s.
 */
export async function test_motions_perform_object_writers(): Promise<void> {
  const { self, door, box } = await drivenDoorState([
    {
      start: 1,
      end: 3,
      duration: 2,
      drives: [
        {
          prop: "door",
          articulation: "hinge",
          from: 0.25,
          to: 0.75,
          travel: (seconds: number): number => 10 * seconds,
        },
      ],
    },
    {
      start: 4,
      entryTime: 4.2,
      end: 4.6,
      duration: 2,
      drives: [
        {
          prop: "door",
          articulation: "hinge",
          from: 0,
          to: 0.5,
          travel: (seconds: number): number => 20 * seconds,
        },
        {
          prop: "box",
          articulation: "lid",
          from: 0,
          to: 1,
          travel: (): number => 1,
        },
      ],
    },
    {
      start: 6,
      end: 6.5,
      duration: 2,
      drives: [
        {
          prop: "door",
          articulation: "hinge",
          from: 0.5,
          to: 1,
          travel: (): number => 50,
        },
      ],
    },
  ]);
  const tracked: IAutoMovieMotionHumanProp = {
    ...door,
    tracks: [
      {
        articulation: "mirror",
        start: 5,
        duration: 0.5,
        travel: (seconds: number): number => -seconds,
      },
    ],
  };

  // 1. Collect.
  const writers = HumanPerformanceObject.collect(self, tracked);
  TestValidator.equals(
    "the writers, clipped and ordered",
    writers.map((w) => [w.articulation, w.leader, w.from, w.to]),
    [
      ["hinge", "hinge", 1.5, 2.5],
      ["hinge", "hinge", 4.2, 4.6],
      ["mirror", "hinge", 5, 5.5],
    ],
  );
  TestValidator.predicate(
    "drives keep their source, tracks none",
    writers[0]!.source?.subject === "actor" &&
      writers[2]!.source === undefined,
  );

  // 2. Prepared writers.
  const prepared = { ...self, writers: new Map([["door", writers]]) };
  TestValidator.predicate(
    "prepared writers are read as prepared",
    HumanPerformanceObject.writers(prepared, door) === writers &&
      HumanPerformanceObject.writers(self, door).length === 2,
  );

  // 3. State.
  const at = (seconds: number): Record<string, number> =>
    HumanPerformanceObject.state(prepared, door, seconds);
  TestValidator.predicate(
    "the latest begun writer of each degree",
    Object.keys(at(1)).length === 0 &&
      Math.abs(at(2).hinge! - 10) <= TRAVEL &&
      Math.abs(at(3).hinge! - 15) <= TRAVEL &&
      Math.abs(at(4.4).hinge! - 8) <= TRAVEL &&
      Math.abs(at(5.2).mirror! + 0.2) <= TRAVEL &&
      at(5.2).hinge === undefined &&
      Math.abs(at(9).mirror! + 0.5) <= TRAVEL,
  );

  // 4. Points.
  const pull = HumanPerformanceObject.point(prepared, door, "pull", 2)!;
  const still: IAutoMovieMotionHumanProp = { ...door };
  delete still.articulate;
  TestValidator.predicate(
    "posed points",
    Math.abs(pull.point.x - 10) <= TRAVEL &&
      Math.abs(pull.normal.y - 1) <= TRAVEL &&
      HumanPerformanceObject.pose(prepared, door, 2).affordances.find(
        (a) => a.id === "pull",
      )!.frame.translation.x === pull.point.x &&
      HumanPerformanceObject.point(self, box, "lid", 2) === box.points.lid &&
      HumanPerformanceObject.point(prepared, still, "pull", 2) ===
        door.points.pull &&
      HumanPerformanceObject.point(prepared, door, "knob", 2) === undefined,
  );

  // 5. Admission.
  HumanPerformanceObject.admit(self);
  const overlapping = await drivenDoorState([
    {
      start: 0,
      end: 2,
      duration: 2,
      drives: [
        {
          prop: "door",
          articulation: "hinge",
          from: 0,
          to: 0.62345,
          travel: (): number => 1,
        },
      ],
    },
    {
      start: 1,
      end: 3,
      duration: 2,
      drives: [
        {
          prop: "door",
          articulation: "mirror",
          from: 0,
          to: 0.5,
          travel: (): number => -1,
        },
      ],
    },
  ]);
  const overrun = await drivenDoorState([
    {
      start: 0,
      end: 2,
      duration: 2,
      drives: [
        {
          prop: "door",
          articulation: "hinge",
          from: 0,
          to: 1,
          travel: (seconds: number): number => 100 * seconds,
        },
      ],
    },
  ]);
  TestValidator.predicate(
    "overlapping and out-of-range drives",
    refused(
      () => HumanPerformanceObject.admit(overlapping.self),
      (error: AutoMovieMotionHumanRefusal): boolean =>
        error.kind === "cut" &&
        error.axis === "drives" &&
        error.value === "door.hinge" &&
        error.performer === "actor" &&
        error.feasible?.kind === "range" &&
        error.feasible.minimum === 1.247,
    ) &&
      refused(
        () => HumanPerformanceObject.admit(overrun.self),
        (error: AutoMovieMotionHumanRefusal): boolean =>
          error.kind === "parameter" &&
          error.axis === "drives" &&
          error.value === 200,
      ),
  );
}

/** Whether a task throws a refusal the check accepts. */
function refused(
  task: () => unknown,
  check: (error: AutoMovieMotionHumanRefusal) => boolean,
): boolean {
  try {
    task();
    return false;
  } catch (error) {
    return error instanceof AutoMovieMotionHumanRefusal && check(error);
  }
}
