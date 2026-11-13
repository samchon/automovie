import type { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import type { gestureStroke } from "./gestureStroke";

/**
 * The tables every gesture is read from by its kind: its timing and which
 * hands it moves, total records over `gestureStroke.Kind`, split from the
 * stroke so each file holds one responsibility.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the tables hold and over what they are total.
 * @evidence contracts/development/design.md#principled-representation Records keyed by the closed kind union, so a new kind without a timing or a hand count fails to compile.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two tables, read by the gesture law, the capture cases and the breath and gaze test.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Variation enters as rows keyed by the kind, not as members per gesture.
 */
export namespace gestureStrokeTables {
  /**
   * A gesture's timing: cycles in the stroke and the time of one cycle, a
   * named pause or a pause scaled (the seconds each resolves to are the ones
   * the gestures shipped with; the clap's three beats a second is no scaled
   * pause and stays explicit).
   */
  export const RHYTHM: Readonly<
    Record<
      gestureStroke.Kind,
      { cycles: number; period: AutoMovieMotionHumanTiming.Span }
    >
  > = {
    wave: { cycles: 3, period: "beat" },
    raiseHand: { cycles: 1, period: { pause: "beat", scale: 1.25 } },
    cheer: { cycles: 2, period: { pause: "beat", scale: 1.25 } },
    stopPalm: { cycles: 1, period: { pause: "beat", scale: 0.875 } },
    point: { cycles: 1, period: { pause: "beat", scale: 1.25 } },
    palmsUp: { cycles: 1, period: { pause: "beat", scale: 1.5 } },
    beckon: { cycles: 2, period: { pause: "beat", scale: 1.5 } },
    clap: {
      cycles: 4,
      period: { seconds: 1 / 3, source: "provisional: everyday-gesture-clap" },
    },
    rubHands: { cycles: 3, period: { pause: "beat", scale: 0.875 } },
    palmsTogether: { cycles: 1, period: "long" },
    thumbsDown: { cycles: 1, period: "long" },
    touchFace: { cycles: 1, period: "long" },
    pushGlasses: { cycles: 1, period: { pause: "beat", scale: 0.75 } },
    scratchHead: { cycles: 4, period: { pause: "beat", scale: 0.625 } },
    shrug: { cycles: 1, period: { pause: "long", scale: 0.875 } },
    nod: { cycles: 2, period: { pause: "beat", scale: 1.25 } },
    shakeHead: { cycles: 3, period: { pause: "beat", scale: 1.125 } },
    bow: { cycles: 1, period: { pause: "beat", scale: 1.5 } },
    chinLift: { cycles: 1, period: "long" },
    squareShoulders: { cycles: 1, period: "long" },
    slump: { cycles: 1, period: "long" },
  };

  /** Which hands each gesture moves: `one` the chosen side, `both`, or `none`. */
  export const HANDS: Readonly<
    Record<gestureStroke.Kind, "one" | "both" | "none">
  > = {
    wave: "one",
    raiseHand: "one",
    cheer: "both",
    stopPalm: "one",
    point: "one",
    palmsUp: "both",
    beckon: "one",
    clap: "both",
    rubHands: "both",
    palmsTogether: "both",
    thumbsDown: "one",
    touchFace: "one",
    pushGlasses: "one",
    scratchHead: "one",
    shrug: "both",
    nod: "none",
    shakeHead: "none",
    bow: "none",
    chinLift: "none",
    squareShoulders: "none",
    slump: "none",
  };
}
