import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  HumanSport,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A box step puts one footfall on each beat and walks the feet round a
 * square back to where they stood: on the average man and on the small
 * woman, at 120 beats a minute, the right foot steps forward, the left to
 * its own side level with it, the right closes; the left steps back, the
 * right to its own side level with it, the left closes.
 *
 * The expectations are the figure's common description, for which no
 * source was read (forward, side, close, back, side, close, the feet
 * returning to their place), the authored tempo (beat `k` at `k 60 / bpm`
 * seconds, so a footfall is at rest on its beat and one 24 Hz frame after
 * it) and the campaign's bounds: 5 mm on a planted foot, 10 mm on a held
 * relation between the feet. The forward step's floor of a tenth of the
 * stature is provisional: it only tells a step from a shuffle. Two bodies
 * of opposite build suffice because every length is a share of the body's
 * own; one six-beat film each keeps the test far under a minute.
 *
 * Scenarios, for each of the two bodies, six beats of the box step out of
 * standing, the right foot first:
 * 1. On each beat the foot whose count it is has landed: its ankle moves
 *    less than 5 mm over the frame after the beat, and the other ankle
 *    stands within 5 mm of where it stood on the beat before.
 * 2. Beat 1 carries the right ankle forward by more than a tenth of the
 *    stature and less than 10 mm sideways; beat 2 puts the left ankle level
 *    with it within 10 mm and to the left of its stance by more than a
 *    tenth of the stature; on beat 3 the ankles are apart as they stood
 *    within 10 mm.
 * 3. Beat 4 returns the left ankle to its stance's depth within 10 mm; on
 *    beat 6 both ankles are within 5 mm of where they stood.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds a performance through the public chain on real bodies and reads displayed ankles at the authored beats; a late footfall, a sliding planted foot, a wrong corner or a square that does not close fails with the measure.
 * @evidence contracts/development/testing.md#independent-expectations The expectations are the figure's description, the authored tempo and the campaign's bounds; the square's side is never read from the law, only that both feet take the same one.
 * @evidence contracts/development/testing.md#distinguishing-cases The timing of the footfalls, the first half's corners and the return are separate assertions on two bodies of opposite build.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and one short film each without props; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is pinned, the source, what is provisional, why two bodies suffice and the 3 scenarios.
 */
export function test_human_motion_sport_box_step(): void {
  const complaints: string[] = [];
  const period: number = 0.5;
  const frame: number = 1 / 24;
  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stature: number = body.measure.stature;
    let film: HumanPerformance;
    try {
      film = new HumanPerformance({
        seed: "box-step",
        laws: [HumanSport.boxStep],
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
          .registered("boxStep", { bpm: 120, beats: 6 })
          .stand({ seconds: 0.3 }).node,
      });
    } catch (error) {
      complaints.push(
        `${name}: ${error instanceof Error ? error.message : String(error)}`,
      );
      continue;
    }
    const reader: HumanSignature.IReader = HumanSignature.of(
      film,
      "a",
      body,
      0,
    );
    const step: HumanSegment.ISegment = film
      .segments("a")
      .find((s: HumanSegment.ISegment): boolean => s.name === "boxStep")!;
    const ankle = (
      beat: number,
      foot: "left" | "right",
      later: number = 0,
    ): IAutoMovieVector3 =>
      HumanSignature.joint(
        reader,
        step.start + beat * period + later,
        `${foot}Foot` as AutoMovieHumanoidBone,
      );
    const moved = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
      1000 * Vector3.length(Vector3.subtract(a, b));

    // 1. One footfall on each beat, the other foot planted.
    for (let beat: number = 1; beat <= 6; beat++) {
      const foot: "left" | "right" = beat % 2 === 1 ? "right" : "left";
      const other: "left" | "right" = foot === "left" ? "right" : "left";
      const settled: number = moved(
        ankle(beat, foot),
        ankle(beat, foot, frame),
      );
      if (!(settled <= 5))
        complaints.push(
          `${name}: over the frame after beat ${beat} the ${foot} ankle moves ${settled.toFixed(1)} mm, 5 mm at most expected of a foot that landed on the beat`,
        );
      const slid: number = moved(ankle(beat, other), ankle(beat - 1, other));
      if (!(slid <= 5))
        complaints.push(
          `${name}: between beats ${beat - 1} and ${beat} the planted ${other} ankle moves ${slid.toFixed(1)} mm, 5 mm at most expected`,
        );
    }

    // 2. Forward, side, close.
    const from = (beat: number, foot: "left" | "right"): IAutoMovieVector3 =>
      Vector3.subtract(ankle(beat, foot), ankle(0, foot));
    const forward: IAutoMovieVector3 = from(1, "right");
    if (!(forward.z > 0.1 * stature && Math.abs(forward.x) <= 0.01))
      complaints.push(
        `${name}: on beat 1 the right ankle stands ${forward.z.toFixed(3)} m forward and ${forward.x.toFixed(3)} m sideways of its stance, more than ${(0.1 * stature).toFixed(3)} m forward and 0.010 m at most sideways expected`,
      );
    const side: IAutoMovieVector3 = from(2, "left");
    if (!(Math.abs(side.z - forward.z) <= 0.01 && side.x > 0.1 * stature))
      complaints.push(
        `${name}: on beat 2 the left ankle stands ${side.z.toFixed(3)} m forward and ${side.x.toFixed(3)} m to the left of its stance, level with the right's ${forward.z.toFixed(3)} m within 0.010 m and more than ${(0.1 * stature).toFixed(3)} m to the left expected`,
      );
    const closed: number = moved(from(3, "right"), from(3, "left"));
    if (!(closed <= 10))
      complaints.push(
        `${name}: on beat 3 the ankles stand ${closed.toFixed(1)} mm off their stance's spacing, 10 mm at most expected of feet closed`,
      );

    // 3. Back, side, close: the square returns.
    const back: number = from(4, "left").z;
    if (!(Math.abs(back) <= 0.01))
      complaints.push(
        `${name}: on beat 4 the left ankle stands ${back.toFixed(3)} m forward of its stance, back at its depth within 0.010 m expected`,
      );
    for (const foot of ["left", "right"] as const) {
      const off: number = 1000 * Vector3.length(from(6, foot));
      if (!(off <= 5))
        complaints.push(
          `${name}: on beat 6 the ${foot} ankle stands ${off.toFixed(1)} mm from where it stood, 5 mm at most expected`,
        );
    }
  }
  TestValidator.equals("a box step walks a square on the beat", complaints, []);
}
