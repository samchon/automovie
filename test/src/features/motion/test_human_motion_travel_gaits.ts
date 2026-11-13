import type {
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_LEXICON,
  HumanChain,
  HumanPerformance,
  type HumanSegment,
  HumanSignature,
  type IHumanActionLaw,
  type IHumanBody,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Each named gait shows what its name says, against the neutral walk of the
 * same body: a stroll is slower, a hurry faster, a march keeps the drill's
 * cadence and step, a sneak is slower and lower than a slow walk, a trudge
 * drags, a swagger carries the arms wide, and a jog and a sprint leave the
 * ground.
 *
 * Read on the displayed body at the footfalls of the middle of the way, up
 * to five consecutive heel strikes between 30 and 80 % of the gait's time.
 * The gait names its heel strikes and toe-offs as events; the displayed
 * foot is checked to bear a 24th of a second after the first two of them,
 * so the instants read are footfalls the body shows. The cadence is the
 * rate of those strikes, the step the way the striking ankle advances from
 * one to the next, the speed the hip joints' advance over them. The hips'
 * height, the less bent knee and the wrists are averaged over the strikes
 * and the instants half way between them. A flight is an instant, half way
 * from a foot's toe-off to the other foot's strike, at which neither foot
 * bears.
 *
 * Scenarios, on the average man and the small woman:
 * 1. `stroll` goes at least 10 % slower than the neutral walk on shorter
 *    steps, and `hurry` at least 10 % faster on longer ones (comfortable
 *    and fast walking differ by about a third in speed, Bohannon 1997).
 * 2. `march` steps 120 times a minute within 2 %, each step within 5 % of
 *    30 inches (0.76 m) scaled by the body's hip height over 0.93 m (US
 *    Army TC 3-21.5, quick time; the scaling is provisional), over a way of
 *    twelve such steps.
 * 3. `sneak` is slower than the slow walk on shorter steps, with the hips
 *    lower and the stance knee more bent than in the neutral walk (the
 *    manner presets' acceptance; magnitudes await a stealth-gait study, so
 *    only the directions are asserted).
 * 4. `trudge` is slower than the neutral walk on shorter steps and swings
 *    the wrists through less fore-aft travel.
 * 5. `swagger` keeps the neutral walk's speed within 10 % and carries the
 *    wrists further apart.
 * 6. `jog` and `sprint` have a flight, which tells a run from a walk
 *    (Alexander 1984); the neutral walk has none; the sprint is faster than
 *    the jog and the jog faster than the neutral walk.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Registers each gait through the public input, performs it on real bodies and reads the displayed joints and soles; a style that is only a name over the neutral walk, a march off the drill's cadence or a run that never leaves the ground fails.
 * @evidence contracts/development/testing.md#independent-expectations The march's numbers are the drill manual's; the flight is the definition of running; the other styles are compared with the same body's neutral or slow walk in the direction their names and the cited acceptance state, never with a value read from a gait table. A style planned as the neutral walk under another name reads equal to it and fails every strict comparison. Limitation: except for the march, only directions are asserted, since no measured magnitude was read for the other styles; and the footfall instants are the gait's own events, checked against the displayed foot at two of them.
 * @evidence contracts/development/testing.md#distinguishing-cases Eight styles and two reference walks on two bodies of opposite build; the walk's absence of flight is the negative of the run's.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and builds ten short performances each in memory, reading about twenty instants of each; it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, at which instants, and the 6 scenarios with their bounds and sources.
 */
