import { physicalShapeBounds } from "@automovie/engine";
import {
  HumanChain,
  HumanColliders,
  HumanPerformance,
  type HumanSegment,
  HumanVerdicts,
  type IHumanBody,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A handstand (`gymnastics`) is supported at every instant: the body goes
 * up onto its hands and comes back down onto its feet, and is never in the
 * air, since nothing in a kick-up or a step-down leaves both supports.
 *
 * A support touches when the lowest point of its colliders lies within the
 * verdicts' skin depth (`HumanVerdicts.SKIN`, 10 mm) of the floor; the hands
 * are every collider from the wrist out, the feet every one from the ankle
 * out.
 *
 * Scenarios, on the smallest and the largest body of the sweep (`f-small`
 * and `m-large`), a handstand held 1 s after 0.3 s of standing:
 * 1. It plans.
 * 2. At every twenty-fourth of a second through the handstand, both hands
 *    or both feet touch the floor.
 * 3. At `inverted` and at `release` both hands touch, and at the end both
 *    feet touch: the hands bear until the feet are down again.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the handstand through the public chain and reads the displayed colliders at every grid instant and at the plan's own events; an exit that lifts the hands before the feet land fails with its body, instant and heights.
 * @evidence contracts/development/testing.md#independent-expectations A handstand entered and left from standing has no flight phase, so one support always bears; the touch depth is the verdicts' own skin bound for any human motion.
 * @evidence contracts/development/testing.md#distinguishing-cases The entry, the hold and the exit on the two extreme bodies; the cartwheel and the other supported moves are `test_human_motion_gymnastics_supported`'s, and sinking into the floor is the floor tests'.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two short performances in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, what a touch is and the 3 scenarios with their bounds.
 */
export function test_human_motion_gymnastics_handstand_support(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  for (const name of ["f-small", "m-large"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "handstand",
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
          .gymnastics({ seconds: 1 }).node,
      });
    } catch (error) {
      all.check(
        `${name}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
      continue;
    }
    const placed: HumanSegment.ISegment = performance.segments("a")[1]!;

    // The lowest collider point of the hands and of the feet, metres.
    const lowest = (seconds: number): { hands: number; feet: number } => {
      let hands: number = Infinity;
      let feet: number = Infinity;
      for (const { bone, pose, shapes } of HumanColliders.placed(
        body,
        performance.bones("a", seconds),
      ))
        for (const shape of shapes) {
          const bottom: number = physicalShapeBounds(pose, shape).min.y;
          if (/(Hand|Thumb|Index|Middle|Ring|Little)/.test(bone))
            hands = Math.min(hands, bottom);
          if (/(Foot|Toes)$/.test(bone)) feet = Math.min(feet, bottom);
        }
      return { hands, feet };
    };
    const at = (event: string): number =>
      placed.start +
      (placed.plan.events.find((e): boolean => e.name === event)?.share ??
        NaN) *
        placed.plan.duration;

    // 2. Never in the air.
    let worst: { seconds: number; hands: number; feet: number } | undefined;
    for (
      let seconds: number = placed.entryTime;
      seconds <= placed.end + 1e-9;
      seconds += 1 / 24
    ) {
      const low: { hands: number; feet: number } = lowest(seconds);
      const off: number = Math.min(low.hands, low.feet);
      if (
        off > HumanVerdicts.SKIN &&
        (worst === undefined || off > Math.min(worst.hands, worst.feet))
      )
        worst = { seconds, ...low };
    }
    all.check(
      worst === undefined
        ? `${name}: always supported`
        : `${name}: at ${worst.seconds.toFixed(2)} s the hands are ${mm(worst.hands)} mm and the feet ${mm(worst.feet)} mm above the floor, one within ${mm(HumanVerdicts.SKIN)} expected`,
      worst === undefined,
    );

    // 3. The hands bear until the feet are down.
    for (const event of ["inverted", "release"] as const) {
      const hands: number = lowest(at(event)).hands;
      all.check(
        `${name}: at ${event} the hands are ${mm(hands)} mm above the floor, within ${mm(HumanVerdicts.SKIN)} expected`,
        hands <= HumanVerdicts.SKIN,
      );
    }
    const feet: number = lowest(placed.end).feet;
    all.check(
      `${name}: at the end the feet are ${mm(feet)} mm above the floor, within ${mm(HumanVerdicts.SKIN)} expected`,
      feet <= HumanVerdicts.SKIN,
    );

  }
  all.assert("a handstand rests on the hands or the feet throughout");
}
