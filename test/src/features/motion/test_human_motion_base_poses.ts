import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanFoot,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Every named reaction taken on the feet that the other pose tests do not
 * name keeps them where they are and ends standing: a brace and a stumble.
 *
 * A foot that bears does not slide. Each action declares when each foot is
 * planted, and through each of those windows the ball of that foot stays
 * within the campaign's slip bound. The flinches are
 * `test_human_motion_base_flinch_poses`'s, the poses that crouch
 * `test_human_motion_base_crouching_poses`'s, those that go down to the
 * knees `test_human_motion_base_kneeling_poses`'s, those that go down to
 * the floor `test_human_motion_base_floor_poses`'s, and the stances
 * `test_human_motion_base_stances`'s.
 *
 * Scenarios, every row of `HumanPose` the other tests do not name
 * (`braceForImpact` and `stumble` today, and any row added later),
 * performed after 0.3 s of standing on the average man or the small woman,
 * alternating down the rows. One body a row is enough because each claim
 * is where a named reaction ends, which both builds meet across the family;
 * the instants are each window's two ends and two between, where a planted
 * foot dragged by the pelvis shows, and the end:
 * 1. Through every plant window the row declares, read at four instants
 *    spread over it, the foot's ball moves at most 5 mm.
 * 2. Every row ends on the feet: both feet bear at the end.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the remaining pose rows through the public input, performs each on a real body and reads the displayed feet; a sliding plant or a reaction that leaves a foot in the air fails.
 * @evidence contracts/development/testing.md#independent-expectations The 5 mm is the campaign's slip bound; where each row ends is what its name states. Limitation: the plant windows are the ones each action declares, so a foot that slides outside any declared window is the verdict report's to catch.
 * @evidence contracts/development/testing.md#distinguishing-cases A brace held in place and a stumble that steps, over two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one short performance per row in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 2 scenarios with their bounds.
 */
export function test_human_motion_base_poses(): void {
  const complaints: string[] = [];
  const elsewhere: readonly string[] = [
    "takeAKnee",
    "kneelBriefly",
    "kneelSit",
    "sitOnFloor",
    "sitCrossLegged",
    "sitSideways",
    "lieStill",
    "squatSit",
    "takeCover",
    "startle",
    "wince",
  ];
  const rows: readonly string[] = HUMAN_LEXICON.pose!.map(
    (law: IHumanActionLaw<never>): string => law.name,
  ).filter((row: string): boolean => !elsewhere.includes(row));
  const names: readonly ["m-average", "f-small"] = ["m-average", "f-small"];
  for (let b: number = 0; b < names.length; ++b) {
    const name: "m-average" | "f-small" = names[b]!;
    const body: IHumanBody = motionHumanBody(name);
    for (let r: number = 0; r < rows.length; ++r) {
      const row: string = rows[r]!;

      // Each row is performed on one body, alternating down the rows.
      if ((b + r) % 2 !== 0) continue;
      const label: string = `${name} ${row}`;
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "poses",
          laws: [...HUMAN_LEXICON.pose!],
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
            .registered(row).node,
        });
      } catch (error) {
        complaints.push(
          `${label}: ${error instanceof Error ? error.message : String(error)}`,
        );
        continue;
      }
      const segment: HumanSegment.ISegment = performance.segments("a")[1]!;
      const reader: HumanSignature.IReader = HumanSignature.of(
        performance,
        "a",
        body,
        0,
      );
      const end: number = segment.end;
      const planted = (side: "left" | "right", t: number): IAutoMovieVector3 =>
        HumanFoot.sockets(body, HumanSignature.bones(reader, t), side).find(
          (s: HumanFoot.ISocket): boolean => s.socket === "ball",
        )!.point;

      // 1. No declared plant slips.
      for (const c of segment.plan.contacts) {
        if (c.kind !== "plant" || !c.part.endsWith("Foot")) continue;
        const side: "left" | "right" = c.part === "leftFoot" ? "left" : "right";
        const from: number = Math.max(
          segment.entryTime,
          segment.start + c.from * segment.plan.duration,
        );
        const to: number = Math.min(
          end,
          segment.start + c.to * segment.plan.duration,
        );
        if (to - from < 0.1) continue;
        const first: IAutoMovieVector3 = planted(side, from + 0.02);
        let slip: number = 0;
        for (const t of HumanSignature.times(
          from + 0.02,
          to - 0.02,
          3 / (to - from - 0.04),
        )) {
          const now: IAutoMovieVector3 = planted(side, t);
          slip = Math.max(
            slip,
            Math.hypot(now.x - first.x, now.y - first.y, now.z - first.z),
          );
        }
        if (slip > 0.005)
          complaints.push(
            `${label}: the ${side} foot's ball moves ${(slip * 1000).toFixed(1)} mm while planted from ${from.toFixed(2)} to ${to.toFixed(2)} s, within 5 mm expected`,
          );
      }

      // 2. Still on the feet.
      for (const side of ["left", "right"] as const)
        if (!HumanSignature.bears(reader, end, side))
          complaints.push(`${label}: the ${side} foot does not bear at the end`);

    }
  }
  TestValidator.equals("standing poses hold their ground", complaints, []);
}
