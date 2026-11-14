import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type { AutoMovieHumanoidBone } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  HumanRefusal,
  type HumanSegment,
  type IHumanBody,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A law that gets the body down onto the floor starts from the base the
 * act before it ended on: after a crawl it goes on from the hands and
 * knees, never back through a standing body, and from a base it has no way
 * down from it is refused by name.
 *
 * The continuity bound is the verdicts' speed limit for any human joint
 * centre, 30 m/s (`AutoMovieMotionHumanAudit`'s `speed`), read on the
 * displayed bones every 120th of a second from 0.1 s before the seam to
 * 1.6 s after it, the longest way down of the three laws.
 *
 * Scenarios, on the smallest and the largest body of the sweep (`f-small`
 * and `m-large`):
 * 1. A crawl of one cycle, then a lie down on the back: across the seam no
 *    joint centre moves faster than 30 m/s, and the hips joint never rises
 *    more than 0.15 statures above where the crawl left it (provisional:
 *    the body does not stand up to lie down).
 * 2. A bear crawl of one cycle, then an inchworm of one cycle: the same
 *    speed bound, and neither ankle rises more than 0.1 statures above
 *    where the bear crawl left it while the inchworm gets down
 *    (provisional: the feet stay by the floor).
 * 3. A crawl of one cycle, then another: the same speed and hips bounds.
 * 4. A lie down on the back, then a crawl: refused as a `base` refusal on
 *    the `base` axis, since no rise from lying is planned.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each chain through the public chain and reads displayed bones across the seam; a floor law that starts again from a standing body at the entry's root fails with the bone, the instant and its speed or height, and an accepted crawl from lying fails.
 * @evidence contracts/development/testing.md#independent-expectations The speed limit is the verdicts' bound for any human motion; the two height bounds only state that a body already on the floor stays by it, and are marked provisional.
 * @evidence contracts/development/testing.md#distinguishing-cases Three seams between floor laws entered kneeling and crouched, and one refused base, on the two extreme bodies; each law's way down from standing is its own spec's (`test_human_motion_travel_bear_crawl`, `test_human_motion_travel_inchworm`).
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds eight short performances in memory; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the bound with its source and window, and the 4 scenarios.
 */
export function test_human_motion_floor_entry_base(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const LIMIT: number = 30;
  const STEP: number = 1 / 120;
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  for (const name of ["f-small", "m-large"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    const perform = (composition: {
      node: HumanPerformance.IInput["composition"];
    }): HumanPerformance =>
      new HumanPerformance({
        seed: "floor-entry",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: composition.node,
      });

    // The fastest joint centre and the highest rise of some bones across a seam.
    const seam = (
      label: string,
      composition: { node: HumanPerformance.IInput["composition"] },
      watched: readonly AutoMovieHumanoidBone[],
      rise: number,
    ): void => {
      let performance: HumanPerformance;
      try {
        performance = perform(composition);
      } catch (error) {
        all.check(
          `${name} ${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
          false,
        );
        return;
      }
      const second: HumanSegment.ISegment = performance.segments("a")[1]!;
      const at: number = second.entryTime;
      const left: Bones = performance.bones("a", at - STEP);
      let fastest: { speed: number; bone: string; seconds: number } = {
        speed: 0,
        bone: "none",
        seconds: at,
      };
      let highest: { rise: number; bone: string; seconds: number } = {
        rise: -Infinity,
        bone: "none",
        seconds: at,
      };
      let before: Bones = performance.bones("a", at - 0.1);
      for (
        let seconds: number = at - 0.1 + STEP;
        seconds <= Math.min(second.end, at + 1.6);
        seconds += STEP
      ) {
        const now: Bones = performance.bones("a", seconds);
        for (const [bone, b] of now) {
          const a: IAutoMovieResolvedBone = before.get(bone)!;
          const speed: number =
            Math.hypot(
              b.worldPosition.x - a.worldPosition.x,
              b.worldPosition.y - a.worldPosition.y,
              b.worldPosition.z - a.worldPosition.z,
            ) / STEP;
          if (speed > fastest.speed) fastest = { speed, bone, seconds };
        }
        for (const bone of watched) {
          const up: number =
            now.get(bone)!.worldPosition.y - left.get(bone)!.worldPosition.y;
          if (up > highest.rise) highest = { rise: up, bone, seconds };
        }
        before = now;
      }
      all.check(
        `${name} ${label}: the fastest joint centre is the ${fastest.bone} at ${fastest.speed.toFixed(1)} m/s at ${fastest.seconds.toFixed(3)} s, below ${LIMIT} expected`,
        fastest.speed <= LIMIT,
      );
      if (watched.length !== 0)
        all.check(
          `${name} ${label}: the ${highest.bone} rises ${(highest.rise * 1000).toFixed(0)} mm above where the act before left it at ${highest.seconds.toFixed(3)} s, within ${(rise * stature * 1000).toFixed(0)} expected`,
          highest.rise <= rise * stature,
        );
    };

    // 1. A crawl, then a lie down.
    seam(
      "crawl then lieDown",
      HumanChain.subject("a")
        .crawl({ cycles: 1 })
        .lieDown({ position: "supine", hold: 0.5 }),
      ["hips"],
      0.15,
    );

    // 2. A bear crawl, then an inchworm.
    seam(
      "bear crawl then inchworm",
      HumanChain.subject("a")
        .crawl({ kind: "bear", cycles: 1 })
        .crawl({ kind: "inchworm", cycles: 1 }),
      ["leftFoot", "rightFoot"],
      0.1,
    );

    // 3. A crawl, then another.
    seam(
      "crawl then crawl",
      HumanChain.subject("a").crawl({ cycles: 1 }).crawl({ cycles: 1 }),
      ["hips"],
      0.15,
    );

    // 4. No way down from lying.
    let refused: unknown;
    try {
      perform(
        HumanChain.subject("a")
          .lieDown({ position: "supine", hold: 0.5 })
          .crawl({ cycles: 1 }),
      );
    } catch (error) {
      refused = error;
    }
    all.check(
      `${name} lieDown then crawl: refused on the base, got ${refused instanceof HumanRefusal ? `${refused.kind} on ${refused.axis}` : String(refused)}`,
      refused instanceof HumanRefusal &&
        refused.kind === "base" &&
        refused.axis === "base",
    );
  }
  all.assert("a floor law starts from the base it is entered on");
}
