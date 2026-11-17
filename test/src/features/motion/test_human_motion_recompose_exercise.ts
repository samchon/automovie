import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionParams,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionManner,
  IAutoMovieScheduleCue,
} from "@automovie/interface";
import {
  AutoMovieMotionManner,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanRefusal } from "../internal/motionHumanRefusal";

/**
 * Exercise, stretch and dance on the grammar (#3378): the dance's beats
 * locked to a cue track, the tempo matrix, the manner presets, the
 * exercise's exact counts and the stretch's hold.
 *
 * Every case stands 0.5 s first, on the average man and the small woman.
 *
 * Scenarios:
 * 1. Beat lock: each dance step (bounce, sway, step-touch, box step) locked
 *    to a `music` track of beats at 96 and 128 bpm, the first beat 0.37 s
 *    after the step starts, places its event `beat{k}` within a sixtieth of
 *    a second of the track's `k`-th beat (the issue's "within one frame").
 * 2. Unlocked, the same steps place beat `k` at `k 60 / bpm` from the start,
 *    within 1e-9 s, at both tempi.
 * 3. A lock to a track with no beat after the step's start is refused with
 *    a `HumanRefusal` on the axis `lock`.
 * 4. The manner matrix: every dance step under the neutral manner and the
 *    first preset (`AutoMovieMotionManner.PRESET_NAMES`) performs.
 * 5. Exact counts: squats, lunges, high knees and jumping jacks of 1, 3 and
 *    5 repetitions place exactly that many `bottom{i}` instants.
 * 6. The stretch's hold: each stretch kind held by default lasts at least
 *    the 30 s Bandy et al. (1997) found effective, and one held 5 s lasts
 *    25 s less.
 * 7. The crawl's left arm enters the propulsive share (0.465) less the index
 *    of coordination after the right: -6.07 % for a novice and -1.76 % for
 *    an elite (Chollet et al. 2000 as #3254 reads them) within 1e-6 of a
 *    cycle, and the lag never grows with skill.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the laws through the public performance with cue tracks and reads their placed events; a beat off its cue, a tempo misread, a lock to nothing accepted, a manner that breaks a step, a miscount or a hold not kept fails.
 * @evidence contracts/development/testing.md#independent-expectations The cue track's own instants, the tempo's period, the requested counts and Bandy et al.'s 30 s hold.
 * @evidence contracts/development/testing.md#distinguishing-cases Four steps, two tempi, locked and unlocked, a track with no beat, two manners, four exercises at three counts, five stretches at two holds, two bodies; the swim's strokes on water belong to `test_human_motion_water`.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two polygon men and short performances in memory, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the six scenarios and their bounds and sources.
 */
