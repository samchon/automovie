import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanGestureStroke,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../../compose/internal/AutoMovieMotionHumanRange";
import { gestureSignal } from "./gestureSignal";

/**
 * The joints a gesture moves directly.
 *
 * Gestures of the head, shoulders and trunk are joint angles because no body
 * point is brought anywhere; the movement is the segment's own rotation: `nod`
 * flexes the head lightly (11.25 degrees) and back twice a second (head nods in
 * conversation are small and quick, Hadar et al. 1985, J Nonverbal Behav 9:214;
 * values provisional), `shakeHead` turns it lightly (17.5 degrees) either way
 * about 2.2 cycles a second (provisional), `shrug` raises both shoulder girdles
 * 18 degrees (provisional, inside the 30 degree elevation range), `chinLift`
 * extends the head 15 degrees, `squareShoulders` retracts the girdles about 10
 * and extends the chest 4, `slump` flexes the chest 12, the spine 6, the head
 * about 10 and protracts the girdles about 10 (display postures, provisional).
 * `ANGLES` states each as a level of the joint's range. `bow` is the trunk's
 * pitch, handled by the gesture law.
 */
export namespace gestureJoints {
  /**
   * The size of each joint gesture at full extent, signed clinical degrees: a
   * level of the joint's range, scaled where the provisional size the namespace
   * doc states lies between two levels (provisional, read from no measured
   * source except the nod's; `everydayGestureVerdicts` checks each gesture
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
   * @param joints The mutable output joint record already copied by the
   *   gesture.
   * @param kind The current admitted gesture kind.
   * @param u Stroke share in [0,1].
   * @param cycles Stroke cycles.
   * @param envelope Transport share in [0,1].
   * @param extent Effort extent multiplier.
   */
  export function add(
    joints: Angles,
    kind: IAutoMovieMotionHumanGestureStroke.Kind,
    u: number,
    cycles: number,
    envelope: number,
    extent: number,
  ): void {
    pattern(kind, u, cycles, envelope, extent, joints, true);
  }
}

/** The posture's clinical-degree joint record. */
type Angles = IAutoMovieMotionHumanPosture["joints"];

/**
 * Evaluate a joint gesture at a share, writing its deltas into the record, or
 * adding them to it.
 */
function pattern(
  kind: IAutoMovieMotionHumanGestureStroke.Kind,
  u: number,
  cycles: number,
  envelope: number,
  extent: number,
  joints: Angles,
  additive: boolean,
): Angles {
  const a: number = envelope * extent;
  switch (kind) {
    case "nod":
      write(
        joints,
        additive,
        "head",
        gestureJoints.ANGLES.nod *
          a *
          (0.5 - 0.5 * Math.cos(2 * Math.PI * cycles * u)),
        0,
        0,
      );
      return joints;
    case "shakeHead":
      write(
        joints,
        additive,
        "head",
        0,
        0,
        gestureJoints.ANGLES.shake * a * gestureSignal.oscillation(u, cycles),
      );
      return joints;
    case "shrug":
      write(
        joints,
        additive,
        "leftShoulder",
        0,
        gestureJoints.ANGLES.shrug * a,
        0,
      );
      write(
        joints,
        additive,
        "rightShoulder",
        0,
        gestureJoints.ANGLES.shrug * a,
        0,
      );
      write(joints, additive, "head", 0, gestureJoints.ANGLES.shrugHead * a, 0);
      return joints;
    case "chinLift":
      write(joints, additive, "head", gestureJoints.ANGLES.chinLift * a, 0, 0);
      return joints;
    case "squareShoulders":
      write(
        joints,
        additive,
        "leftShoulder",
        gestureJoints.ANGLES.square * a,
        0,
        0,
      );
      write(
        joints,
        additive,
        "rightShoulder",
        gestureJoints.ANGLES.square * a,
        0,
        0,
      );
      write(
        joints,
        additive,
        "chest",
        gestureJoints.ANGLES.squareChest * a,
        0,
        0,
      );
      return joints;
    case "slump":
      write(
        joints,
        additive,
        "chest",
        gestureJoints.ANGLES.slumpChest * a,
        0,
        0,
      );
      write(
        joints,
        additive,
        "spine",
        gestureJoints.ANGLES.slumpSpine * a,
        0,
        0,
      );
      write(joints, additive, "head", gestureJoints.ANGLES.slumpHead * a, 0, 0);
      write(
        joints,
        additive,
        "leftShoulder",
        gestureJoints.ANGLES.slumpGirdle * a,
        0,
        0,
      );
      write(
        joints,
        additive,
        "rightShoulder",
        gestureJoints.ANGLES.slumpGirdle * a,
        0,
        0,
      );
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

/** Write one bone's delta, or add it to the bone's angles. */
function write(
  joints: Angles,
  additive: boolean,
  bone: AutoMovieHumanoidBone,
  flexion: number,
  abduction: number,
  twist: number,
): void {
  if (additive) {
    const was: readonly [number, number, number] = joints[bone] ?? ZERO;
    joints[bone] = [was[0] + flexion, was[1] + abduction, was[2] + twist];
  } else joints[bone] = [flexion, abduction, twist];
}

/** The angles of a bone the record holds none for. */
const ZERO: readonly [number, number, number] = [0, 0, 0];
