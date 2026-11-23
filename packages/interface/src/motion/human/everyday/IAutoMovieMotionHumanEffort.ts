/**
 * Laban Effort as numbers: the four motion factors a mood or a character's
 * manner sets, turned into the multipliers everyday laws read for their tempo,
 * extent, steps, arm swing, elbow width and path curvature.
 *
 * Laban Movement Analysis describes the quality of a movement by four Effort
 * factors, each between two poles: Weight (light to strong), Time (sustained to
 * sudden), Space (indirect to direct) and Flow (free to bound). EMOTE (Chi,
 * Costa, Zhao and Badler 2000, SIGGRAPH) showed that these factors can be
 * applied to any keyed or procedural motion as changes of timing, path
 * curvature and limb volume; Zhao and Badler (2005, Graphical Models 67:1)
 * related them to measured kinematics. The mapping here keeps EMOTE's
 * directions:
 *
 * - Time sets the tempo: sudden movements are shorter, sustained ones longer
 *   (duration factor `1 - 0.3 time`).
 * - Flow sets the extent and the body's volume: bound movement is held in, with
 *   shorter steps, less arm swing and the elbows near the body; free movement
 *   is released outward (extent `1 - 0.15 flow`, step length `1 - 0.15 flow`,
 *   arm swing `1 - 0.4 flow`, elbow width `-0.15 flow` upper-arm lengths).
 *   Malfoy's embarrassed walk, bound flow with shorter steps and the elbows in,
 *   is this pole.
 * - Weight sets the force: strong movement reaches farther and swings the arms
 *   more, light movement less (extent `+0.1 weight`, arm swing `+0.2 weight`).
 * - Space sets the path: indirect movement curves, lateral deviation `0.15 max(0,
 *   -space)` of the path length; direct movement goes straight.
 *
 * The coefficients are provisional: EMOTE's own parameter values were set by a
 * Laban analyst rather than measured, and no study located gives population
 * values. Each factor changes its quantities monotonically, and a neutral
 * Effort (all zero) leaves every law unchanged.
 */
export namespace IAutoMovieMotionHumanEffort {
  /**
   * Laban's eight basic Effort action names. HumanEffort.ACTIONS supplies the
   * corresponding weight, time and space factors; AutoMovieMotionManner accepts
   * these keys alongside its mood presets. Flow is neutral for these actions.
   */
  export type Action =
    | "punch"
    | "dab"
    | "press"
    | "glide"
    | "slash"
    | "flick"
    | "wring"
    | "float";
  /** The four factors, each in [-1, 1]; absent is 0. */
  export interface IEffort {
    /**
     * -1 light to 1 strong. Strong reaches farther and swings the arms more:
     * extent `1 + 0.1 weight`, arm swing `1 + 0.2 weight`
     * (`HumanEffort.modifiers`, provisional).
     */
    weight?: number;

    /**
     * -1 sustained to 1 sudden. Sudden is shorter: every duration `1 - 0.3
     * time` (0.7 at 1, 1.3 at -1), provisional.
     */
    time?: number;

    /**
     * -1 indirect to 1 direct. Indirect curves the hand's path sideways by
     * `0.15 max(0, -space)` of its length; direct is straight, provisional.
     */
    space?: number;

    /**
     * -1 free to 1 bound. Bound holds in: extent and step `1 - 0.15 flow`, arm
     * swing `1 - 0.4 flow`, elbows `0.15 flow` upper-arm lengths nearer the
     * body, holds `1 + 0.3 flow` longer; free releases them outward,
     * provisional.
     */
    flow?: number;
  }

  /** The modifiers of an Effort. What a law reads. */
  export interface IModifiers {
    /** Duration multiplier. */
    tempo: number;

    /** Movement extent multiplier (gesture amplitude, reach of a stroke). */
    extent: number;

    /** Step length multiplier. */
    step: number;

    /** Arm swing multiplier. */
    swing: number;

    /**
     * Extra outward elbow offset, upper-arm lengths; negative draws the elbows
     * in.
     */
    elbow: number;

    /** Lateral path deviation, a share of the path length. */
    curvature: number;
  }
}
