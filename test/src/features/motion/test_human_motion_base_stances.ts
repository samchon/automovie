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
  type IHumanContactWindow,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Every named stance is stood: it moves the arms and the head, so both
 * feet bear where they are for all of it and the body is still standing at
 * its end.
 *
 * Scenarios, each row of `HumanStance` performed after 0.3 s of standing on
 * the average man or the small woman, alternating down the rows. One body a
 * row is enough because the claim is the same for every stance and both
 * builds meet it across the family; the instants are the stance's two ends
 * and two between, where a foot dragged by a shifting pelvis shows:
 * 1. The row declares both feet planted for its whole length.
 * 2. At four instants spread over the stance each foot's ball moves at most
 *    5 mm (the campaign's slip bound).
 * 3. At its end both feet bear and the hip joints are within 20 mm of the
 *    quiet stance's height (a provisional reading of "still standing").
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers every stance row through the public input, performs each on a real body and reads the declared windows and the displayed feet and hips; a stance that steps, slides or sinks fails.
 * @evidence contracts/development/testing.md#independent-expectations The 5 mm is the campaign's slip bound and the quiet stance is the film's own first posture; that a stance is stood is what the family's name states, not a reading of its laws. Limitation: what the arms and the head do is each owner action's test to judge.
 * @evidence contracts/development/testing.md#distinguishing-cases Every stance row of the lexicon, over two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one short performance per row in memory, reading about ten instants of each.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 3 scenarios with their bounds.
 */
export function test_human_motion_base_stances(): void {
  const complaints: string[] = [];
  const rows: readonly string[] = HUMAN_LEXICON.stance!.map(
    (law: IHumanActionLaw<never>): string => law.name,
  );
  const names: readonly ["m-average", "f-small"] = ["m-average", "f-small"];
  const bodies: readonly IHumanBody[] = names.map(
    (name: "m-average" | "f-small"): IHumanBody => motionHumanBody(name),
  );
  rows.forEach((row: string, r: number): void => {
    const body: IHumanBody = bodies[r % 2]!;
    const label: string = `${names[r % 2]!} ${row}`;
    let performance: HumanPerformance;
    try {
      performance = new HumanPerformance({
        seed: "stances",
        laws: [...HUMAN_LEXICON.stance!],
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
    const hips = (t: number): number =>
      (HumanSignature.joint(reader, t, "leftUpperLeg").y +
        HumanSignature.joint(reader, t, "rightUpperLeg").y) /
      2;
    const ball = (side: "left" | "right", t: number): IAutoMovieVector3 =>
      HumanFoot.sockets(body, HumanSignature.bones(reader, t), side).find(
        (s: HumanFoot.ISocket): boolean => s.socket === "ball",
      )!.point;
    for (const side of ["left", "right"] as const) {
      // 1. Declared planted throughout.
      if (
        !segment.plan.contacts.some(
          (c: IHumanContactWindow): boolean =>
            c.part === `${side}Foot` &&
            c.kind === "plant" &&
            c.from <= 1e-9 &&
            c.to >= 1 - 1e-9,
        )
      )
        complaints.push(
          `${label}: the ${side} foot is not declared planted for the whole stance`,
        );

      // 2. No slip.
      const from: number = segment.entryTime + 0.02;
      const first: IAutoMovieVector3 = ball(side, from);
      let slip: number = 0;
      for (const t of HumanSignature.times(
        from,
        end - 0.02,
        3 / (end - 0.02 - from),
      )) {
        const now: IAutoMovieVector3 = ball(side, t);
        slip = Math.max(
          slip,
          Math.hypot(now.x - first.x, now.y - first.y, now.z - first.z),
        );
      }
      if (slip > 0.005)
        complaints.push(
          `${label}: the ${side} foot's ball moves ${(slip * 1000).toFixed(1)} mm through the stance, within 5 mm expected`,
        );

      // 3. Still standing.
      if (!HumanSignature.bears(reader, end, side))
        complaints.push(`${label}: the ${side} foot does not bear at the end`);
    }
    if (Math.abs(hips(end) - hips(0)) > 0.02)
      complaints.push(
        `${label}: the hips end at ${hips(end).toFixed(3)} m, within 20 mm of the quiet stance's ${hips(0).toFixed(3)} m expected`,
      );
  });
  TestValidator.equals("a stance is stood", complaints, []);
}
