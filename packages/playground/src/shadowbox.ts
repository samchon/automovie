import { sequenceMotion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieKeyframe,
  IAutoMovieMotion,
  IAutoMoviePose,
} from "@automovie/interface";

import { createStickmanMotionJoint as j } from "./createStickmanMotionJoint";
import { createStickmanMotionKeyframe as key } from "./createStickmanMotionKeyframe";
import { createStickmanMotionPose as pose } from "./createStickmanMotionPose";
import { createStickmanMotionRoot as root } from "./createStickmanMotionRoot";

const GUARD: IAutoMovieJointPose[] = [
  j("spine", { flexion: 9 }),
  j("chest", { flexion: 6 }),
  j("leftUpperArm", { flexion: 38, abduction: 32 }),
  j("leftLowerArm", { flexion: 122 }),
  j("rightUpperArm", { flexion: 38, abduction: 32 }),
  j("rightLowerArm", { flexion: 122 }),
  j("leftUpperLeg", { abduction: 9, flexion: 12 }),
  j("rightUpperLeg", { abduction: 9, flexion: -14 }),
  j("leftLowerLeg", { flexion: 14 }),
  j("rightLowerLeg", { flexion: 22 }),
];

/**
 * Assemble the existing looping kickboxing choreography from fixed guarded strikes, defence poses, footwork and kick chamber/strike pairs. Authored joint angles are degrees and local root displacements are metres; sparse beat durations are seconds. Technique names describe choreography, not measured fighter ability, admitted clinical ROM, impact or ground-contact simulation.
 *
 * @evidence contracts/common.md#principled-implementation Bone-keyed guard merging forms each pose, fixed beat builders state every return to guard and canonical sequenceMotion concatenates their exact timing while preserving seam easing.
 * @evidence contracts/common.md#clear-and-simple-design Named pose/beat vocabulary keeps the authored sequence visible in one producer; engine interpolation and the page's humanoid axes/rest-frame/optional clamp remain separate consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Conventional technique angles, timing fractions and roots are not physiological observations or contact proof; no solver tolerance or fixture-specific replacement makes the choreography valid.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies angular/root/time units, guarded beat composition and the limits of technique labels.
 * @evidence contracts/performance.md#efficient-algorithms The fixed technique/beat population bounds guard-Map construction and total key generation; sequencing traverses all k keys in O(k) time/storage, with later model FK and rendering retained by consumers.
 * @evidence contracts/performance.md#reuse-equivalent-work Guard records and named technique poses are reused by multiple local beats, while sequencing copies shifted keys and borrows pose data; each call independently assembles its authored motion.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One fixed module guard vocabulary persists and returned keys borrow local/shared joint and root records, which consumers must not mutate through one beat. No physics task, playback clock, worker or GPU handle is acquired.
 *
 * @author Samchon
 */
