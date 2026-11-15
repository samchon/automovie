import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import {
  HumanCarried,
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  type IHumanBody,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The lift into a carry and the set-down out of it move the carried body
 * continuously: no joint centre jumps when the blend starts, half way, or
 * when the body arrives on the carrier or on its feet.
 *
 * The bound is the verdicts' speed limit for any human joint centre, 30 m/s
 * (`AutoMovieMotionHumanAudit`'s `speed`, above a pitcher's hand), read on
 * the displayed bones every 240th of a second through each blend, a step
 * fine enough that a jump of a single frame reads as tens of metres a
 * second.
 *
 * Scenarios, each carrier standing still, two pairs of bodies (the average
 * man carrying the small woman, the large man carrying the tall woman):
 * 1. `borne` over the shoulder with a 1 s lift: through the lift, every
 *    joint centre of the carried body moves below 30 m/s.
 * 2. `borne` piggyback with a 0.5 s lift and a 0.5 s set-down: through both,
 *    the same bound.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds two-person performances through the public chain and reads the carried body's displayed bones; a blend that drops the legs' goals at its start or takes the arms' goals whole half way fails with the bone, the instant and the speed.
 * @evidence contracts/development/testing.md#independent-expectations The speed limit is the verdicts' bound for any human motion, independent of the carry's law.
 * @evidence contracts/development/testing.md#distinguishing-cases A carry with clinging arms (piggyback) and one with hanging arms (over the shoulder), a lift alone and a lift with a set-down, on two pairs of bodies; whether the carried body rests on the carrier is `test_human_motion_carried_carries`'s.
 * @evidence contracts/development/testing.md#execution-ownership Prepares four polygon men and builds four short performances in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the bound with its source and step, and the 2 scenarios.
 */
export function test_human_motion_carried_lift_continuity(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const LIMIT: number = 30;
  const STEP: number = 1 / 240;
  for (const [carrier, carried] of [
    ["m-average", "f-small"],
    ["m-large", "f-tall"],
  ] as const) {
    const bearer: IHumanBody = motionHumanBody(carrier);
    const body: IHumanBody = motionHumanBody(carried);
    for (const [carry, lift, setDown] of [
      ["overShoulder", 1, 0],
      ["piggyback", 0.5, 0.5],
    ] as const) {
      const label: string = `${carrier} carrying ${carried} ${carry}`;
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "lift",
          laws: [HumanCarried.borne],
          performers: [
            {
              subject: "a",
              body: bearer,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
            {
              subject: "b",
              body,
              at: { x: 0, y: 0, z: -0.45 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: HumanChain.subject("a")
            .stand({ seconds: 3 })
            .with(
              HumanChain.subject("b").registered("borne", {
                by: "a",
                carry,
                seconds: 3,
                lift,
                setDown,
              }),
            ).node,
        });
      } catch (error) {
        all.check(
          `${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
          false,
        );
        continue;
      }
      const placed: HumanSegment.ISegment = performance.segments("b")[0]!;
      const spans: [number, number][] = [
        [placed.start, placed.start + lift],
        ...(setDown > 0
          ? [[placed.end - setDown, placed.end] as [number, number]]
          : []),
      ];
      for (const [from, to] of spans) {
        let worst: { speed: number; bone: string; seconds: number } = {
          speed: 0,
          bone: "none",
          seconds: from,
        };
        let before: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          performance.bones("b", from);
        for (
          let seconds: number = from + STEP;
          seconds <= to + 1e-9;
          seconds += STEP
        ) {
          const now: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            performance.bones("b", seconds);
          for (const [bone, b] of now) {
            const a: IAutoMovieResolvedBone | undefined = before.get(bone);
            if (a === undefined) continue;
            const speed: number =
              Math.hypot(
                b.worldPosition.x - a.worldPosition.x,
                b.worldPosition.y - a.worldPosition.y,
                b.worldPosition.z - a.worldPosition.z,
              ) / STEP;
            if (speed > worst.speed) worst = { speed, bone, seconds };
          }
          before = now;
        }
        all.check(
          `${label}: from ${from.toFixed(2)} s to ${to.toFixed(2)} s the fastest joint centre is the ${worst.bone} at ${worst.speed.toFixed(1)} m/s at ${worst.seconds.toFixed(3)} s, below ${LIMIT} expected`,
          worst.speed <= LIMIT,
        );
      }
    }
  }
  all.assert("a carry's lift and set-down move the carried body continuously");
}