export function test_human_motion_recompose_exercise(): void {
  const findings: string[] = [];
  const START: number = 0.5;
  const perform = (
    body: IAutoMovieMotionHumanBody,
    act: (chain: IAutoMovieMotionHumanChain) => IAutoMovieMotionHumanChain,
    cues?: Readonly<Record<string, readonly IAutoMovieScheduleCue[]>>,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "recompose-exercise",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: act(HumanChain.subject("a").stand({ seconds: START })).node,
      ...(cues === undefined ? {} : { cues }),
    });
  const events = (p: IAutoMovieMotionHumanPerformance): Map<string, number> => {
    const s: IAutoMovieMotionHumanSegment = p.segments("a")[1]!;
    return new Map(
      s.plan.events.map((e: IAutoMovieMotionEvent): [string, number] => [
        e.name,
        e.share * s.plan.duration,
      ]),
    );
  };
  const kinds: IAutoMovieMotionHumanActionParams["dance"]["kind"][] = [
    "bounce",
    "sway",
    "stepTouch",
    "boxStep",
  ];

  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);

    for (const bpm of [96, 128]) {
      const period: number = 60 / bpm;
      const track: IAutoMovieScheduleCue[] = Array.from(
        { length: 12 },
        (_: unknown, k: number): IAutoMovieScheduleCue => ({
          name: "beat",
          seconds: START + 0.37 + k * period,
        }),
      );
      for (const kind of kinds) {
        const label: string = `${name} ${kind} at ${bpm} bpm`;

        // 1. Locked to the track.
        try {
          const locked: Map<string, number> = events(
            perform(
              body,
              (c: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
                c.dance({ kind, beats: 8, lock: { of: "music" } }),
              { music: track },
            ),
          );
          for (let k: number = 1; k <= 8; k++) {
            const at: number | undefined = locked.get(`beat${k}`);
            const cue: number = track[k - 1]!.seconds - START;
            if (at === undefined || Math.abs(at - cue) > 1 / 60) {
              findings.push(
                `${label} locked: beat ${k} at ${at}, the cue at ${cue.toFixed(3)}`,
              );
              break;
            }
          }
        } catch (error) {
          findings.push(
            `${label} locked: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

        // 2. Unlocked, on the tempo.
        try {
          const free: Map<string, number> = events(
            perform(
              body,
              (c: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain => c.dance({ kind, beats: 8, bpm }),
            ),
          );
          for (let k: number = 1; k <= 8; k++)
            if (
              Math.abs((free.get(`beat${k}`) ?? Number.NaN) - k * period) > 1e-9
            ) {
              findings.push(
                `${label}: beat ${k} at ${free.get(`beat${k}`)}, the tempo's ${k * period}`,
              );
              break;
            }
        } catch (error) {
          findings.push(
            `${label}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    }

    // 3. A lock to nothing.
    TestValidator.predicate(
      `${name}: a lock to a track without beats is refused`,
      motionHumanRefusal(
        (): void => {
          perform(
            body,
            (c: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
              c.dance({ kind: "bounce", lock: { of: "music" } }),
            { music: [{ name: "beat", seconds: 0.1 }] },
          );
        },
        { kind: "parameter", axis: "lock", act: "dance" },
      ),
    );

    // 4. The manner matrix.
    const preset: IAutoMovieMotionManner.Preset =
      AutoMovieMotionManner.PRESET_NAMES[0]!;
    for (const kind of kinds)
      for (const manner of [undefined, AutoMovieMotionManner.PRESETS[preset]])
        try {
          perform(
            body,
            (c: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
              c.dance({
                kind,
                beats: 4,
                ...(manner === undefined
                  ? {}
                  : {
                      manner,
                    }),
              }),
          );
        } catch (error) {
          findings.push(
            `${name} ${kind} ${manner === undefined ? "neutral" : preset}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

    // 5. Exact counts.
    for (const kind of ["squat", "lunge", "highKnees", "jumpingJack"] as const)
      for (const reps of [1, 3, 5])
        try {
          const placed: Map<string, number> = events(
            perform(
              body,
              (c: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
                c.exercise({ kind, reps } as IAutoMovieMotionHumanActionParams["exercise"]),
            ),
          );
          const bottoms: number = [...placed.keys()].filter(
            (e: string): boolean => /^bottom\d+$/.test(e),
          ).length;
          if (bottoms !== reps)
            findings.push(
              `${name} ${kind} of ${reps}: ${bottoms} bottoms placed`,
            );
        } catch (error) {
          findings.push(
            `${name} ${kind} of ${reps}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }

    // 6. The stretch's hold.
    for (const kind of [
      "neckSide",
      "crossBody",
      "overheadSide",
      "quadriceps",
      "tree",
    ] as const)
      try {
        const held: IAutoMovieMotionHumanPerformance = perform(
          body,
          (c: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
            c.stretch({ kind } as IAutoMovieMotionHumanActionParams["stretch"]),
        );
        const short: IAutoMovieMotionHumanPerformance = perform(
          body,
          (c: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
            c.stretch({ kind, seconds: 5 } as IAutoMovieMotionHumanActionParams["stretch"]),
        );
        const long: number = held.segments("a")[1]!.plan.duration;
        const brief: number = short.segments("a")[1]!.plan.duration;
        if (!(long >= 30))
          findings.push(
            `${name} ${kind}: the default hold lasts ${long.toFixed(2)} s`,
          );
        if (Math.abs(long - brief - 25) > 1e-6)
          findings.push(
            `${name} ${kind}: a 5 s hold is ${(long - brief).toFixed(3)} s shorter, not 25`,
          );
      } catch (error) {
        findings.push(
          `${name} ${kind}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
  }

  // 7. The crawl's index of coordination follows skill.
  const crawl = (level: "novice" | "trained" | "elite"): number => {
    const p: IAutoMovieMotionHumanPerformance = new HumanPerformance({
      seed: "recompose-exercise",
      performers: [
        {
          subject: "a",
          body: motionHumanBody("m-average"),
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level },
        },
      ],
      composition: HumanChain.subject("a")
        .stand({ seconds: START })
        .swim({ kind: "frontCrawl", cycles: 2 }).node,
    });
    const placed: Map<string, number> = events(p);
    const s: IAutoMovieMotionHumanSegment = p.segments("a")[1]!;
    const period: number =
      placed.get("entryRight2")! - placed.get("entryRight1")! ||
      s.plan.duration / 2;
    return (placed.get("entryLeft1")! - placed.get("entryRight1")!) / period;
  };
  try {
    const novice: number = crawl("novice");
    const trained: number = crawl("trained");
    const elite: number = crawl("elite");
    if (
      Math.abs(novice - (0.465 + 0.0607)) > 1e-6 ||
      Math.abs(elite - (0.465 + 0.0176)) > 1e-6
    )
      findings.push(
        `the crawl's arm lag reads ${novice} for a novice and ${elite} for an elite, Chollet's ${0.465 + 0.0607} and ${0.465 + 0.0176}`,
      );
    if (!(novice >= trained && trained >= elite))
      findings.push(
        `the crawl's arm lag is not monotone in skill: ${novice}, ${trained}, ${elite}`,
      );
  } catch (error) {
    findings.push(
      `crawl: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  TestValidator.predicate(
    `exercise, stretch and dance on the grammar: ${findings.join("; ") || "all hold"}`,
    findings.length === 0,
  );
}
