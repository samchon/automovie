import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HUMAN_DRILL_CADENCES,
  HUMAN_LEXICON,
  HumanCue,
  HumanEnsemble,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * Members keep step to a drum: a locked member's heel strikes answer the
 * beats, tighter for drilled troops, an unlocked one keeps its own tempo, and
 * the regulation's times set a march's cadence.
 *
 * Scenarios, members on three bodies marching 12 m:
 * 1. Eight elite members (every one locked) marching the French 1791
 *    ordinary step to a drum at 76 a minute: each member's cadence over its
 *    middle strikes is the drum's within 1 %.
 * 2. The standard deviation of strike minus nearest beat across the elite's
 *    strikes is smaller than across a militia's locked members'.
 * 3. Civilians (undrilled, about a third unlocked by the lock share of
 *    Nessler and Gilliland 2009) on the same drum: the members whose strikes
 *    stray from the beats keep cadences that spread across members.
 * 4. The root's speed has no jump at any strike of a locked elite member:
 *    the speeds a 200th of a second either side differ by under 0.1 m/s.
 * 5. Without a drum, the French 1791 ordinary time and the British 1792 quick
 *    time march at 76 and 108 steps a minute within 2 % (the regulations'
 *    cadences as reproduced by the Hamilton Papers' annotations), on steps
 *    within 15 % of their paces scaled by hip height.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs marches on a beat track and reads the heel-strike instants the displayed plan names: a cadence that ignores the drum, a spread that ignores discipline, an unlocked member forced onto the beat, a speed jump at a strike, or a regulation's wrong cadence is caught.
 * @evidence contracts/development/testing.md#independent-expectations The drum's tempo and the regulations' cadences are the sources'; elite tighter than militia is the relation the phase-correction model and the attribute table must keep; continuity is the time warp's own guarantee; the step's 15 % is the rounding to whole steps the march test uses.
 * @evidence contracts/development/testing.md#distinguishing-cases Elite, militia and civilian presets on one drum, a sweep of strikes for continuity, and two regulations without a drum; the march's own cadence on ways of every length is `test_human_motion_travel_march_ways`'.
 * @evidence contracts/development/testing.md#execution-ownership A unit test of the motions package on prepared polygon-man bodies, discovered by its exported name; postures and events, no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_human_motion_cadence(): void {
  const findings: string[] = [];
  const pool: IAutoMovieMotionHumanBody[] = [
    motionHumanBody("m-average"),
    motionHumanBody("f-small"),
    motionHumanBody("m-tall"),
  ];
  const drum: number[] = HumanCue.beats({ bpm: 76, count: 40, from: 1 })
    .filter((c: { name: string }): boolean => c.name === "beat")
    .map((c: { seconds: number }): number => c.seconds);
  const march = (
    preset: IAutoMovieMotionHumanEnsemble["preset"],
    count: number,
    drummed: boolean,
    regulation: "french1791" | "british1792" = "french1791",
    time: string = "ordinary",
  ): IMarched => {
    const ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble = HumanEnsemble.of({
      id: preset ?? "x",
      seed: "drum",
      count,
      bodies: pool,
      ...(preset === undefined ? {} : { preset }),
      places: (index: number) => ({
        at: { x: 1.2 * index, y: 0, z: 0 },
        yaw: 0,
      }),
    });
    const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "drum",
      laws: [...HUMAN_LEXICON.gait!],
      performers: HumanEnsemble.performers(ensemble),
      cues: { drum: HumanCue.beats({ bpm: 76, count: 40, from: 1 }) },
      composition: HumanEnsemble.chains(
        ensemble,
        (
          m: IAutoMovieMotionHumanEnsemble.IMember,
          chain: IAutoMovieMotionHumanChain,
        ) =>
          chain.registered("march", {
            to: { x: m.place.at.x, y: 0, z: 12 },
            regulation,
            time,
            ...(drummed ? { cadence: { cue: "drum" } } : {}),
          }),
      ),
    });
    const strikes: Map<string, number[]> = new Map();
    for (const m of ensemble.members) {
      const s: IAutoMovieMotionHumanSegment = performance.segments(
        m.subject,
      )[0]!;
      strikes.set(
        m.subject,
        s.plan.events
          .filter((e: IAutoMovieMotionEvent): boolean =>
            /^(left|right)HeelStrike\d+$/.test(e.name),
          )
          .map(
            (e: IAutoMovieMotionEvent): number =>
              s.start + e.share * s.plan.duration,
          )
          .sort((a: number, b: number): number => a - b),
      );
    }
    return { ensemble, strikes, performance };
  };
  const middle = (s: readonly number[]): number[] =>
    s.slice(Math.floor(s.length / 4), Math.ceil((3 * s.length) / 4));
  const cadence = (s: readonly number[]): number =>
    (60 * (s.length - 1)) / (s[s.length - 1]! - s[0]!);
  const asynchronies = (s: readonly number[]): number[] =>
    middle(s).map(
      (t: number): number =>
        t -
        drum.reduce(
          (best: number, b: number): number =>
            Math.abs(b - t) < Math.abs(best - t) ? b : best,
          drum[0]!,
        ),
    );
  const sd = (v: readonly number[]): number => {
    const m: number =
      v.reduce((a: number, b: number): number => a + b, 0) / v.length;
    return Math.sqrt(
      v.reduce((a: number, b: number): number => a + (b - m) ** 2, 0) /
        (v.length - 1),
    );
  };

  // 1 and 4. The elite on the drum.
  const elite: IMarched = march("elite", 8, true);
  for (const [subject, s] of elite.strikes) {
    const c: number = cadence(middle(s));
    if (Math.abs(c - 76) > 0.01 * 76)
      findings.push(
        `${subject} marches ${c.toFixed(2)} steps a minute on a 76 drum`,
      );
    for (const t of middle(s)) {
      const speed = (u: number): number => {
        const a: IAutoMovieVector3 = elite.performance.posture(
          subject,
          u - 0.0025,
        ).root;
        const b: IAutoMovieVector3 = elite.performance.posture(
          subject,
          u + 0.0025,
        ).root;
        return Math.hypot(b.x - a.x, b.z - a.z) / 0.005;
      };
      if (Math.abs(speed(t - 0.005) - speed(t + 0.005)) > 0.1) {
        findings.push(
          `${subject}'s speed jumps at its strike at ${t.toFixed(3)} s`,
        );
        break;
      }
    }
  }

  // 2. Elite against militia.
  const militia: IMarched = march("militia", 8, true);
  const eliteSpread: number = sd(
    [...elite.strikes.values()].flatMap(asynchronies),
  );
  const militiaSpread: number = sd(
    [...militia.strikes.values()].flatMap(asynchronies),
  );
  if (!(eliteSpread < militiaSpread))
    findings.push(
      `the elite's asynchrony spread ${(eliteSpread * 1000).toFixed(1)} ms is not below the militia's ${(militiaSpread * 1000).toFixed(1)} ms`,
    );

  // 3. Civilians: the unlocked keep their own tempos.
  const civilians: IMarched = march("civilians", 9, true);
  const own: number[] = [...civilians.strikes.values()]
    .filter(
      (s: number[]): boolean => Math.abs(cadence(middle(s)) - 76) > 0.01 * 76,
    )
    .map((s: number[]): number => cadence(middle(s)));
  if (own.length === 0) findings.push("no civilian kept a tempo of its own");
  else if (own.length > 1 && !(sd(own) > 0))
    findings.push("the unlocked civilians share one cadence");

  // 5. Regulations without a drum.
  for (const [regulation, time, expected] of [
    ["french1791", "ordinary", 76],
    ["british1792", "quick", 108],
  ] as const) {
    const run: IMarched = march("line", 3, false, regulation, time);
    for (const [index, [subject, s]] of [...run.strikes].entries()) {
      const c: number = cadence(middle(s));
      if (Math.abs(c - expected) > 0.02 * expected)
        findings.push(
          `${regulation} ${time}: ${subject} marches ${c.toFixed(1)} steps a minute, ${expected} within 2 % expected`,
        );
      const body: IAutoMovieMotionHumanBody = run.ensemble.members[index]!.body;
      const pace: number =
        (HUMAN_DRILL_CADENCES[regulation].pace / 0.93) * body.measure.hipHeight;
      const mid: number[] = middle(s);
      const travelled: number =
        run.performance.posture(subject, mid[mid.length - 1]!).root.z -
        run.performance.posture(subject, mid[0]!).root.z;
      const step: number = travelled / (mid.length - 1);
      if (Math.abs(step - pace) > 0.15 * pace)
        findings.push(
          `${regulation} ${time}: ${subject}'s step ${step.toFixed(3)} m, ${pace.toFixed(3)} within 15 % expected`,
        );
    }
  }
  TestValidator.equals("cadence entrained to a drum", findings, []);
}

/** A march performed: its ensemble, each member's heel-strike seconds and the performance. */
interface IMarched {
  /** The ensemble. */
  ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble;

  /** Each member's heel strikes, film seconds in order. */
  strikes: Map<string, number[]>;

  /** The performance. */
  performance: IAutoMovieMotionHumanPerformance;
}
