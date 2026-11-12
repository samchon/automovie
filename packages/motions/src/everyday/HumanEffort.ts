import { HumanBound } from "../law/HumanBound";

/**
 * Laban Effort as numbers: the four motion factors a mood or a character's
 * manner sets, turned into the multipliers everyday laws read for their
 * tempo, extent, steps, arm swing, elbow width and path curvature.
 *
 * Laban Movement Analysis describes the quality of a movement by four Effort
 * factors, each between two poles: Weight (light to strong), Time
 * (sustained to sudden), Space (indirect to direct) and Flow (free to bound).
 * EMOTE (Chi, Costa, Zhao and Badler 2000, SIGGRAPH) showed that these
 * factors can be applied to any keyed or procedural motion as changes of
 * timing, path curvature and limb volume; Zhao and Badler (2005, Graphical
 * Models 67:1) related them to measured kinematics. The mapping here keeps
 * EMOTE's directions:
 *
 * - Time sets the tempo: sudden movements are shorter, sustained ones longer
 *   (duration factor `1 - 0.3 time`).
 * - Flow sets the extent and the body's volume: bound movement is held in,
 *   with shorter steps, less arm swing and the elbows near the body; free
 *   movement is released outward (extent `1 - 0.15 flow`, step length
 *   `1 - 0.15 flow`, arm swing `1 - 0.4 flow`, elbow width `-0.15 flow`
 *   upper-arm lengths). Malfoy's embarrassed walk, bound flow with shorter
 *   steps and the elbows in, is this pole.
 * - Weight sets the force: strong movement reaches farther and swings the
 *   arms more, light movement less (extent `+0.1 weight`, arm swing
 *   `+0.2 weight`).
 * - Space sets the path: indirect movement curves, lateral deviation
 *   `0.15 max(0, -space)` of the path length; direct movement goes straight.
 *
 * The coefficients are provisional: EMOTE's own parameter values were set by
 * a Laban analyst rather than measured, and no study located gives
 * population values. Each factor changes its quantities monotonically, and
 * a neutral Effort (all zero) leaves every law unchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law, its sources, its units and frames, and which values are provisional.
 * @evidence contracts/development/design.md#principled-representation Pure functions and constants over the interface's vectors and the engine's streams.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The functions and constants the everyday laws and their tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses engine and interface types; no consumer is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Closed-form evaluation of the cited law.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One small function per quantity.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Out-of-range inputs throw; provisional constants are named and marked.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call, or linear in the requests a call builds.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pure functions of their inputs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace HumanEffort {
  /** The four factors, each in [-1, 1]; absent is 0. */
  export interface IEffort {
    /** -1 light to 1 strong. */
    weight?: number;

    /** -1 sustained to 1 sudden. */
    time?: number;

    /** -1 indirect to 1 direct. */
    space?: number;

    /** -1 free to 1 bound. */
    flow?: number;
  }

  /** What a law reads. */
  export interface IModifiers {
    /** Duration multiplier. */
    tempo: number;

    /** Movement extent multiplier (gesture amplitude, reach of a stroke). */
    extent: number;

    /** Step length multiplier. */
    step: number;

    /** Arm swing multiplier. */
    swing: number;

    /** Extra outward elbow offset, upper-arm lengths; negative draws the elbows in. */
    elbow: number;

    /** Lateral path deviation, a share of the path length. */
    curvature: number;
  }

  /** Named moods as Effort settings: Laban's eight basic Effort actions use Weight, Time and Space; a mood adds Flow. */
  export const ACTIONS: Readonly<
    Record<
      | "punch"
      | "dab"
      | "press"
      | "glide"
      | "slash"
      | "flick"
      | "wring"
      | "float",
      IEffort
    >
  > = {
    punch: { weight: 1, time: 1, space: 1 },
    dab: { weight: -1, time: 1, space: 1 },
    press: { weight: 1, time: -1, space: 1 },
    glide: { weight: -1, time: -1, space: 1 },
    slash: { weight: 1, time: 1, space: -1 },
    flick: { weight: -1, time: 1, space: -1 },
    wring: { weight: 1, time: -1, space: -1 },
    float: { weight: -1, time: -1, space: -1 },
  };

  /**
   * The modifiers of an Effort.
   *
   * @param effort The factors; absent ones are neutral.
   * @returns The modifiers.
   * @throws {HumanRefusal} When a factor lies outside [-1, 1].
   */
  export function modifiers(effort: IEffort = {}): IModifiers {
    const f = (value: number | undefined, name: string): number => {
      const v: number = value ?? 0;
      return HumanBound.within(`effort.${name}`, v, -1, 1);
    };
    const weight: number = f(effort.weight, "weight");
    const time: number = f(effort.time, "time");
    const space: number = f(effort.space, "space");
    const flow: number = f(effort.flow, "flow");
    return {
      tempo: 1 - 0.3 * time,
      extent: (1 - 0.15 * flow) * (1 + 0.1 * weight),
      step: 1 - 0.15 * flow,
      swing: (1 - 0.4 * flow) * (1 + 0.2 * weight),
      elbow: -0.15 * flow,
      curvature: 0.15 * Math.max(0, -space),
    };
  }
}
