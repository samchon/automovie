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
 * Every named pose keeps the feet it stands on where they are, and ends
 * where its name says: a knee taken on the floor, a brief kneel and a duck
 * back on the feet, a body sat or lain down on the floor.
 *
 * A foot that bears does not slide. Each action declares when each foot is
 * planted, and through each of those windows the part of that foot on the
 * floor stays within the campaign's slip bound. The stances are
 * `test_human_motion_base_stances`'s.
 *
 * Scenarios, on the average man and the small woman, each row performed
 * after 0.3 s of standing on one of them, alternating down the rows, and on
 * both for `startle` and `wince`. One body a row is enough because each
 * claim is where a named pose ends, which both builds meet across the
 * family; the instants are each window's two ends and two between, where a
 * planted foot dragged by the pelvis shows:
 * 1. Every row of `HumanPose`: through every plant window the row declares,
 *    read at four instants spread over it, the foot's ball moves at most
 *    5 mm; for `squatSit`, whose heels are up, the toes' pad is read, the
 *    part that stays down while the foot rolls about the toes' joint.
 * 3. `takeAKnee` ends with one knee joint within 0.06 statures of the floor
 *    (a knee resting on the floor holds its joint centre about half a knee's
 *    depth above it; the share is provisional) and the other knee above it.
 *    `kneelSit` ends with both knee joints within that share of the floor.
 *    At the middle of `squatSit` both knees are flexed 150 degrees within
 *    10, the deep squat at the knee's range end (Hemmerich et al. 2006
 *    measure 157 +- 6 degrees in a heels-up squat).
 * 4. `kneelBriefly`, `takeCover`, `braceForImpact`, `startle`, `wince` and
 *    `stumble` end on the feet: both feet bear at the end. `kneelBriefly`
 *    and `takeCover` are back at the quiet stance's hip height within 20 mm,
 *    and at the middle of `takeCover`, in its hold, both knees are flexed
 *    100 degrees within 10: the row is a partial crouch, the parallel squat
 *    of about 100 degrees of knee flexion (Escamilla 2001, Med Sci Sports
 *    Exerc 33:127).
 * 5. `lieStill` ends with the hip joints, the neck and the head all within
 *    0.15 statures of the floor (a lying trunk is one body depth thick, and
 *    the share is provisional). `sitCrossLegged` and `sitSideways` also end
 *    with both knees flexed 120 to 155 degrees (Hemmerich et al. 2006
 *    measure 130 to 150 in cross-legged sitting; the 10 and 5 beyond are a
 *    provisional reading margin) and both ankle joints within 0.06
 *    statures of the floor; cross-legged, the left ankle lies to the right
 *    of the right one, and side-sitting, the left wrist is within a quarter
 *    of the hand's length plus 15 mm of the floor, the hand leant on.
 *    `sitOnFloor`, `sitCrossLegged` and `sitSideways` end with the hip
 *    joints within that share of the floor and the head above 0.35 statures: seated, not lying (an adult's sitting
 *    height is about half the stature; the share is a provisional floor).
 * 6. `startle` raises a wrist further than `wince` does (a flinch grows with
 *    its intensity).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers every pose row through the public input, performs each on a real body and reads the displayed feet, knees, hips and head; a sliding plant, a kneel that hovers or a lying body left sitting fails.
 * @evidence contracts/development/testing.md#independent-expectations The 5 mm is the campaign's slip bound and the quiet stance is the film's own first posture; where each row ends is what its name states. The stature shares are provisional readings of "on the floor", and the 20 mm on the hips' height a provisional reading of "standing again", stated as such, and none is taken from a law's table. A planted foot dragged with the pelvis reads as slip; a kneel that stops short reads a high knee. Limitation: the plant windows are the ones each action declares, so a foot that slides outside any declared window is the verdict report's to catch.
 * @evidence contracts/development/testing.md#distinguishing-cases Every pose row of the lexicon over two bodies of opposite build; rows that go down and stay, go down and return, and step.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds one short performance per row in memory, two for the flinches; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 6 scenarios with their bounds and which are provisional.
 */
