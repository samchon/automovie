import type {
  IAutoMovieMotionHumanGestureStroke,
  IAutoMovieMotionHumanTiming,
} from "@automovie/interface";

/*
 * The tables every gesture is read from by its kind: its timing and which hands
 * it moves, total records over `gestureStroke.Kind`, split from the stroke so
 * each file holds one responsibility.
 */
export namespace gestureStrokeTables {
  /*
   * A gesture's timing: cycles in the stroke and the time of one cycle, a named
   * pause or a pause scaled (provisional, read from no measured source except
   * the rates `gestureStroke` and `gestureJoints` cite; the clap's four beats a
   * second, free applause's rate, is no scaled pause and stays explicit, and so
   * is the bow's hold at its deepest, Kawabata et al.'s).
   */
  export const RHYTHM: Readonly<
    Record<IAutoMovieMotionHumanGestureStroke.Kind, IRHYTHMEntryItem>
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
      period: {
        seconds: 1 / 4,
        source:
          "Neda et al. 2000, Nature 403:849, Fig. 1: free applause near 4 Hz",
      },
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
    bow: {
      cycles: 1,
      period: {
        seconds: 0.95,
        source:
          "Kawabata et al. 2009, ISBS 27, Table 2: the standing bow held 0.95 +- 0.35 s at its deepest",
      },
    },
    chinLift: { cycles: 1, period: "long" },
    squareShoulders: { cycles: 1, period: "long" },
    slump: { cycles: 1, period: "long" },
  };

  /*
   * Which hands each gesture moves: `one` the chosen side, `both`, or `none`.
   */
  export const HANDS: Readonly<
    Record<IAutoMovieMotionHumanGestureStroke.Kind, HANDSEntryItem>
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

/*
 * The alternatives of `HANDSEntryItem`'s site.
 */
type HANDSEntryItem = "one" | "both" | "none";

/*
 * The record of `IRHYTHMEntryItem`'s site.
 */
type IRHYTHMEntryItem = {
  cycles: number;
  period: IAutoMovieMotionHumanTiming.Span;
};
