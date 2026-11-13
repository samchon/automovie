import type { AutoMovieHumanoidBone } from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { gestureSignal } from "./gestureSignal";
import type { gestureStroke } from "./gestureStroke";

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
 * @evidence contracts/development/design.md#minimal-and-owned-surface The angle table and the one function the gesture law and the hand strokes read.
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One exhaustive switch; hand gestures and the bow return no angles, since their movement is owned by the hand strokes and the gesture law.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The amplitudes are documented provisional values; no body is special-cased.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new record and retains nothing.
   */
  export function at(
    kind: gestureStroke.Kind,
    u: number,
    cycles: number,
    envelope: number,
    extent: number,
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    const a: number = envelope * extent;
    switch (kind) {
      case "nod":
        return {
          head: [
            ANGLES.nod * a * (0.5 - 0.5 * Math.cos(2 * Math.PI * cycles * u)),
            0,
            0,
          ],
        };
      case "shakeHead":
        return {
          head: [0, 0, ANGLES.shake * a * gestureSignal.oscillation(u, cycles)],
        };
      case "shrug":
        return {
          leftShoulder: [0, ANGLES.shrug * a, 0],
          rightShoulder: [0, ANGLES.shrug * a, 0],
          head: [0, ANGLES.shrugHead * a, 0],
        };
      case "chinLift":
        return { head: [ANGLES.chinLift * a, 0, 0] };
      case "squareShoulders":
        return {
          leftShoulder: [ANGLES.square * a, 0, 0],
          rightShoulder: [ANGLES.square * a, 0, 0],
          chest: [ANGLES.squareChest * a, 0, 0],
        };
      case "slump":
        return {
          chest: [ANGLES.slumpChest * a, 0, 0],
          spine: [ANGLES.slumpSpine * a, 0, 0],
          head: [ANGLES.slumpHead * a, 0, 0],
          leftShoulder: [ANGLES.slumpGirdle * a, 0, 0],
          rightShoulder: [ANGLES.slumpGirdle * a, 0, 0],
        };
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
      case "touchFace":
      case "pushGlasses":
      case "scratchHead":
      case "bow":
        return {};
    }
  }
}
