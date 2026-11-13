import type {
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanFoot,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanBody,
  type IHumanContactWindow,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A march keeps its cadence over any way, on any body, and neither a march
 * nor a sneak lets a standing foot slide.
 *
 * A drill step is called at 120 a minute whoever marches and however far,
 * so over a way that is not a whole number of steps it is the step that
 * gives, never the cadence. A longer-legged soldier's step is longer. And
 * in any gait the foot the body stands on stays where it was set down.
 *
 * The footfalls are the heel strikes the gait names, between 20 and 85 % of
 * its time; the displayed foot is checked to bear a 24th of a second after
 * the first two, and the step is read from the displayed ankle.
 *
 * Scenarios, on the average man, the small woman and the short-legged man:
 * 1. A march over 3.3 m, 5.0 m and 7.4 m, none a whole number of drill
 *    steps: the cadence over the middle of the way is 120 steps a minute
 *    within 2 % (US Army TC 3-21.5, quick time).
 * 2. Over each way the step is within 15 % of 30 inches (0.76 m) scaled by
 *    the body's hip height over 0.93 m (the scaling is provisional): a way
 *    of four steps or more is covered in the nearest whole number of them,
 *    which moves the step by at most one part in eight.
 * 3. Over 7.4 m the average man's step is longer than the small woman's,
 *    and `doubleTime` over the same way steps 180 times a minute within
 *    2 % on the same step within 15 % (TC 3-21.5, double time; the step is
 *    unverified in the current edition).
 * 4. In each march, and in a sneak over 3 m, through the middle third of
 *    the three plant windows nearest the middle of the gait, read at four
 *    instants each, the toe's sole point moves at most 5 mm (the campaign's
 *    slip bound). The toes stay flat on the floor while the heel rises
 *    about their joint, the forefoot rocker of Perry and Burnfield's Gait
 *    Analysis, so the toe is the point that must not move; the ends of a
 *    stance roll over the heel and the toes.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers the gaits through the public input, performs them on real bodies and reads the displayed feet; a march whose cadence drifts with the distance, a step that ignores the body, or a skating stance foot fails.
 * @evidence contracts/development/testing.md#independent-expectations The cadence and the step are the drill manual's, the one-in-eight is the arithmetic of rounding to whole steps, and the slip bound is the campaign's; none is read from the gait's tables. A march that keeps its speed and lets the cadence rise on a short way, as the walk does, reads above 122 steps a minute. Limitation: the footfall instants are the gait's own events, checked against the displayed foot at two of them, and the middle third of a stance is read for slip, so the heel and toe rockers at its ends are another test's.
 * @evidence contracts/development/testing.md#distinguishing-cases Three ways off the step grid by three bodies with different legs, a metamorphic pair on leg length, and a second gait for the slip.
 * @evidence contracts/development/testing.md#execution-ownership Prepares three polygon men and builds twelve short performances in memory, reading about twenty instants of each; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule, how the footfalls are read, and the 4 scenarios with their bounds and sources.
 */
