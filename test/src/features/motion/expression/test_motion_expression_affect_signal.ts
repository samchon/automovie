import type {
  IAutoMovieMotionHumanAffect,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanExpression,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";

import { everydayTake } from "../../internal/everydayTake";
import { motionComplaints } from "../../internal/motionComplaints";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

const { HumanAffect } = AutoMovieMotionHumanExpression;

/**
 * Affect displays start and end at rest, move smoothly, leave limb goals alone
 * and keep their cited rhythms.
 *
 * Scenarios:
 *
 * 1. Every display adds nothing before its start, at its start, at its end and
 *    after it, and every angle it adds changes by less than 1.5 degrees between
 *    samples 1 ms apart (no jumps).
 * 2. A laugh's trunk pulses repeat every 210 ms (Provine 1996): the chest flexion
 *    peaks are spaced by the note interval within 2 ms.
 * 3. The layer adds onto the posture's own joint angles and returns the posture's
 *    limb goals and root unchanged; displays that overlap add.
 * 4. A display of non-positive length is refused on the seconds axis.
 * 5. Sigh and yawn agree on the authored inhale and exhale phases. An installed
 *    yawn displays the same jaw excursions over a standing actor.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates the display angles and the layer on a posture; a display that starts or ends off zero, jumps, loses the laugh's rhythm, touches a limb goal or ignores the base angles fails.
 * @evidence contracts/development/testing.md#independent-expectations The note interval is Provine's 210 ms; zero ends, continuity and untouched goals are the layer contract stated by IHumanLayer. The two half-phase samples follow the published 40 percent inhalation and the minimum-jerk midpoint of one half.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers all nine displays, before, inside and after, overlap and an invalid length; the posed result on a body is reviewed in captures.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit with one staged standing actor and the layer installed for the phase checks.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario and what it pins.
 */
export function test_motion_expression_affect_signal(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  const kinds: IAutoMovieMotionHumanAffect.Kind[] = [
    "laugh",
    "sigh",
    "yawn",
    "cough",
    "sneeze",
    "shiver",
    "sob",
    "weep",
    "gasp",
  ];
  const total = (
    a: Partial<Record<string, readonly [number, number, number]>>,
  ): number =>
    Object.values(a).reduce(
      (s: number, v) => s + Math.abs(v![0]) + Math.abs(v![1]) + Math.abs(v![2]),
      0,
    );
  for (const kind of kinds) {
    try {
      const length: number = HumanAffect.LENGTH[kind];
      checks.check(
        `${kind} rests at its ends`,
        [-1, 0, length, length + 1].every(
          (t: number): boolean =>
            total(HumanAffect.angles(kind, t, length)) === 0,
        ),
      );
      let jump: number = 0;
      let previous = HumanAffect.angles(kind, 0, length);
      for (let t: number = 0.001; t <= length; t += 0.001) {
        const now = HumanAffect.angles(kind, t, length);
        for (const bone of new Set([
          ...Object.keys(now),
          ...Object.keys(previous),
        ])) {
          const a = (now as Record<string, readonly number[]>)[bone] ?? [
            0, 0, 0,
          ];
          const b = (previous as Record<string, readonly number[]>)[bone] ?? [
            0, 0, 0,
          ];
          for (let i: number = 0; i < 3; i++)
            jump = Math.max(jump, Math.abs(a[i]! - b[i]!));
        }
        previous = now;
      }
      checks.check(`${kind} moves smoothly (${jump.toFixed(3)})`, jump < 1.5);
    } catch (error: unknown) {
      checks.check(`${String(kind)}: ${everydayTake.describe(error)}`, false);
    }
  }

  const peaks: number[] = [];
  // Locate maxima within the minimum number of complete note periods. Scan
  // actual amplitudes rather than trusting the timing of an internal event.
  const sample = (t: number): number =>
    HumanAffect.angles("laugh", t, 1.5).chest![0];
  const step = 0.0005;
  for (let t = 0.3 + step; t < 1.0; t += step) {
    const value = sample(t);
    if (value > sample(t - step) && value >= sample(t + step)) peaks.push(t);
  }
  // The scan starts inside a note, so its first local maximum may be the window's edge; gaps are read from the second peak on.
  const full: number[] = peaks;
  const gaps: number[] = full
    .slice(1)
    .map((p: number, i: number): number => p - full[i]!);
  checks.check(
    `laugh notes every 210 ms (${gaps.map((g) => g.toFixed(3)).join(", ")})`,
    gaps.length >= 2 &&
      gaps.every(
        (g: number): boolean => Math.abs(g - HumanAffect.NOTE) < 0.002,
      ),
  );

  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 1, y: 0, z: 2 },
    yaw: 30,
    pitch: 0,
    roll: 0,
    joints: { chest: [5, 0, 0] },
    limbs: {
      leftArm: {
        point: { x: 1, y: 1, z: 1 },
        bend: { x: 0, y: 0, z: 0 },
        planted: true,
      },
    },
  };
  const stageInput: ConstructorParameters<typeof HumanPerformance>[0] = {
    seed: "affect",
    performers: [
      {
        subject: "a",
        body: motionHumanBody("m-average"),
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").stand({ hold: 1 }).node,
  };
  const stage: HumanPerformance = new HumanPerformance(stageInput);
  const segment = stage.segments("a")[0]!;
  const context: IAutoMovieMotionHumanLayer.IContext = {
    subject: segment.context.subject,
    body: segment.context.body,
    skill: segment.context.skill,
    aim: (target, seconds) => segment.context.aim(target, seconds),
    random: (channel) => segment.context.random(channel),
    action: () => undefined,
  };
  const layered: IAutoMovieMotionHumanPosture = HumanAffect.layer([
    { kind: "cough", at: 0 },
  ]).apply(posture, 0.22, context);
  const cough: number = HumanAffect.angles(
    "cough",
    0.22,
    HumanAffect.LENGTH.cough,
  ).chest![0];
  checks.check(
    "adds onto the base angle",
    Math.abs(layered.joints.chest![0] - (5 + cough)) < 1e-12,
  );
  checks.check(
    "limb goals and root unchanged",
    layered.limbs === posture.limbs ||
      JSON.stringify(layered.limbs) === JSON.stringify(posture.limbs),
  );
  checks.check(
    "root unchanged",
    layered.root === posture.root && layered.yaw === 30,
  );
  const both: IAutoMovieMotionHumanPosture = HumanAffect.layer([
    { kind: "cough", at: 0 },
    { kind: "laugh", at: 0 },
  ]).apply(posture, 0.22, context);
  const laugh: number = HumanAffect.angles(
    "laugh",
    0.22,
    HumanAffect.LENGTH.laugh,
  ).chest![0];
  checks.check(
    "overlapping displays add",
    Math.abs(both.joints.chest![0] - (5 + cough + laugh)) < 1e-12,
  );
  const at: number = 0.1;
  const duration: number = 0.8;
  const installed: HumanPerformance = new HumanPerformance({
    ...stageInput,
    layers: {
      a: [HumanAffect.layer([{ kind: "yawn", at, duration: duration }])],
    },
  });
  const phases: readonly (readonly [number, number, number])[] = [
    [0.2, 3, 12.5],
    [0.4, 6, 25],
    [0.7, 2, 12.5],
  ];
  for (const [phase, shoulder, jaw] of phases) {
    try {
      const local: number = phase * duration;
      checks.check(
        `sigh shoulder at share ${phase}`,
        nclose(
          HumanAffect.angles("sigh", local, duration).leftShoulder![1],
          shoulder,
          1e-12,
        ),
      );
      checks.check(
        `yawn jaw at share ${phase}`,
        nclose(HumanAffect.angles("yawn", local, duration).jaw![0], jaw, 1e-12),
      );
      const time: number = at + local;
      const plainJaw: number =
        stage.pose("a", time).joints.find((joint) => joint.bone === "jaw")
          ?.flexion ?? 0;
      const posedJaw: number =
        installed.pose("a", time).joints.find((joint) => joint.bone === "jaw")
          ?.flexion ?? 0;
      checks.check(
        `installed yawn jaw at share ${phase}`,
        nclose(posedJaw - plainJaw, jaw, 1e-8),
      );
    } catch (error: unknown) {
      checks.check(
        `${String(phase)} ${String(shoulder)} ${String(jaw)}: ${everydayTake.describe(error)}`,
        false,
      );
    }
  }
  checks.check(
    "non-positive length refused on seconds",
    throwsError((): unknown => HumanAffect.angles("sigh", 0.1, 0), "seconds"),
  );
  checks.assert("expression affect signal");
}