export function test_human_motion_base_poses(): void {
  const complaints: string[] = [];
  const rows: readonly string[] = HUMAN_LEXICON.pose!.map(
    (law: IHumanActionLaw<never>): string => law.name,
  );
  const names: readonly ["m-average", "f-small"] = ["m-average", "f-small"];
  for (let b: number = 0; b < names.length; ++b) {
    const name: "m-average" | "f-small" = names[b]!;
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
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
      const ball = (side: "left" | "right", t: number): IAutoMovieVector3 =>
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
            `${label}: the ${side} foot's ${down} moves ${(slip * 1000).toFixed(1)} mm while planted from ${from.toFixed(2)} to ${to.toFixed(2)} s, within 5 mm expected`,
          );
      }
      const stands = (level: boolean): void => {
        for (const side of ["left", "right"] as const)
          if (!HumanSignature.bears(reader, end, side))
            complaints.push(
              `${label}: the ${side} foot does not bear at the end`,
            );
        if (level && Math.abs(hips(end) - hips(0)) > 0.02)
          complaints.push(
            `${label}: the hips end at ${hips(end).toFixed(3)} m, within 20 mm of the quiet stance's ${hips(0).toFixed(3)} m expected`,
          );
      };

      // 3. A knee on the floor.
      if (row === "takeAKnee") {
        const knees: number[] = [
          y("leftLowerLeg", end),
          y("rightLowerLeg", end),
        ];
        const low: number = Math.min(...knees);
        const up: number = Math.max(...knees);
        if (low > 0.06 * stature || up <= low + 0.06 * stature)
          complaints.push(
            `${label}: the knees end at ${low.toFixed(3)} and ${up.toFixed(3)} m, one within ${(0.06 * stature).toFixed(3)} m of the floor and the other above it expected`,
          );
      }

      // 3. Sat back on the heels, and squatting low.
      if (row === "kneelSit") {
        const high: number = Math.max(
          y("leftLowerLeg", end),
          y("rightLowerLeg", end),
        );
        if (high > 0.06 * stature)
          complaints.push(
            `${label}: the higher knee ends ${high.toFixed(3)} m above the floor, both within ${(0.06 * stature).toFixed(3)} m expected`,
          );
      }
      if (row === "squatSit") {
        const middle: number = (segment.entryTime + end) / 2;
        for (const side of ["left", "right"] as const) {
          const knee: number = HumanSignature.knee(reader, middle, side);
          if (Math.abs(knee - 150) > 10)
            complaints.push(
              `${label}: the ${side} knee is flexed ${knee.toFixed(1)} degrees at the middle of the hold, 150 within 10 expected`,
            );
        }
      }

      // 4. Back on the feet.
      if (row === "kneelBriefly" || row === "takeCover") stands(true);
      if (["braceForImpact", "startle", "wince", "stumble"].includes(row))
        stands(false);
      if (row === "takeCover") {
        const middle: number = (segment.entryTime + end) / 2;
        for (const side of ["left", "right"] as const) {
          const knee: number = HumanSignature.knee(reader, middle, side);
          if (Math.abs(knee - 100) > 10)
            complaints.push(
              `${label}: the ${side} knee is flexed ${knee.toFixed(1)} degrees at the middle of the hold, 100 within 10 expected`,
            );
        }
      }

      // 5. Lying on the floor.
      if (row === "lieStill") {
        const heights: readonly (readonly [string, number])[] = [
          ["hips", hips(end)],
          ["neck", y("neck", end)],
          ["head", y("head", end)],
        ];
        for (const [part, height] of heights)
          if (height > 0.15 * stature)
            complaints.push(
              `${label}: the ${part} ends ${height.toFixed(3)} m above the floor, within ${(0.15 * stature).toFixed(3)} m expected`,
            );
      }

      // 5. Seated on the floor: the hips down, the head up.
      if (["sitOnFloor", "sitCrossLegged", "sitSideways"].includes(row)) {
        if (hips(end) > 0.15 * stature || y("head", end) < 0.35 * stature)
          complaints.push(
            `${label}: the hips end ${hips(end).toFixed(3)} m and the head ${y("head", end).toFixed(3)} m above the floor; the hips within ${(0.15 * stature).toFixed(3)} m and the head above ${(0.35 * stature).toFixed(3)} m expected`,
          );
      }

      // 5. Folded legs lie on the floor.
      if (row === "sitCrossLegged" || row === "sitSideways") {
        for (const side of ["left", "right"] as const) {
          const knee: number = HumanSignature.knee(reader, end, side);
          const ankle: number = y(`${side}Foot`, end);
          if (knee < 120 || knee > 155 || ankle > 0.06 * stature)
            complaints.push(
              `${label}: the ${side} knee ends flexed ${knee.toFixed(1)} degrees with its ankle ${ankle.toFixed(3)} m above the floor; 120 to 155 degrees and within ${(0.06 * stature).toFixed(3)} m expected`,
            );
        }
        const across: number =
          HumanSignature.joint(reader, end, "leftFoot").x -
          HumanSignature.joint(reader, end, "rightFoot").x;
        if (row === "sitCrossLegged" && across >= 0)
          complaints.push(
            `${label}: the left ankle ends ${across.toFixed(3)} m to the left of the right one, to its right expected: the legs are not crossed`,
          );
        const wrist: number = y("leftHand", end);
        if (row === "sitSideways" && wrist > 0.25 * body.measure.hand + 0.015)
          complaints.push(
            `${label}: the left wrist ends ${wrist.toFixed(3)} m above the floor, within ${(0.25 * body.measure.hand + 0.015).toFixed(3)} m expected for a hand it leans on`,
          );
      }

      // 6. How far a wrist rises.
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
  TestValidator.equals("stances and poses hold their ground", complaints, []);
}