export function test_human_motion_travel_march_ways(): void {
  const complaints: string[] = [];
  const steps: Record<string, number> = {};

  /** A named heel strike. */
  interface IStrike {
    /** Film seconds. */
    seconds: number;

    /** The foot. */
    side: "left" | "right";
  }

  for (const name of ["m-average", "f-small", "m-short-legged"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const drill: number = (0.76 / 0.93) * body.measure.hipHeight;
    const rows: readonly (readonly [string, number])[] = [
      ["march", 3.3],
      ["march", 5.0],
      ["march", 7.4],
      ["doubleTime", 7.4],
      ["sneak", 3.0],
    ];
    for (const [row, metres] of rows) {
      const label: string = `${name} ${row} over ${metres} m`;
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "march",
          laws: [...HUMAN_LEXICON.gait!],
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
            .registered(row, { to: { x: 0, y: 0, z: metres } }).node,
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
      const span: number = segment.end - segment.entryTime;

      // 1 to 3. Cadence and step over the middle of the way.
      if (row !== "sneak") {
        const called: number = row === "march" ? 120 : 180;
        const strikes: IStrike[] = segment.plan.events
          .filter((e: IAutoMovieMotionEvent): boolean =>
            /^(left|right)HeelStrike\d+$/.test(e.name),
          )
          .map(
            (e: IAutoMovieMotionEvent): IStrike => ({
              seconds: segment.start + e.share * segment.plan.duration,
              side: e.name.startsWith("left") ? "left" : "right",
            }),
          )
          .sort((a: IStrike, b: IStrike): number => a.seconds - b.seconds)
          .filter(
            (s: IStrike): boolean =>
              s.seconds >= segment.entryTime + 0.2 * span &&
              s.seconds <= segment.entryTime + 0.85 * span,
          );
        if (strikes.length < 3) {
          complaints.push(
            `${label}: ${strikes.length} heel strikes named over the middle of the way, at least 3 expected`,
          );
          continue;
        }
        const after: number = 1 / 24;
        for (const strike of strikes.slice(0, 2))
          if (
            !HumanSignature.bears(reader, strike.seconds + after, strike.side)
          )
            complaints.push(
              `${label}: the ${strike.side} foot does not bear a 24th of a second after its strike at ${strike.seconds.toFixed(2)} s`,
            );
        const first: IStrike = strikes[0]!;
        const last: IStrike = strikes[strikes.length - 1]!;
        const place = (s: IStrike): number =>
          HumanSignature.joint(reader, s.seconds + after, `${s.side}Foot`).z;
        const step: number =
          (place(last) - place(first)) / (strikes.length - 1);
        const cadence: number =
          (60 * (strikes.length - 1)) / (last.seconds - first.seconds);
        if (Math.abs(cadence - called) > 0.02 * called)
          complaints.push(
            `${label}: ${cadence.toFixed(1)} steps a minute, ${called} within 2 % expected`,
          );
        if (Math.abs(step - drill) > 0.15 * drill)
          complaints.push(
            `${label}: the step is ${step.toFixed(3)} m, ${drill.toFixed(3)} m within 15 % expected`,
          );
        if (row === "march" && metres > 7) steps[name] = step;
      }

      // 4. No stance foot slides: the three plant windows nearest the middle of the gait.
      const middle: number = segment.entryTime + span / 2;
      const windows: { side: "left" | "right"; from: number; to: number }[] =
        segment.plan.contacts
          .filter(
            (c: IHumanContactWindow): boolean =>
              c.kind === "plant" && c.part.endsWith("Foot"),
          )
          .map(
            (
              c: IHumanContactWindow,
            ): { side: "left" | "right"; from: number; to: number } => ({
              side: c.part === "leftFoot" ? "left" : "right",
              from: Math.max(
                segment.entryTime,
                segment.start + c.from * segment.plan.duration,
              ),
              to: Math.min(
                segment.end,
                segment.start + c.to * segment.plan.duration,
              ),
            }),
          )
          .filter(
            (w: {
              side: "left" | "right";
              from: number;
              to: number;
            }): boolean => w.to - w.from >= 0.15,
          )
          .sort(
            (
              a: { side: "left" | "right"; from: number; to: number },
              b: { side: "left" | "right"; from: number; to: number },
            ): number =>
              Math.abs((a.from + a.to) / 2 - middle) -
              Math.abs((b.from + b.to) / 2 - middle),
          )
          .slice(0, 3);
      for (const w of windows) {
        // The toe's sole point rides the toes, which stay flat on the floor from foot-flat until the foot leaves; the ball's rides the foot, which turns about the toes' joint above it once the heel rises.
        const ball = (t: number): IAutoMovieVector3 =>
          HumanFoot.sockets(body, HumanSignature.bones(reader, t), w.side).find(
            (s: HumanFoot.ISocket): boolean => s.socket === "toe",
          )!.point;
        const a: number = w.from + (w.to - w.from) / 3;
        const third: number = (w.to - w.from) / 3;
        const first: IAutoMovieVector3 = ball(a);
        let slip: number = 0;
        for (let k: number = 1; k <= 3; ++k) {
          const now: IAutoMovieVector3 = ball(a + (k / 3) * third);
          slip = Math.max(
            slip,
            Math.hypot(now.x - first.x, now.y - first.y, now.z - first.z),
          );
        }
        if (slip > 0.005)
          complaints.push(
            `${label}: the ${w.side} foot's toe moves ${(slip * 1000).toFixed(1)} mm through the middle of its stance from ${w.from.toFixed(2)} to ${w.to.toFixed(2)} s, within 5 mm expected`,
          );
      }
    }
  }
  const tall: number | undefined = steps["m-average"];
  const short: number | undefined = steps["f-small"];
  if (tall !== undefined && short !== undefined && !(tall > short))
    complaints.push(
      `the average man's march step is ${tall.toFixed(3)} m and the small woman's ${short.toFixed(3)} m, longer for the longer legs expected`,
    );
  TestValidator.equals("a march keeps its cadence", complaints, []);
}