export function test_human_motion_travel_gaits(): void {
  const complaints: string[] = [];
  const laws: readonly IHumanActionLaw<never>[] = HUMAN_LEXICON.gait!;

  /** What one gait shows over the middle of its way. */
  interface IReading {
    /** The hip joints' advance over the strikes read, metres per second. */
    speed: number;

    /** Heel strikes a minute. */
    cadence: number;

    /** The striking ankle's advance from one strike to the next, metres. */
    step: number;

    /** The hip joints' mean height, metres. */
    hips: number;

    /** The less bent knee's mean flexion, degrees. */
    knee: number;

    /** The left wrist's fore-aft travel against the hips, metres. */
    swing: number;

    /** The mean distance between the wrists across the body, metres. */
    apart: number;

    /** Whether an instant with neither foot bearing was found. */
    flight: boolean;
  }

  /** A named footfall of a gait. */
  interface IFootfall {
    /** Film seconds. */
    seconds: number;

    /** The foot. */
    side: "left" | "right";
  }

  for (const name of ["m-average", "f-small"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const drill: number = (0.76 / 0.93) * body.measure.hipHeight;
    const read = (
      act: (chain: HumanChain) => HumanChain,
      label: string,
    ): IReading | null => {
      let performance: HumanPerformance;
      try {
        performance = new HumanPerformance({
          seed: "gaits",
          laws: [...laws],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: act(HumanChain.subject("a").stand({ seconds: 0.3 }))
            .node,
        });
      } catch (error) {
        complaints.push(
          `${name} ${label}: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
      }
      const segment: HumanSegment.ISegment = performance.segments("a")[1]!;
      const reader: HumanSignature.IReader = HumanSignature.of(
        performance,
        "a",
        body,
        0,
      );

      // The gait's named footfalls, in film seconds.
      const named = (kind: "HeelStrike" | "ToeOff"): IFootfall[] =>
        segment.plan.events
          .filter((e: IAutoMovieMotionEvent): boolean =>
            new RegExp(`^(left|right)${kind}\\d+$`).test(e.name),
          )
          .map(
            (e: IAutoMovieMotionEvent): IFootfall => ({
              seconds: segment.start + e.share * segment.plan.duration,
              side: e.name.startsWith("left") ? "left" : "right",
            }),
          )
          .sort((a: IFootfall, b: IFootfall): number => a.seconds - b.seconds);
      const span: number = segment.end - segment.entryTime;
      const strikes: IFootfall[] = named("HeelStrike")
        .filter(
          (s: IFootfall): boolean =>
            s.seconds >= segment.entryTime + 0.3 * span &&
            s.seconds <= segment.entryTime + 0.8 * span,
        )
        .slice(0, 5);
      if (strikes.length < 3) {
        complaints.push(
          `${name} ${label}: ${strikes.length} heel strikes named over the middle of the way, at least 3 expected`,
        );
        return null;
      }

      // The body shows the footfalls it names: a 24th of a second after a strike the foot bears.
      const after: number = 1 / 24;
      for (const strike of strikes.slice(0, 2))
        if (!HumanSignature.bears(reader, strike.seconds + after, strike.side))
          complaints.push(
            `${name} ${label}: the ${strike.side} foot does not bear a 24th of a second after its strike at ${strike.seconds.toFixed(2)} s`,
          );
      const hips = (t: number): { y: number; z: number } => {
        const l: IAutoMovieVector3 = HumanSignature.joint(
          reader,
          t,
          "leftUpperLeg",
        );
        const r: IAutoMovieVector3 = HumanSignature.joint(
          reader,
          t,
          "rightUpperLeg",
        );
        return { y: (l.y + r.y) / 2, z: (l.z + r.z) / 2 };
      };
      const first: IFootfall = strikes[0]!;
      const last: IFootfall = strikes[strikes.length - 1]!;
      const places: number[] = strikes.map(
        (s: IFootfall): number =>
          HumanSignature.joint(reader, s.seconds + after, `${s.side}Foot`).z,
      );

      // The strikes and the instants half way between them.
      const ts: number[] = strikes.flatMap(
        (s: IFootfall, i: number): number[] =>
          i === 0
            ? [s.seconds + after]
            : [
                (strikes[i - 1]!.seconds + s.seconds) / 2 + after,
                s.seconds + after,
              ],
      );
      const fore: number[] = ts.map(
        (t: number): number =>
          HumanSignature.joint(reader, t, "leftHand").z - hips(t).z,
      );

      // Half way from the other foot's toe-off to each strike, or just before the strike where the other foot is still down by name.
      const lifts: IFootfall[] = named("ToeOff");
      const flight: boolean = strikes.slice(1, 4).some((s: IFootfall): boolean => {
        const off: IFootfall | undefined = lifts
          .filter(
            (l: IFootfall): boolean =>
              l.side !== s.side && l.seconds < s.seconds,
          )
          .at(-1);
        const t: number =
          off === undefined || s.seconds - off.seconds > 0.5
            ? s.seconds - 1 / 60
            : (off.seconds + s.seconds) / 2;
        return (
          !HumanSignature.bears(reader, t, "left") &&
          !HumanSignature.bears(reader, t, "right")
        );
      });
      return {
        speed:
          (hips(last.seconds + after).z - hips(first.seconds + after).z) /
          (last.seconds - first.seconds),
        cadence: (60 * (strikes.length - 1)) / (last.seconds - first.seconds),
        step:
          (places[places.length - 1]! - places[0]!) / (places.length - 1),
        hips: HumanSignature.mean(ts, (t: number): number => hips(t).y),
        knee: HumanSignature.mean(ts, (t: number): number =>
          Math.min(
            HumanSignature.knee(reader, t, "left"),
            HumanSignature.knee(reader, t, "right"),
          ),
        ),
        swing: Math.max(...fore) - Math.min(...fore),
        apart: HumanSignature.mean(ts, (t: number): number =>
          Math.abs(
            HumanSignature.joint(reader, t, "leftHand").x -
              HumanSignature.joint(reader, t, "rightHand").x,
          ),
        ),
        flight,
      };
    };
    const styled = (row: string, metres: number): IReading | null =>
      read(
        (chain: HumanChain): HumanChain =>
          chain.registered(row, { to: { x: 0, y: 0, z: metres } }),
        row,
      );
    const neutral: IReading | null = read(
      (chain: HumanChain): HumanChain =>
        chain.walk({ to: { x: 0, y: 0, z: 8 } }),
      "walk",
    );
    const slow: IReading | null = read(
      (chain: HumanChain): HumanChain =>
        chain.walk({ to: { x: 0, y: 0, z: 6 }, pace: "slow" }),
      "slow walk",
    );
    if (neutral === null || slow === null) continue;
    const expect = (ok: boolean, message: string): void => {
      if (!ok) complaints.push(`${name}: ${message}`);
    };
    const mps = (v: number): string => `${v.toFixed(2)} m/s`;
    const m = (v: number): string => `${v.toFixed(3)} m`;
    expect(
      !neutral.flight,
      "the neutral walk has an instant with neither foot bearing",
    );

    // 1. Stroll and hurry.
    const stroll: IReading | null = styled("stroll", 6);
    if (stroll !== null)
      expect(
        stroll.speed <= 0.9 * neutral.speed && stroll.step < neutral.step,
        `a stroll goes ${mps(stroll.speed)} on ${m(stroll.step)} steps against the walk's ${mps(neutral.speed)} and ${m(neutral.step)}; at least 10 % slower and shorter expected`,
      );
    const hurry: IReading | null = styled("hurry", 10);
    if (hurry !== null)
      expect(
        hurry.speed >= 1.1 * neutral.speed && hurry.step > neutral.step,
        `a hurry goes ${mps(hurry.speed)} on ${m(hurry.step)} steps against the walk's ${mps(neutral.speed)} and ${m(neutral.step)}; at least 10 % faster and longer expected`,
      );

    // 2. March.
    const march: IReading | null = styled("march", 12 * drill);
    if (march !== null) {
      expect(
        Math.abs(march.cadence - 120) <= 2.4,
        `a march steps ${march.cadence.toFixed(1)} times a minute, 120 within 2 % expected`,
      );
      expect(
        Math.abs(march.step - drill) <= 0.05 * drill,
        `a march's step is ${m(march.step)}, ${m(drill)} within 5 % expected`,
      );
    }

    // 3. Sneak.
    const sneak: IReading | null = styled("sneak", 4);
    if (sneak !== null) {
      expect(
        sneak.speed < slow.speed && sneak.step < slow.step,
        `a sneak goes ${mps(sneak.speed)} on ${m(sneak.step)} steps against the slow walk's ${mps(slow.speed)} and ${m(slow.step)}; slower and shorter expected`,
      );
      expect(
        sneak.hips < neutral.hips && sneak.knee > neutral.knee,
        `a sneak carries the hips at ${m(sneak.hips)} with the stance knee at ${sneak.knee.toFixed(1)} degrees against the walk's ${m(neutral.hips)} and ${neutral.knee.toFixed(1)}; lower and more bent expected`,
      );
    }

    // 4. Trudge.
    const trudge: IReading | null = styled("trudge", 6);
    if (trudge !== null)
      expect(
        trudge.speed < neutral.speed &&
          trudge.step < neutral.step &&
          trudge.swing < neutral.swing,
        `a trudge goes ${mps(trudge.speed)} on ${m(trudge.step)} steps with ${m(trudge.swing)} of wrist travel against the walk's ${mps(neutral.speed)}, ${m(neutral.step)} and ${m(neutral.swing)}; less of each expected`,
      );

    // 5. Swagger.
    const swagger: IReading | null = styled("swagger", 8);
    if (swagger !== null)
      expect(
        Math.abs(swagger.speed - neutral.speed) <= 0.1 * neutral.speed &&
          swagger.apart > neutral.apart,
        `a swagger goes ${mps(swagger.speed)} with the wrists ${m(swagger.apart)} apart against the walk's ${mps(neutral.speed)} and ${m(neutral.apart)}; the same speed within 10 % and wider expected`,
      );

    // 6. Jog and sprint.
    const jog: IReading | null = styled("jog", 12);
    const sprint: IReading | null = styled("sprint", 20);
    if (jog !== null)
      expect(
        jog.flight && jog.speed > neutral.speed,
        `a jog ${jog.flight ? "has" : "has no"} flight and goes ${mps(jog.speed)} against the walk's ${mps(neutral.speed)}; a flight and a higher speed expected`,
      );
    if (sprint !== null && jog !== null)
      expect(
        sprint.flight && sprint.speed > jog.speed,
        `a sprint ${sprint.flight ? "has" : "has no"} flight and goes ${mps(sprint.speed)} against the jog's ${mps(jog.speed)}; a flight and a higher speed expected`,
      );
  }
  TestValidator.equals("each gait shows its signature", complaints, []);
}
