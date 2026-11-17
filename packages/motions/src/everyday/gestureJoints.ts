import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanGestureStroke,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { gestureSignal } from "./gestureSignal";

/**
 * The joints a gesture moves directly.
 *
 * Gestures of the head, shoulders and trunk are joint angles because no body
 * point is brought anywhere; the movement is the segment's own rotation:
 * `nod` flexes the head lightly (11.25 degrees) and back twice a second (head
 * nods in conversation are small and quick, Hadar et al. 1985, J Nonverbal
 * Behav 9:214; values provisional), `shakeHead` turns it lightly (17.5
 * degrees) either way about 2.2 cycles a second (provisional), `shrug`
 * raises both shoulder girdles 18 degrees (provisional, inside the 30 degree
 * elevation range), `chinLift` extends the head 15 degrees,
 * `squareShoulders` retracts the girdles about 10 and extends the chest 4,
 * `slump` flexes the chest 12, the spine 6, the head about 10 and protracts
 * the girdles about 10 (display postures, provisional). `ANGLES` states each
 * as a level of the joint's range. `bow` is the trunk's pitch, handled by
 * the gesture law.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each joint gesture's angles, sources and provisional values, and where `bow` is handled.
 * @evidence contracts/development/design.md#principled-representation Signed clinical degrees as levels of each joint's range, added to the posture per bone.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The angle table, cold delta reader and direct additive writer serve the gesture law and existing stroke/tests through one scalar pattern owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the range vocabulary and the gesture's kind union; no consumer is special-cased.
 */
export namespace gestureJoints {
  /**
   * The size of each joint gesture at full extent, signed clinical degrees:
   * a level of the joint's range, scaled where the shipped size lay between
   * two levels (provisional; `everydayGestureVerdicts` checks each gesture
   * happens).
   */
  export const ANGLES = {
    /** The head's flexion in a nod. */
    nod: AutoMovieMotionHumanRange.degrees("head", "flexion", "light"),

    /** The head's turn either way in a shake. */
    shake: AutoMovieMotionHumanRange.degrees("head", "external", "light"),

    /** The girdles' rise in a shrug. */
    shrug: AutoMovieMotionHumanRange.degrees("leftShoulder", "abduction", {
      level: "half",
      scale: 1.2,
    }),

    /** The head's tilt in a shrug. */
    shrugHead: AutoMovieMotionHumanRange.degrees("head", "abduction", "slight"),

    /** The head's extension in a chin lift. */
    chinLift: AutoMovieMotionHumanRange.degrees("head", "extension", {
      level: "light",
      scale: 1.2,
    }),

    /** The girdles' retraction in squared shoulders. */
    square: AutoMovieMotionHumanRange.degrees("leftShoulder", "extension", {
      level: "deep",
      scale: 0.9,
    }),

    /** The chest's extension in squared shoulders. */
    squareChest: AutoMovieMotionHumanRange.degrees("chest", "extension", {
      level: "light",
      scale: 0.8,
    }),

    /** The chest's flexion in a slump. */
    slumpChest: AutoMovieMotionHumanRange.degrees("chest", "flexion", {
      level: "light",
      scale: 1.2,
    }),

    /** The spine's flexion in a slump. */
    slumpSpine: AutoMovieMotionHumanRange.degrees("spine", "flexion", {
      level: "slight",
      scale: 0.75,
    }),

    /** The head's flexion in a slump. */
    slumpHead: AutoMovieMotionHumanRange.degrees("head", "flexion", {
      level: "light",
      scale: 0.9,
    }),

    /** The girdles' protraction in a slump. */
    slumpGirdle: AutoMovieMotionHumanRange.degrees("leftShoulder", "flexion", {
      level: "light",
      scale: 1.3,
    }),

    /** The fingers' curl in a beckon. */
    beckon: AutoMovieMotionHumanRange.degrees(
      "leftIndexProximal",
      "flexion",
      "deep",
    ),
  } as const;

  /**
   * The joints a gesture sets directly at a share of the stroke, given its
   * envelope (0 at rest, 1 in the stroke).
   *
   * @param kind The gesture.
   * @param u Stroke share in [0, 1].
   * @param cycles Stroke cycles.
   * @param envelope How far into the gesture the body is, in [0, 1].
   * @param extent Effort extent multiplier.
   * @returns Clinical degrees to add.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result's unit (clinical degrees added to the posture) and each argument's range; the namespace doc gives each gesture's angles and sources.
   * @evidence contracts/development/implementation.md#principled-implementation Joint angles because these gestures bring no body point anywhere: the movement is the segment's own rotation (head nods after Hadar et al. 1985, shrug inside the 30 degree elevation range); each amplitude scales by the envelope times the Effort extent, with nods and shakes on the stroke's cycles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared exhaustive scalar pattern writes this reader's fresh delta map; hand gestures and bow return no angles because hand strokes/the gesture law own them.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The amplitudes are documented provisional values; no body is special-cased.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the original scalar pattern with add, whose actual gesture consumer omits discarded delta maps/triples; this cold reader retains direct delta values and fresh map ownership.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new record and retains nothing.
   */
  export function at(
    kind: IAutoMovieMotionHumanGestureStroke.Kind,
    u: number,
    cycles: number,
    envelope: number,
    extent: number,
  ): Angles {
    return pattern(kind, u, cycles, envelope, extent, {}, false);
  }

