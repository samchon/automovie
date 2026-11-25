import type {
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieMotionHumanTouchEffectors,
} from "@automovie/interface";

/**
 * The parts of the hand a touch lays on its region (`touch.With`) and each
 * one's effector (`touch.EFFECTORS`).
 */
export namespace touchEffectors {
  /** Each part's effector. */
  export const TABLE: Readonly<
    Record<
      IAutoMovieMotionHumanTouchEffectors.With,
      IAutoMovieMotionHumanTouchEffector.IEffector
    >
  > = {
    palm: { surface: "palm", shape: "flat" },
    fingertips: { surface: "indexTip", shape: "flat" },

    // The end of the forefinger of a flat hand that continues its forearm,
    // the palm turned down: a salute's hand at the brow.
    forefinger: {
      surface: "indexTip",
      shape: "flat",
      facing: "fingers",
      along: "-palm",
    },
    handBack: { surface: "handBack", shape: "relaxed" },
    fist: { surface: "fist", shape: "fist" },

    // The little finger's edge of a flat hand, as a chop meets a surface, and
    // the heel of the palm above the wrist, as a push meets it (first pass:
    // the offsets are shares of the hand's length from the palm's centre,
    // provisional; the body's other surfaces, forearm, elbow, knee and the
    // rest of set, are not hand effectors and are not staged here).
    handEdge: {
      surface: "palm",
      shape: "flat",
      tool: { thumb: -0.25 },
      facing: "-thumb",
      along: "fingers",
    },
    heel: { surface: "palm", shape: "flat", tool: { fingers: -0.3 } },
  };
}
