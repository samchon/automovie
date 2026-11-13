import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanContactWindow,
  seated,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A person sitting down into an armchair puts a hand on each armrest and
 * rests it there: seated, each wrist lies over its armrest, and the sit
 * says the hands bear.
 *
 * Scenarios, on the average man and the small woman, each on a chair as
 * high as their own popliteal height with an armrest at each side, half a
 * shoulder breadth plus 0.08 m from the middle and 0.22 m above the seat
 * (inside the 0.18 to 0.27 m of ANSI/HFES 100-2007's armrest heights;
 * provisional, the standard was not re-read):
 * 1. The sit plans and declares a plant window for each hand that lasts to
 *    its end.
 * 2. At the end of the sit each wrist is within 15 mm of its armrest's
 *    point across the floor (the campaign's bound for a contact at its
 *    event) and no more than a quarter of the hand's length above it (a
 *    hand lying flat holds its wrist about its own thickness up; the
 *    quarter is provisional).
 * 3. On the same chair without armrests no hand window is declared.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the sit through the public chain and reads the declared windows and the displayed wrists; hands left on the thighs, hovering beside the armrests, or a bare chair that claims hand supports fails.
 * @evidence contracts/development/testing.md#independent-expectations Where an armrest is comes from the test's own chair, the 15 mm is the campaign's bound and a flat hand's wrist height is anatomy, not the sit's placement constant. Limitation: the palm's own contact is not read, only the wrist over it.
 * @evidence contracts/development/testing.md#distinguishing-cases A chair with armrests against the same chair without, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two short performances each in memory, reading one instant: both builds, since the armrests are set by each body's breadth.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 3 scenarios with their bounds and sources.
 */
export function test_human_motion_base_armrests(): void {
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const height: number = seated.popliteal(body);
    const aside: number = body.measure.chestBreadth / 2 + 0.08;
    const bare: seated.ISeat = {
      at: { x: 0, y: height, z: -0.1 },
      yaw: 0,
      depth: 0.45,
    };
    const armrests: Record<"left" | "right", IAutoMovieVector3> = {
      left: { x: aside, y: height + 0.22, z: -0.3 },
      right: { x: -aside, y: height + 0.22, z: -0.3 },
    };
    const perform = (seat: seated.ISeat): HumanSegment.ISegment & {
      performance: HumanPerformance;
    } => {
      const performance: HumanPerformance = new HumanPerformance({
        seed: "armrests",
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: HumanChain.subject("a").sit({ seat, seconds: 1 }).node,
      });
      return { ...performance.segments("a")[0]!, performance };
    };
    const hands = (segment: HumanSegment.ISegment): string[] =>
      segment.plan.contacts
        .filter(
          (c: IHumanContactWindow): boolean =>
            c.part.endsWith("Hand") && c.to >= 1 - 1e-9,
        )
        .map((c: IHumanContactWindow): string => c.part)
        .sort((x: string, y: string): number => x.localeCompare(y));
    try {
      // 3. No armrest, no hand support.
      const without: string[] = hands(perform(bare));
      if (without.length !== 0)
        complaints.push(
          `${name}: a chair without armrests declares ${without.join(", ")} bearing, none expected`,
        );

      // 1 and 2. A hand on each armrest.
      const sat: HumanSegment.ISegment & { performance: HumanPerformance } =
        perform({ ...bare, armrests });
      const declared: string[] = hands(sat);
      if (declared.join(",") !== "leftHand,rightHand")
        complaints.push(
          `${name}: an armchair declares ${declared.join(", ") || "no hand"} bearing to the end, both hands expected`,
        );
      const reader: HumanSignature.IReader = HumanSignature.of(
        sat.performance,
        "a",
        body,
        0,
      );
      for (const side of ["left", "right"] as const) {
        const wrist: IAutoMovieVector3 = HumanSignature.joint(
          reader,
          sat.end,
          `${side}Hand`,
        );
        const across: number = Math.hypot(
          wrist.x - armrests[side].x,
          wrist.z - armrests[side].z,
        );
        const above: number = wrist.y - armrests[side].y;
        if (across > 0.015 || above < 0 || above > 0.25 * body.measure.hand)
          complaints.push(
            `${name}: the ${side} wrist ends ${(across * 1000).toFixed(1)} mm across from its armrest and ${(above * 1000).toFixed(1)} mm above it; within 15 mm across and 0 to ${(250 * body.measure.hand).toFixed(1)} mm above expected`,
          );
      }
    } catch (error) {
      complaints.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.equals("hands rest on the armrests", complaints, []);
}