  /**
   * Add the same gesture deltas directly into one caller-owned joint record.
   *
   * @param joints The mutable output joint record already copied by the gesture.
   * @param kind The current admitted gesture kind.
   * @param u Stroke share in [0,1].
   * @param cycles Stroke cycles.
   * @param envelope Transport share in [0,1].
   * @param extent Effort extent multiplier.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines owned output mutation, clinical-degree addition, current kind/phase/cycle/share inputs, unchanged untouched joints and fresh written triples.
   * @evidence contracts/development/implementation.md#principled-implementation Uses at's same scalar gesture pattern and bone order, then adds each clinical component to its existing authored value or zero, exactly as the gesture's former ordered delta-map addition.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Both public reads delegate one pattern owner; raw at writes its new delta map while this additive writer writes directly into the supplied owned map.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps all existing amplitudes, oscillation/rhythm formulas, multiplication groups and bone order. The cold at path writes direct values without an extra zero addition, preserving signed-zero values; no goal, limit or shape is substituted.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed one-to-five-bone work writes fresh final triples without an intermediate delta map, delta triples or Object.entries pairs. One shared scalar writer serves every actual query without allocating a per-query callback; no speedup is measured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared pattern owns the exact same at/add scalars; every current phase, envelope and extent remains evaluated normally without reusing a prior time or angle answer.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no output record, input posture, scalar answer, callback, body or history; the caller owns the updated map and fresh written triples.
   */
  export function add(joints: Angles, kind: IAutoMovieMotionHumanGestureStroke.Kind, u: number,
    cycles: number, envelope: number, extent: number): void {
    pattern(kind, u, cycles, envelope, extent, joints, true);
  }
}

/** The existing clinical-degree joint record; no second pose is represented. */
type Angles = IAutoMovieMotionHumanPosture["joints"];

/** Evaluate every original gesture scalar once, writing deltas or their ordered sum. */
function pattern(kind: IAutoMovieMotionHumanGestureStroke.Kind, u: number, cycles: number, envelope: number,
  extent: number, joints: Angles, additive: boolean): Angles {
  const a: number = envelope * extent;
  switch (kind) {
    case "nod":
      write(joints, additive, "head", gestureJoints.ANGLES.nod * a * (0.5 - 0.5 * Math.cos(2 * Math.PI * cycles * u)), 0, 0);
      return joints;
    case "shakeHead":
      write(joints, additive, "head", 0, 0, gestureJoints.ANGLES.shake * a * gestureSignal.oscillation(u, cycles));
      return joints;
    case "shrug":
      write(joints, additive, "leftShoulder", 0, gestureJoints.ANGLES.shrug * a, 0);
      write(joints, additive, "rightShoulder", 0, gestureJoints.ANGLES.shrug * a, 0);
      write(joints, additive, "head", 0, gestureJoints.ANGLES.shrugHead * a, 0);
      return joints;
    case "chinLift":
      write(joints, additive, "head", gestureJoints.ANGLES.chinLift * a, 0, 0);
      return joints;
    case "squareShoulders":
      write(joints, additive, "leftShoulder", gestureJoints.ANGLES.square * a, 0, 0);
      write(joints, additive, "rightShoulder", gestureJoints.ANGLES.square * a, 0, 0);
      write(joints, additive, "chest", gestureJoints.ANGLES.squareChest * a, 0, 0);
      return joints;
    case "slump":
      write(joints, additive, "chest", gestureJoints.ANGLES.slumpChest * a, 0, 0);
      write(joints, additive, "spine", gestureJoints.ANGLES.slumpSpine * a, 0, 0);
      write(joints, additive, "head", gestureJoints.ANGLES.slumpHead * a, 0, 0);
      write(joints, additive, "leftShoulder", gestureJoints.ANGLES.slumpGirdle * a, 0, 0);
      write(joints, additive, "rightShoulder", gestureJoints.ANGLES.slumpGirdle * a, 0, 0);
      return joints;
    case "wave":
    case "raiseHand":
    case "cheer":
    case "stopPalm":
    case "point":
    case "palmsUp":
    case "beckon":
    case "clap":
    case "rubHands":
    case "palmsTogether":
    case "thumbsDown":
    case "touchFace":
    case "pushGlasses":
    case "scratchHead":
    case "bow":
      return joints;
  }
}

/** Write the original ordered delta or addition without a per-query closure. */
function write(joints: Angles, additive: boolean, bone: AutoMovieHumanoidBone,
  flexion: number, abduction: number, twist: number): void {
  if (additive) {
    const was: readonly [number, number, number] = joints[bone] ?? ZERO;
    joints[bone] = [was[0] + flexion, was[1] + abduction, was[2] + twist];
  } else joints[bone] = [flexion, abduction, twist];
}

/** Borrowed additive identity; every written clinical triple remains fresh. */
const ZERO: readonly [number, number, number] = [0, 0, 0];