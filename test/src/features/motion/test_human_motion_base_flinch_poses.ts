import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanFoot,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A flinch keeps the feet where they are, ends standing, and grows with its
 * intensity: a startle throws a wrist up further than a wince does.
 *
 * Scenarios, `startle` and `wince` each performed after 0.3 s of standing,
 * on the average man and on the small woman. Both rows are performed on
 * both bodies because the claim compares the two rows on one body; the
 * instants are each plant window's two ends and two between, where a
 * planted foot dragged by the pelvis shows, the end, and five instants
 * spread over each flinch for the wrist:
 * 1. Through every plant window the row declares, read at four instants
 *    spread over it, the foot's ball moves at most 5 mm (the campaign's
 *    slip bound).
 * 2. Both feet bear at the end.
 * 3. On each body, the highest wrist rises further above where it hung in
 *    the startle than in the wince.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the two flinch rows through the public input, performs each on real bodies and reads the displayed feet and wrists; a sliding plant, a flinch that leaves a foot in the air or a wince as large as a startle fails.
 * @evidence contracts/development/testing.md#independent-expectations The 5 mm is the campaign's slip bound; that a stronger flinch moves the hands further is what its intensity means. Nothing is read from the flinch law's table.
 * @evidence contracts/development/testing.md#distinguishing-cases A full flinch against a slight one, on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds four short performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 3 scenarios with their bounds.
 */
export function test_human_motion_base_flinch_poses(): void {
  const complaints: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const lifts: Record<string, number> = {};
    for (const row of ["startle", "wince"] as const) {
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
      const y = (
        bone: Parameters<typeof HumanSignature.joint>[2],
        t: number,
      ): number => HumanSignature.joint(reader, t, bone).y;
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
          complaints.push(
            `${label}: the ${side} foot does not bear at the end`,
          );

      // 3. How far a wrist rises, read at five instants spread over the flinch.
      const rest: number = Math.max(y("leftHand", 0), y("rightHand", 0));
      lifts[row] = Math.max(
        ...HumanSignature.times(
          segment.entryTime,
          end,
          4 / (end - segment.entryTime),
        ).map(
          (t: number): number =>
            Math.max(y("leftHand", t), y("rightHand", t)) - rest,
        ),
      );
    }
    const startle: number | undefined = lifts.startle;
    const wince: number | undefined = lifts.wince;
    if (startle !== undefined && wince !== undefined && !(startle > wince))
      complaints.push(
        `${name}: a startle raises a wrist ${startle.toFixed(3)} m and a wince ${wince.toFixed(3)} m, more for the startle expected`,
      );
  }
  TestValidator.equals("a flinch grows with its intensity", complaints, []);
}
