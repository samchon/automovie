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
 * Every named pose taken on the feet keeps them where they are and ends
 * where its name says: a low squat held, a duck behind cover and back up,
 * a brace, a flinch and a stumble still standing.
 *
 * A foot that bears does not slide. Each action declares when each foot is
 * planted, and through each of those windows the part of that foot on the
 * floor stays within the campaign's slip bound. The poses that go down to
 * the knees are `test_human_motion_base_kneeling_poses`'s, those that go
 * down to the floor `test_human_motion_base_floor_poses`'s, and the stances
 * `test_human_motion_base_stances`'s.
 *
 * Scenarios, every row of `HumanPose` the other two tests do not name,
 * performed after 0.3 s of standing on the average man or the small woman,
 * alternating down the rows, and on both for `startle` and `wince`. One
 * body a row is enough because each claim is where a named pose ends, which
 * both builds meet across the family; the instants are each window's two
 * ends and two between, where a planted foot dragged by the pelvis shows:
 * 1. Through every plant window the row declares, read at four instants
 *    spread over it, the foot's ball moves at most 5 mm; for `squatSit`,
 *    whose heels are up, the toes' pad is read, the part that stays down
 *    while the foot rolls about the toes' joint.
 * 2. At the middle of `squatSit` both knees are flexed 150 degrees within
 *    10, the deep squat at the knee's range end (Hemmerich et al. 2006
 *    measure 157 +- 6 degrees in a heels-up squat).
 * 3. `takeCover`, `braceForImpact`, `startle`, `wince` and `stumble` end on
 *    the feet: both feet bear at the end. `takeCover` is back at the quiet
 *    stance's hip height within 20 mm, and at its middle, in its hold, both
 *    knees are flexed 100 degrees within 10: the row is a partial crouch,
 *    the parallel squat of about 100 degrees of knee flexion (Escamilla
 *    2001, Med Sci Sports Exerc 33:127).
 * 4. `startle` raises a wrist further than `wince` does (a flinch grows with
 *    its intensity).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the pose rows through the public input, performs each on a real body and reads the displayed feet, knees, hips and wrists; a sliding plant, a squat that stops short or a duck left crouched fails.
 * @evidence contracts/development/testing.md#independent-expectations The 5 mm is the campaign's slip bound and the quiet stance is the film's own first posture; where each row ends is what its name states, and the knee angles are the cited measurements. The 20 mm on the hips' height is a provisional reading of "standing again". Limitation: the plant windows are the ones each action declares, so a foot that slides outside any declared window is the verdict report's to catch.
 * @evidence contracts/development/testing.md#distinguishing-cases Rows that go down and stay, go down and return, flinch and step, over two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one short performance per row in memory, two for the flinches.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 4 scenarios with their bounds and which are provisional.
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
  ];
  const rows: readonly string[] = HUMAN_LEXICON.pose!.map(
    (law: IHumanActionLaw<never>): string => law.name,
  ).filter((row: string): boolean => !elsewhere.includes(row));
  const names: readonly ["m-average", "f-small"] = ["m-average", "f-small"];
  for (let b: number = 0; b < names.length; ++b) {
    const name: "m-average" | "f-small" = names[b]!;
    const body: IHumanBody = motionHumanBody(name);
    const lifts: Record<string, number> = {};
    for (let r: number = 0; r < rows.length; ++r) {
      const row: string = rows[r]!;

      // Each row is performed on one body, alternating down the rows, and on both for the two flinches compared on one body.
      if ((b + r) % 2 !== 0 && row !== "startle" && row !== "wince") continue;
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
      const hips = (t: number): number =>
        (y("leftUpperLeg", t) + y("rightUpperLeg", t)) / 2;

      // The part of a planted foot that stays on the floor: the ball, or the toes' pad of a foot whose heel is up.
      const down: "ball" | "toe" = row === "squatSit" ? "toe" : "ball";
      const planted = (side: "left" | "right", t: number): IAutoMovieVector3 =>
        HumanFoot.sockets(body, HumanSignature.bones(reader, t), side).find(
          (s: HumanFoot.ISocket): boolean => s.socket === down,
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
            `${label}: the ${side} foot's ${down} moves ${(slip * 1000).toFixed(1)} mm while planted from ${from.toFixed(2)} to ${to.toFixed(2)} s, within 5 mm expected`,
          );
      }

      // 2 and 3. The knees at the middle of a held squat or crouch.
      const knees = (asked: number): void => {
        const middle: number = (segment.entryTime + end) / 2;
        for (const side of ["left", "right"] as const) {
          const knee: number = HumanSignature.knee(reader, middle, side);
          if (Math.abs(knee - asked) > 10)
            complaints.push(
              `${label}: the ${side} knee is flexed ${knee.toFixed(1)} degrees at the middle of the hold, ${asked} within 10 expected`,
            );
        }
      };
      if (row === "squatSit") knees(150);
      if (row === "takeCover") knees(100);

      // 3. Back on the feet.
      if (
        ["takeCover", "braceForImpact", "startle", "wince", "stumble"].includes(
          row,
        )
      )
        for (const side of ["left", "right"] as const)
          if (!HumanSignature.bears(reader, end, side))
            complaints.push(
              `${label}: the ${side} foot does not bear at the end`,
            );
      if (row === "takeCover" && Math.abs(hips(end) - hips(0)) > 0.02)
        complaints.push(
          `${label}: the hips end at ${hips(end).toFixed(3)} m, within 20 mm of the quiet stance's ${hips(0).toFixed(3)} m expected`,
        );

      // 4. How far a wrist rises.
      if (row === "startle" || row === "wince") {
        const rest: number = Math.max(y("leftHand", 0), y("rightHand", 0));
        lifts[row] = Math.max(
          ...HumanSignature.times(segment.entryTime, end, 10).map(
            (t: number): number =>
              Math.max(y("leftHand", t), y("rightHand", t)) - rest,
          ),
        );
      }
    }
    const startle: number | undefined = lifts.startle;
    const wince: number | undefined = lifts.wince;
    if (startle !== undefined && wince !== undefined && !(startle > wince))
      complaints.push(
        `${name}: a startle raises a wrist ${startle.toFixed(3)} m and a wince ${wince.toFixed(3)} m, more for the startle expected`,
      );
  }
  TestValidator.equals("standing poses hold their ground", complaints, []);
}
