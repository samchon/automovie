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
 * A body that crouches goes as low as the crouch's name says on feet that
 * stay where they are: a low squat held on the balls of the feet, and a
 * duck behind cover that comes back up.
 *
 * Scenarios, each row performed after 0.3 s of standing: `squatSit` on the
 * small woman and `takeCover` on the average man. One body a row is enough
 * because each claim is a knee angle and a foot that stays, which both
 * builds meet between the two rows; the instants are each plant window's
 * two ends and two between, where a planted foot dragged by the pelvis
 * shows, the middle of the hold and the end:
 * 1. Through every plant window the row declares, read at four instants
 *    spread over it, the part of the foot on the floor moves at most 5 mm
 *    (the campaign's slip bound): the ball, or for `squatSit`, whose heels
 *    are up, the toes' pad, the part that stays down while the foot rolls
 *    about the toes' joint.
 * 2. At the middle of `squatSit` both knees are flexed 150 degrees within
 *    10, the deep squat at the knee's range end (Hemmerich et al. 2006
 *    measure 157 +- 6 degrees in a heels-up squat).
 * 3. At the middle of `takeCover`, in its hold, both knees are flexed 100
 *    degrees within 10: the row is a partial crouch, the parallel squat of
 *    about 100 degrees of knee flexion (Escamilla 2001, Med Sci Sports
 *    Exerc 33:127). At its end both feet bear and the hip joints are back
 *    within 20 mm of the quiet stance's height (a provisional reading of
 *    "standing again").
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the crouching rows through the public input, performs each on a real body and reads the displayed feet, knees and hips; a sliding plant, a squat that stops short or a duck left crouched fails.
 * @evidence contracts/development/testing.md#independent-expectations The 5 mm is the campaign's slip bound, the knee angles are the cited measurements and the quiet stance is the film's own first posture; none is taken from the crouch law's table.
 * @evidence contracts/development/testing.md#distinguishing-cases A full squat held against a partial crouch that returns, heels up against heels down, over two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds two short performances in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 3 scenarios with their bounds and sources.
 */
export function test_human_motion_base_crouching_poses(): void {
  const complaints: string[] = [];
  const rows: readonly (readonly [string, "m-average" | "f-small", number])[] =
    [
      ["squatSit", "f-small", 150],
      ["takeCover", "m-average", 100],
    ];
  for (const [row, name, asked] of rows) {
    const body: IHumanBody = motionHumanBody(name);
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
    const hips = (t: number): number =>
      (HumanSignature.joint(reader, t, "leftUpperLeg").y +
        HumanSignature.joint(reader, t, "rightUpperLeg").y) /
      2;

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

    // 2 and 3. The knees at the middle of the hold.
    const middle: number = (segment.entryTime + end) / 2;
    for (const side of ["left", "right"] as const) {
      const knee: number = HumanSignature.knee(reader, middle, side);
      if (Math.abs(knee - asked) > 10)
        complaints.push(
          `${label}: the ${side} knee is flexed ${knee.toFixed(1)} degrees at the middle of the hold, ${asked} within 10 expected`,
        );
    }

    // 3. Back on the feet.
    if (row !== "takeCover") continue;
    for (const side of ["left", "right"] as const)
      if (!HumanSignature.bears(reader, end, side))
        complaints.push(`${label}: the ${side} foot does not bear at the end`);
    if (Math.abs(hips(end) - hips(0)) > 0.02)
      complaints.push(
        `${label}: the hips end at ${hips(end).toFixed(3)} m, within 20 mm of the quiet stance's ${hips(0).toFixed(3)} m expected`,
      );
  }
  TestValidator.equals("crouching poses go as low as they say", complaints, []);
}
