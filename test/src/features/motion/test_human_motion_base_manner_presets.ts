import {
  AutoMovieMotionManner,
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A named manner changes how long sitting down and standing up take, in
 * the direction its name says, and nothing about when the composition asked
 * the person to stay seated: a weary person sits and rises more slowly than
 * a neutral one, a brisk person faster.
 *
 * Scenarios, on the average man and the small woman, each on a chair as
 * high as their own popliteal height, sitting, staying one second, rising:
 * 1. The time from the start of `sit` to its `seated` event is longer under
 *    the `weary` preset than with no manner, and shorter under `brisk`.
 * 2. The length of `rise` orders the same way.
 * 3. Under every manner the time seated, from `seated` to the end of `sit`,
 *    is the one second asked within a millisecond: a manner retimes the
 *    movement, not the stay the composition states.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the same chain under three manners through the public input and reads the placed actions' instants; a manner that sit or rise ignores, or one that stretches the stay, fails.
 * @evidence contracts/development/testing.md#independent-expectations The directions are what weary and brisk mean, and the stay is the composition's own number; no factor is read from the preset table. Limitation: only the order of the durations is asserted, since the presets' magnitudes are provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases A slowing preset and a quickening one each side of the neutral manner, on two acts and two bodies; the moods on a walk are `test_human_motion_travel_styles`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds three short performances each in memory, reading no pose: the claim is about instants.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 3 scenarios.
 */
export function test_human_motion_base_manner_presets(): void {
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const chair: seated.ISeat = {
      at: { x: 0, y: seated.popliteal(body), z: -0.1 },
      yaw: 0,
      depth: 0.45,
    };

    /** How long sitting down, staying and rising take, seconds. */
    interface ITimes {
      /** From the start of the sit to `seated`. */
      down: number;

      /** From `seated` to the end of the sit. */
      stay: number;

      /** The rise. */
      up: number;
    }
    const times = (
      manner: AutoMovieMotionManner.IManner | undefined,
    ): ITimes => {
      const performance: HumanPerformance = new HumanPerformance({
        seed: "manners",
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
          .sit({
            seat: chair,
            seconds: 1,
            ...(manner === undefined ? {} : { manner }),
          })
          .rise(manner === undefined ? {} : { manner }).node,
      });
      const sitting: HumanSegment.ISegment = performance.segments("a")[0]!;
      const rising: HumanSegment.ISegment = performance.segments("a")[1]!;
      const down: number =
        sitting.plan.events.find(
          (e: { name: string; share: number }): boolean => e.name === "seated",
        )!.share * sitting.plan.duration;
      return {
        down,
        stay: sitting.plan.duration - down,
        up: rising.plan.duration,
      };
    };
    let neutral: ITimes;
    let weary: ITimes;
    let brisk: ITimes;
    try {
      neutral = times(undefined);
      weary = times(AutoMovieMotionManner.PRESETS.weary);
      brisk = times(AutoMovieMotionManner.PRESETS.brisk);
    } catch (error) {
      complaints.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    if (!(brisk.down < neutral.down && neutral.down < weary.down))
      complaints.push(
        `${name}: sitting down takes ${brisk.down.toFixed(2)} s brisk, ${neutral.down.toFixed(2)} s neutral and ${weary.down.toFixed(2)} s weary; brisk shortest and weary longest expected`,
      );
    if (!(brisk.up < neutral.up && neutral.up < weary.up))
      complaints.push(
        `${name}: rising takes ${brisk.up.toFixed(2)} s brisk, ${neutral.up.toFixed(2)} s neutral and ${weary.up.toFixed(2)} s weary; brisk shortest and weary longest expected`,
      );
    for (const [label, t] of [
      ["neutral", neutral],
      ["weary", weary],
      ["brisk", brisk],
    ] as const)
      if (Math.abs(t.stay - 1) > 1e-3)
        complaints.push(
          `${name}: ${label}, the stay seated lasts ${t.stay.toFixed(4)} s, the 1 s asked expected`,
        );
  }
  TestValidator.equals("a manner retimes sitting and rising", complaints, []);
}