export const shadowbox: (sk: string) => IAutoMovieMotion = (
  sk: string,
): IAutoMovieMotion => {
  const merge: (over: IAutoMovieJointPose[]) => IAutoMoviePose = (
    over: IAutoMovieJointPose[],
  ): IAutoMoviePose => {
    const m: Map<AutoMovieHumanoidBone, IAutoMovieJointPose> = new Map(
      GUARD.map(
        (
          x: IAutoMovieJointPose,
        ): readonly [AutoMovieHumanoidBone, IAutoMovieJointPose] => [x.bone, x],
      ),
    );
    for (const o of over) m.set(o.bone, o);
    return pose(sk, [...m.values()]);
  };
  const guard: IAutoMoviePose = merge([]);
  // a step: the same pose carried on a translated root (footwork)
  const at: (p: IAutoMoviePose, x: number, z: number) => IAutoMoviePose = (
    p: IAutoMoviePose,
    x: number,
    z: number,
  ): IAutoMoviePose => ({
    ...p,
    root: root(x, 0, z, 0),
  });

  const beat: (
    dur: number,
    frames: [number, IAutoMoviePose][],
  ) => IAutoMovieMotion = (
    dur: number,
    frames: [number, IAutoMoviePose][],
  ): IAutoMovieMotion => ({
    id: "beat",
    skeleton: sk,
    duration: dur,
    loop: false,
    keyframes: frames.map(
      ([t, p]: [number, IAutoMoviePose]): IAutoMovieKeyframe => key(t, p),
    ),
  });

  // ── hands ──────────────────────────────────────────────────────────────
  const jab: IAutoMoviePose = merge([
    j("leftUpperArm", { flexion: 94, abduction: 96 }),
    j("leftLowerArm", { flexion: 8 }),
    j("spine", { flexion: 9, twist: -12 }),
    j("chest", { flexion: 6, twist: -8 }),
  ]);
  const cross: IAutoMoviePose = merge([
    j("rightUpperArm", { flexion: 94, abduction: 96 }),
    j("rightLowerArm", { flexion: 10 }),
    j("spine", { flexion: 9, twist: 26 }),
    j("chest", { flexion: 6, twist: 18 }),
    j("rightUpperLeg", { abduction: 9, flexion: -4 }),
  ]);
  const leadHook: IAutoMoviePose = merge([
    j("leftUpperArm", { flexion: 54, abduction: 98 }),
    j("leftLowerArm", { flexion: 94 }),
    j("spine", { flexion: 9, twist: 22 }),
    j("chest", { flexion: 6, twist: 16 }),
  ]);
  const rearHook: IAutoMoviePose = merge([
    j("rightUpperArm", { flexion: 54, abduction: 98 }),
    j("rightLowerArm", { flexion: 94 }),
    j("spine", { flexion: 9, twist: -18 }),
    j("chest", { flexion: 6, twist: -12 }),
  ]);
  const leadUpper: IAutoMoviePose = merge([
    j("leftUpperArm", { flexion: 52, abduction: 132 }),
    j("leftLowerArm", { flexion: 126 }),
    j("spine", { flexion: 4, twist: 12 }),
    j("chest", { flexion: 2, twist: 8 }),
  ]);
  const rearUpper: IAutoMoviePose = merge([
    j("rightUpperArm", { flexion: 56, abduction: 138 }),
    j("rightLowerArm", { flexion: 126 }),
    j("spine", { flexion: 2, twist: 16 }),
    j("chest", { flexion: 0, twist: 12 }),
  ]);

  // ── defence ────────────────────────────────────────────────────────────
  // slip: ride the head off-line, sitting into the knees a little (not a stiff
  // waist-only lean) so it loads like a real fighter
  const slip: (d: number) => IAutoMoviePose = (d: number): IAutoMoviePose => ({
    ...merge([
      j("spine", { flexion: 14, abduction: 18 * d, twist: 8 * d }),
      j("chest", { flexion: 9, abduction: 14 * d }),
      j("leftUpperLeg", { abduction: 9, flexion: 12 }),
      j("rightUpperLeg", { abduction: 9, flexion: 10 }),
      j("leftLowerLeg", { flexion: 26 }),
      j("rightLowerLeg", { flexion: 32 }),
    ]),
    root: root(0, -0.08, 0, 0),
  });
  // weave: a deep bob to one side, waist AND both knees fold together and the
  // whole body sinks low under the imagined punch, then comes up the far side
  const weave: (d: number) => IAutoMoviePose = (d: number): IAutoMoviePose => ({
    ...merge([
      j("spine", { flexion: 20, abduction: 26 * d, twist: 12 * d }),
      j("chest", { flexion: 12, abduction: 18 * d }),
      j("leftUpperLeg", { abduction: 11, flexion: 32 }),
      j("rightUpperLeg", { abduction: 11, flexion: 30 }),
      j("leftLowerLeg", { flexion: 60 }),
      j("rightLowerLeg", { flexion: 64 }),
    ]),
    root: root(0, -0.24, 0, 0),
  });
  // duck: drop straight down into a deep knee bend, waist folding over it
  const duck: () => IAutoMoviePose = (): IAutoMoviePose => ({
    ...merge([
      j("spine", { flexion: 28 }),
      j("chest", { flexion: 16 }),
      j("leftUpperLeg", { abduction: 11, flexion: 40 }),
      j("rightUpperLeg", { abduction: 11, flexion: 38 }),
      j("leftLowerLeg", { flexion: 78 }),
      j("rightLowerLeg", { flexion: 82 }),
    ]),
    root: root(0, -0.32, 0, 0),
  });

  // ── legs: chamber → strike pairs ─────────────────────────────────────────
  // rear (right) front push kick (teep)
  const chamberFront: IAutoMoviePose = merge([
    j("rightUpperLeg", { flexion: 42 }),
    j("rightLowerLeg", { flexion: 86 }),
    j("spine", { flexion: -4 }),
  ]);
  const teep: IAutoMoviePose = merge([
    j("rightUpperLeg", { flexion: 86 }),
    j("rightLowerLeg", { flexion: 10 }),
    j("leftLowerLeg", { flexion: 10 }),
    j("spine", { flexion: -16 }),
    j("leftUpperArm", { flexion: 28, abduction: 124 }),
  ]);
  // right knee strike: drive the knee up, crunch down, hands clinch
  const chamberKnee: IAutoMoviePose = merge([
    j("rightUpperLeg", { flexion: 64 }),
    j("rightLowerLeg", { flexion: 104 }),
    j("spine", { flexion: 6 }),
    j("leftUpperArm", { flexion: 28, abduction: 46 }),
    j("leftLowerArm", { flexion: 72 }),
    j("rightUpperArm", { flexion: 28, abduction: 46 }),
    j("rightLowerArm", { flexion: 72 }),
  ]);
  const kneeStrike: IAutoMoviePose = merge([
    j("rightUpperLeg", { flexion: 106 }),
    j("rightLowerLeg", { flexion: 128 }),
    j("spine", { flexion: 18 }),
    j("chest", { flexion: 12 }),
    j("leftUpperArm", { flexion: 26, abduction: 42 }),
    j("leftLowerArm", { flexion: 64 }),
    j("rightUpperArm", { flexion: 26, abduction: 42 }),
    j("rightLowerArm", { flexion: 64 }),
  ]);
  // right roundhouse high kick: chamber across, swing high to the side
  const chamberRound: IAutoMoviePose = merge([
    j("rightUpperLeg", { flexion: 36, abduction: 34 }),
    j("rightLowerLeg", { flexion: 78 }),
    j("spine", { twist: 14, flexion: 4 }),
  ]);
  const roundhouse: IAutoMoviePose = merge([
    j("rightUpperLeg", { flexion: 58, abduction: 46, twist: 34 }),
    j("rightLowerLeg", { flexion: 16 }),
    j("spine", { twist: 34, abduction: -12, flexion: 8 }),
    j("chest", { twist: 20 }),
    j("leftUpperArm", { flexion: 18, abduction: 134 }),
  ]);
  // lead (left) high axe/front kick, straight up high
  const chamberHigh: IAutoMoviePose = merge([
    j("leftUpperLeg", { flexion: 64 }),
    j("leftLowerLeg", { flexion: 70 }),
    j("spine", { flexion: -4 }),
  ]);
  const highKick: IAutoMoviePose = merge([
    j("leftUpperLeg", { flexion: 120 }),
    j("leftLowerLeg", { flexion: 8 }),
    j("rightLowerLeg", { flexion: 18 }),
    j("spine", { flexion: -8 }),
    j("rightUpperArm", { flexion: 22, abduction: 130 }),
  ]);

  // ── beat builders ────────────────────────────────────────────────────────
  const punch: (
    dur: number,
    p: IAutoMoviePose,
    hit?: number,
  ) => IAutoMovieMotion = (
    dur: number,
    p: IAutoMoviePose,
    hit: number = dur * 0.42,
  ): IAutoMovieMotion =>
    beat(dur, [
      [0, guard],
      [hit, p],
      [dur, guard],
    ]);
  const combo2: (
    dur: number,
    a: IAutoMoviePose,
    b: IAutoMoviePose,
  ) => IAutoMovieMotion = (
    dur: number,
    a: IAutoMoviePose,
    b: IAutoMoviePose,
  ): IAutoMovieMotion =>
    beat(dur, [
      [0, guard],
      [dur * 0.3, a],
      [dur * 0.6, b],
      [dur, guard],
    ]);
  const defend: (dur: number, p: IAutoMoviePose) => IAutoMovieMotion = (
    dur: number,
    p: IAutoMoviePose,
  ): IAutoMovieMotion =>
    beat(dur, [
      [0, guard],
      [dur * 0.5, p],
      [dur, guard],
    ]);
  const kick: (
    dur: number,
    chamber: IAutoMoviePose,
    strike: IAutoMoviePose,
  ) => IAutoMovieMotion = (
    dur: number,
    chamber: IAutoMoviePose,
    strike: IAutoMoviePose,
  ): IAutoMovieMotion =>
    beat(dur, [
      [0, guard],
      [dur * 0.28, chamber],
      [dur * 0.52, strike],
      [dur * 0.76, chamber],
      [dur, guard],
    ]);
  // a strike thrown while stepping in, then footing back to centre
  const stepStrike: (
    dur: number,
    p: IAutoMoviePose,
    x: number,
    z: number,
  ) => IAutoMovieMotion = (
    dur: number,
    p: IAutoMoviePose,
    x: number,
    z: number,
  ): IAutoMovieMotion =>
    beat(dur, [
      [0, guard],
      [dur * 0.45, at(p, x, z)],
      [dur, guard],
    ]);
  // light footwork: shift the stance out and back
  const stepStep: (dur: number, x: number, z: number) => IAutoMovieMotion = (
    dur: number,
    x: number,
    z: number,
  ): IAutoMovieMotion =>
    beat(dur, [
      [0, guard],
      [dur * 0.5, at(guard, x, z)],
      [dur, guard],
    ]);

  return sequenceMotion(
    "shadowbox",
    [
      beat(0.6, [
        [0, guard],
        [0.6, guard],
      ]), // settle
      // round 1, find the range behind the jab + footwork
      punch(0.34, jab),
      punch(0.34, jab),
      combo2(0.62, jab, cross),
      defend(0.44, slip(-1)),
      defend(0.44, slip(1)),
      stepStrike(0.42, jab, 0, 0.16),
      stepStep(0.34, 0, -0.16),
      punch(0.42, cross),
      // round 2, hooks, uppercuts, weaving
      punch(0.3, jab),
      punch(0.42, leadHook),
      punch(0.42, rearHook),
      defend(0.5, weave(-1)),
      defend(0.5, weave(1)),
      punch(0.42, leadUpper),
      punch(0.42, rearUpper),
      defend(0.5, duck()),
      combo2(0.62, cross, leadHook),
      // round 3, fast footwork flurry
      stepStep(0.3, 0.16, 0),
      punch(0.28, jab),
      punch(0.28, jab),
      combo2(0.66, cross, leadHook),
      punch(0.42, rearUpper),
      stepStep(0.34, -0.16, 0),
      defend(0.42, slip(-1)),
      defend(0.5, weave(1)),
      // round 4, kicks
      kick(1.0, chamberFront, teep),
      kick(1.2, chamberFront, teep),
      kick(0.85, chamberKnee, kneeStrike),
      kick(0.85, chamberKnee, kneeStrike),
      kick(1.4, chamberRound, roundhouse),
      // round 5, boxing combination + defence
      punch(0.3, jab),
      combo2(0.7, cross, leadHook),
      punch(0.42, rearHook),
      defend(0.5, weave(-1)),
      punch(0.42, leadUpper),
      punch(0.42, cross),
      defend(0.5, duck()),
      stepStrike(0.42, jab, 0, 0.16),
      stepStep(0.34, 0, -0.16),
      // round 6, knees + high kicks
      kick(0.8, chamberKnee, kneeStrike),
      kick(0.95, chamberFront, teep),
      kick(1.4, chamberRound, roundhouse),
      kick(1.3, chamberHigh, highKick),
      kick(1.2, chamberFront, teep),
      // round 7, finishing flurry
      punch(0.28, jab),
      punch(0.28, jab),
      punch(0.4, cross),
      punch(0.42, leadHook),
      punch(0.42, rearHook),
      kick(1.4, chamberRound, roundhouse), // finish
      beat(0.8, [
        [0, guard],
        [0.8, guard],
      ]), // reset
    ],
    true,
  );
};
