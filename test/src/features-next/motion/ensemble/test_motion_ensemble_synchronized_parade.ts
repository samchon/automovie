import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanEnsemble,
  IAutoMovieMotionHumanFormation,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanEnsemble,
  HumanCue,
  HumanPerformance,
} from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Six unarmed marchers of mixed stature travel in two ranks to a shared beat.
 *
 * Scenarios:
 * 1. The marchers keep their files within 0.12 m laterally and follow their
 *    rank's travel within 0.30 m at early and late slowdowns.
 * 2. At five consecutive interior beats of the 100 BPM track, every marcher
 *    strikes within 0.10 s of the beat, using the left foot on odd beats and the
 *    right on even beats.
 * 3. Each marcher's observed travel speed changes with the same course while
 *    their steps stay on the beat.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the cast, course measures, beat rate and synchronized-foot requirement.
 * @evidence contracts/development/testing.md#behavioral-verification Composes the public march with both a moving station and a shared cue track, then reads displayed roots and heel-strike events. Both witnesses lag uniform travel at the authored average speed by more than one step allowance. A default cadence misses the authored beats. Speed windows inside each course leg catch a misaligned clock that moves past the authored slowdown early.
 * @evidence contracts/development/testing.md#independent-expectations Positions come from the authored rank spacing and course samples; mean speeds come from the course legs' metres divided by seconds. The 0.30 m longitudinal window is half the scene's nominal 0.60 m step. The speed tolerance allows up to 0.09 m of root excursion in a 0.60 s window. The 0.12 m lateral and 0.10 s timing windows are scene requirements. The beat lattice is 60 divided by the authored BPM, and the times of heel contact are read from the law's event markers.
 * @evidence contracts/development/testing.md#distinguishing-cases Two ranks, three files and two statures share one course and beat track. The cadence and ensemble formation tests already exercise those axes separately.
 * @evidence contracts/development/testing.md#execution-ownership A motions unit test discovered by its exported name, using prepared polygon-man bodies and the public performance sampler.
 */
export function test_motion_ensemble_synchronized_parade(): void {
  const bpm: number = 100;
  const period: number = 60 / bpm;
  const bodies: IAutoMovieMotionHumanBody[] = [
    motionHumanBody("m-average"),
    motionHumanBody("f-small"),
  ];
  const formation: IAutoMovieMotionHumanFormation =
    AutoMovieMotionHumanEnsemble.HumanFormation.of({
      blocks: [
        {
          layout: {
            kind: "line",
            ranks: 2,
            files: 3,
            spacing: { lateral: 0.8, depth: 1 },
          },
          count: 6,
        },
      ],
      frame: {
        kind: "course",
        samples: [
          { seconds: 0, x: 0, y: 0, z: 0 },
          { seconds: 2.4, x: 0, y: 0, z: 1.8 },
          { seconds: 4.8, x: 0, y: 0, z: 4.5 },
          { seconds: 7.2, x: 0, y: 0, z: 6.3 },
          { seconds: 9.6, x: 0, y: 0, z: 9.6 },
        ],
      },
    });
  const ensemble: IAutoMovieMotionHumanEnsemble.IEnsemble =
    AutoMovieMotionHumanEnsemble.HumanEnsemble.of({
      id: "parade",
      seed: "parade",
      count: 6,
      bodies,
      attributes: { discipline: { mean: 1, spread: 0 } },
      formation,
    });
  const performance: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "parade",
    laws: [...HUMAN_LEXICON.gait!],
    performers: AutoMovieMotionHumanEnsemble.HumanEnsemble.performers(ensemble),
    cues: { drum: HumanCue.beats({ bpm, count: 24, from: 0 }) },
    composition: AutoMovieMotionHumanEnsemble.HumanEnsemble.chains(
      ensemble,
      (
        member: IAutoMovieMotionHumanEnsemble.IMember,
        chain: IAutoMovieMotionHumanChain,
      ): IAutoMovieMotionHumanChain =>
        chain.registered("march", {
          to: { x: member.place.at.x, y: 0, z: member.place.at.z + 9.6 },
          station: { formation, slot: member.index },
          cadence: { cue: "drum", foot: "left", index: 1 },
        }),
    ),
  });

  const courses: [number, number][] = [
    [2.4, 1.8],
    [7.2, 6.3],
  ];
  const speeds: [number, number][] = [
    [1.6, 1.8 / 2.4],
    [2.6, 2.7 / 2.4],
    [6.4, 1.8 / 2.4],
    [7.4, 3.3 / 2.4],
  ];
  const findings: string[] = [];
  for (const member of ensemble.members) {
    const x: number = (1 - (member.index % 3)) * 0.8;
    const rank: number = Math.floor(member.index / 3);
    for (const [seconds, advance] of courses) {
      const root: IAutoMovieVector3 = performance.posture(
        member.subject,
        seconds,
      ).root;
      if (
        !Number.isFinite(root.x) ||
        !Number.isFinite(root.z) ||
        Math.abs(root.x - x) > 0.12 ||
        Math.abs(root.z - (advance - rank)) > 0.3
      )
        findings.push(
          `${member.subject} is at (${root.x.toFixed(3)}, ${root.z.toFixed(3)}) at ${seconds} s, expected near (${x}, ${advance - rank})`,
        );
    }

    for (const [seconds, expected] of speeds) {
      const first: number = performance.posture(member.subject, seconds).root.z;
      const last: number = performance.posture(member.subject, seconds + period)
        .root.z;
      const speed: number = (last - first) / period;
      if (!Number.isFinite(speed) || Math.abs(speed - expected) > 0.15)
        findings.push(
          `${member.subject} moves at ${speed.toFixed(3)} m/s from ${seconds} s, expected near ${expected.toFixed(3)} m/s`,
        );
    }

    const segment: IAutoMovieMotionHumanSegment = performance.segments(
      member.subject,
    )[0]!;
    const strikes: { foot: string; seconds: number }[] = [];
    for (const event of segment.plan.events) {
      const match: RegExpExecArray | null = /^(left|right)HeelStrike\d+$/.exec(
        event.name,
      );
      if (match !== null)
        strikes.push({
          foot: match[1]!,
          seconds: segment.start + event.share * segment.plan.duration,
        });
    }
    for (let beat: number = 5; beat <= 9; ++beat) {
      const strike: { foot: string; seconds: number } | undefined =
        strikes.find(
          (value: { seconds: number }): boolean =>
            Math.abs(value.seconds - beat * period) <= 0.1,
        );
      if (strike === undefined)
        findings.push(
          `${member.subject} missed beat ${beat} by more than 0.10 s`,
        );
      else if (strike.foot !== (beat % 2 === 1 ? "left" : "right"))
        findings.push(`${member.subject} used the wrong foot on beat ${beat}`);
    }
  }
  TestValidator.equals("the parade keeps its stations and step", findings, []);
}
