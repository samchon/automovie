import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanSocial,
  type IHumanBody,
  touch,
  type touchSite,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A touch lands on a place of its region, not only on the region's one
 * point: the place is stated, drawn by the seed or chosen by a rule, and two
 * hands may each hold their own region at once (#3357).
 *
 * Two average men stand 0.6 m apart, face to face; one lays a comforting
 * palm (`HumanSocial.comfort`, a held palm) on the other's sternum, whose
 * surface faces him, so `up` is the world's up and `out` is his own right.
 *
 * Scenarios, read at the middle of the hold:
 * 1. With no site the palm lies within 15 mm of the sternum's point (the
 *    campaign's contact bound).
 * 2. A site 40 mm up and 40 mm out puts the palm 40 mm higher and 40 mm to
 *    the performer's right of where it lay without a site, each within
 *    15 mm.
 * 3. A site drawn within 50 mm lies within 50 mm of the region's point plus
 *    the contact bound, and two seeds draw places at least 1 mm apart.
 * 4. The reach rule within 50 mm puts the palm at least 20 mm nearer the
 *    performer's right shoulder joint than it lay without a site.
 * 5. Two contacts at once: the right palm on the partner's left shoulder and
 *    the left palm on his right shoulder each lie within 15 mm of their
 *    region.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds each performance through the public chain and reads displayed hands and regions; a site that is ignored, a draw that never varies, a rule that does not shorten the reach or a second hand off its region fails.
 * @evidence contracts/development/testing.md#independent-expectations The offsets are the ones the scenario states, the 15 mm is the campaign's contact bound (#3354) and the directions are the performer's own up and right; none is read from the law.
 * @evidence contracts/development/testing.md#distinguishing-cases The three ways a site is chosen and the two-contact touch, each against the touch without a site.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man and builds six short two-person performances, each read at one instant; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, the stage and the 5 scenarios with their bounds.
 */
export function test_human_motion_hand_sites(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const complaints: string[] = [];
  const mm = (metres: number): string => (metres * 1000).toFixed(0);
  const gap = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);

  /** One touch, read at the middle of its hold. */
  interface IRead {
    right: IAutoMovieVector3;
    left: IAutoMovieVector3;
    shoulder: IAutoMovieVector3;
    region: (
      name: "sternum" | "shoulderLeft" | "shoulderRight",
    ) => IAutoMovieVector3;
  }
  const perform = (
    label: string,
    seed: string,
    params: object,
  ): IRead | null => {
    try {
      const performance: HumanPerformance = new HumanPerformance({
        seed,
        laws: [HumanSocial.comfort],
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
          {
            subject: "b",
            body,
            at: { x: 0, y: 0, z: 0.6 },
            yaw: 180,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .registered("comfort", params)
          .with(HumanChain.subject("b").stand({ seconds: 5 })).node,
      });
      const placed: HumanSegment.ISegment = performance.segments("a")[1]!;
      const instant = (event: string): number =>
        placed.start +
        (placed.plan.events.find((e): boolean => e.name === event)?.share ??
          NaN) *
          placed.plan.duration;
      const held: number = (instant("strokeEnd") + instant("relax")) / 2;
      const mine: HumanSignature.IReader = HumanSignature.of(
        performance,
        "a",
        body,
        0,
      );
      const theirs: HumanSignature.IReader = HumanSignature.of(
        performance,
        "b",
        body,
        0,
      );
      const palm = (side: "left" | "right"): IAutoMovieVector3 =>
        AutoMovieMotionHumanTouchEffector.point(
          body,
          performance.bones("a", held),
          side,
          touch.EFFECTORS.palm,
        );
      return {
        right: palm("right"),
        left: palm("left"),
        shoulder: HumanSignature.joint(mine, held, "rightUpperArm"),
        region: (
          name: "sternum" | "shoulderLeft" | "shoulderRight",
        ): IAutoMovieVector3 => HumanSignature.region(theirs, name, held),
      };
    } catch (error) {
      complaints.push(
        `${label}: expected to plan, got ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  };
  const sternum = (site?: touchSite.ISite): object => ({
    target: { kind: "person", subject: "b", region: "sternum" },
    hold: 0.6,
    ...(site === undefined ? {} : { site }),
  });

  // 1. No site: on the region's point.
  const plain: IRead | null = perform("no site", "site", sternum());
  if (plain !== null) {
    const off: number = gap(plain.right, plain.region("sternum"));
    if (!(off <= 0.015))
      complaints.push(
        `no site: the palm lies ${mm(off)} mm from the sternum, within 15 mm expected`,
      );

    // 2. A stated site.
    const stated: IRead | null = perform(
      "stated site",
      "site",
      sternum({ up: 0.04, out: 0.04 }),
    );
    if (stated !== null) {
      const up: number = stated.right.y - plain.right.y;
      const out: number = plain.right.x - stated.right.x;
      if (!(Math.abs(up - 0.04) <= 0.015))
        complaints.push(
          `stated site: the palm lies ${mm(up)} mm higher than without a site, 40 mm within 15 mm expected`,
        );
      if (!(Math.abs(out - 0.04) <= 0.015))
        complaints.push(
          `stated site: the palm lies ${mm(out)} mm to the performer's right of where it lay without a site, 40 mm within 15 mm expected`,
        );
    }

    // 3. A drawn site.
    const drawn: IAutoMovieVector3[] = [];
    for (const seed of ["first", "second"]) {
      const read: IRead | null = perform(
        `drawn site, seed ${seed}`,
        seed,
        sternum({ draw: 0.05 }),
      );
      if (read === null) continue;
      drawn.push(read.right);
      const off: number = gap(read.right, read.region("sternum"));
      if (!(off <= 0.05 + 0.015))
        complaints.push(
          `drawn site, seed ${seed}: the palm lies ${mm(off)} mm from the sternum's point, within 65 mm expected`,
        );
    }
    if (drawn.length === 2 && !(gap(drawn[0]!, drawn[1]!) >= 0.001))
      complaints.push(
        `drawn site: two seeds put the palm ${(gap(drawn[0]!, drawn[1]!) * 1000).toFixed(2)} mm apart, at least 1 mm expected`,
      );

    // 4. The reach rule.
    const ruled: IRead | null = perform(
      "reach rule",
      "site",
      sternum({ rule: "reach", within: 0.05 }),
    );
    if (ruled !== null) {
      const nearer: number =
        gap(plain.right, plain.shoulder) - gap(ruled.right, ruled.shoulder);
      if (!(nearer >= 0.02))
        complaints.push(
          `reach rule: the palm lies ${mm(nearer)} mm nearer the right shoulder joint than without a site, at least 20 mm expected`,
        );
    }
  }

  // 5. Two contacts at once.
  const both: IRead | null = perform("two contacts", "site", {
    target: { kind: "person", subject: "b", region: "shoulderLeft" },
    other: { kind: "person", subject: "b", region: "shoulderRight" },
    hold: 0.6,
  });
  if (both !== null)
    for (const [side, region] of [
      ["right", "shoulderLeft"],
      ["left", "shoulderRight"],
    ] as const) {
      const off: number = gap(both[side], both.region(region));
      if (!(off <= 0.015))
        complaints.push(
          `two contacts: the ${side} palm lies ${mm(off)} mm from the ${region}, within 15 mm expected`,
        );
    }
  TestValidator.equals("a touch's site on its region", complaints, []);
}
