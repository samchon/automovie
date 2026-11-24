import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePose,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/**
 * Whether two poses agree exactly: a pure read repeats every joint angle to the
 * last bit, so the tolerance is zero.
 */
function same(a: IAutoMoviePose, b: IAutoMoviePose): boolean {
  return (
    a.joints.length === b.joints.length &&
    a.joints.every(
      (joint: IAutoMoviePose["joints"][number], i: number): boolean => {
        const other: IAutoMoviePose["joints"][number] = b.joints[i]!;
        return (
          joint.bone === other.bone &&
          nclose(joint.flexion ?? 0, other.flexion ?? 0, 0) &&
          nclose(joint.abduction ?? 0, other.abduction ?? 0, 0) &&
          nclose(joint.twist ?? 0, other.twist ?? 0, 0)
        );
      },
    )
  );
}

/** The seconds read, out of film order. */
const SECONDS: readonly number[] = [1.1, 0.3, 0.8, 0.05, 1.4];

/**
 * `HumanPerformance` prepares every record its reads evaluate once
 * (`prepareHumanPerformance`), so a displayed pose is a pure function of its
 * film second: the same in any reading order and in another construction of
 * the same input.
 *
 * The average man stands for 0.6 s, then stands again, swaying.
 *
 * Scenarios:
 *
 * 1. Every placed action carries its prepared record, with its leg chain and
 *    swivel course; an action entered through an offsetting cut carries its
 *    offset.
 * 2. Poses read forward, backward and out of order are equal at each second.
 * 3. A second construction of the same input shows the same poses.
 */
export async function test_unit_motions_perform_prepared_reads(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const make = (): HumanPerformance =>
    new HumanPerformance({
      seed: "prepared",
      performers: [
        {
          subject: "ann",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("ann")
        .stand({ hold: 0.6 })
        .stand({ hold: 0.9, sway: 1 }).node,
    });
  const film: HumanPerformance = make();

  // 1. The records.
  const segments: readonly IAutoMovieMotionHumanSegment[] =
    film.segments("ann");
  TestValidator.predicate(
    "every action carries its prepared record",
    segments.length === 2 &&
      segments.every(
        (segment: IAutoMovieMotionHumanSegment): boolean =>
          segment.prepared !== undefined &&
          segment.prepared.legs(0) !== undefined &&
          segment.prepared.swivels(0) !== undefined,
      ) &&
      (segments[1]!.transition?.kind === "redirect") ===
        (segments[1]!.prepared?.offset === undefined),
  );

  // 2. Any reading order.
  const forward: IAutoMoviePose[] = SECONDS.map(
    (t: number): IAutoMoviePose => film.pose("ann", t),
  );
  const backward: IAutoMoviePose[] = [...SECONDS]
    .reverse()
    .map((t: number): IAutoMoviePose => film.pose("ann", t))
    .reverse();
  TestValidator.predicate(
    "the same pose in any order",
    backward.every((pose: IAutoMoviePose, i: number): boolean =>
      same(pose, forward[i]!),
    ),
  );

  // 3. Another construction.
  const again: HumanPerformance = make();
  TestValidator.predicate(
    "another construction shows the same poses",
    SECONDS.every((t: number, i: number): boolean =>
      same(again.pose("ann", t), forward[i]!),
    ),
  );
}
