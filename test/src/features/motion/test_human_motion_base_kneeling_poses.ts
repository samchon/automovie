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
 * A body that kneels ends where the kneeling's name says: on one knee, sat
 * back on both, or back on its feet; and while a foot is declared planted
 * on the way down or up, it does not slide.
 *
 * Scenarios, each row performed after 0.3 s of standing, on the average
 * man or the small woman, alternating down the rows. One body a row is
 * enough because both builds meet a kneeling and the claims scale with the
 * stature; the instants are each plant window's two ends and two between,
 * where a planted foot dragged by the pelvis shows, and the row's end:
 * 1. Through every plant window the row declares, read at four instants
 *    spread over it, the foot's ball moves at most 5 mm (the campaign's
 *    slip bound).
 * 2. `takeAKnee` ends with one knee joint within 0.06 statures of the floor
 *    (a knee resting on the floor holds its joint centre about half a knee's
 *    depth above it; the share is provisional) and the other knee above it.
 * 3. `kneelSit` ends with both knee joints within that share of the floor.
 * 4. `kneelBriefly` ends on the feet: both feet bear and the hip joints are
 *    within 20 mm of the quiet stance's height (a provisional reading of
 *    "standing again").
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the kneeling rows through the public input, performs each on a real body and reads the displayed feet, knees and hips; a sliding plant, a kneel that hovers or a body left down fails.
 * @evidence contracts/development/testing.md#independent-expectations The 5 mm is the campaign's slip bound and the quiet stance is the film's own first posture; where each row ends is what its name states, and the stature share is a provisional reading of "on the floor". None is taken from the law's tables.
 * @evidence contracts/development/testing.md#distinguishing-cases One knee against both, staying down against getting up, over two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds three short performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds and which are provisional.
 */
export function test_human_motion_base_kneeling_poses(): void {
  const complaints: string[] = [];
  const rows: readonly string[] = ["takeAKnee", "kneelBriefly", "kneelSit"];
  const names: readonly ["m-average", "f-small"] = ["m-average", "f-small"];
  rows.forEach((row: string, r: number): void => {
    const name: "m-average" | "f-small" = names[r % 2]!;
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
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
      return;
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
    const hips = (t: number): number =>
      (y("leftUpperLeg", t) + y("rightUpperLeg", t)) / 2;
    const ball = (side: "left" | "right", t: number): IAutoMovieVector3 =>
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
      const first: IAutoMovieVector3 = ball(side, from + 0.02);
      let slip: number = 0;
      for (const t of HumanSignature.times(
        from + 0.02,
        to - 0.02,
        3 / (to - from - 0.04),
      )) {
        const now: IAutoMovieVector3 = ball(side, t);
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
    const low: number = Math.min(y("leftLowerLeg", end), y("rightLowerLeg", end));
    const high: number = Math.max(
      y("leftLowerLeg", end),
      y("rightLowerLeg", end),
    );

    // 2. One knee on the floor.
    if (
      row === "takeAKnee" &&
      (low > 0.06 * stature || high <= low + 0.06 * stature)
    )
      complaints.push(
        `${label}: the knees end at ${low.toFixed(3)} and ${high.toFixed(3)} m, one within ${(0.06 * stature).toFixed(3)} m of the floor and the other above it expected`,
      );

    // 3. Sat back on the heels.
    if (row === "kneelSit" && high > 0.06 * stature)
      complaints.push(
        `${label}: the higher knee ends ${high.toFixed(3)} m above the floor, both within ${(0.06 * stature).toFixed(3)} m expected`,
      );

    // 4. Back on the feet.
    if (row === "kneelBriefly") {
      for (const side of ["left", "right"] as const)
        if (!HumanSignature.bears(reader, end, side))
          complaints.push(`${label}: the ${side} foot does not bear at the end`);
      if (Math.abs(hips(end) - hips(0)) > 0.02)
        complaints.push(
          `${label}: the hips end at ${hips(end).toFixed(3)} m, within 20 mm of the quiet stance's ${hips(0).toFixed(3)} m expected`,
        );
    }
  });
  TestValidator.equals("kneeling poses end where they say", complaints, []);
}
