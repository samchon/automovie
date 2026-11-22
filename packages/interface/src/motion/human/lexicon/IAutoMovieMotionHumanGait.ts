import type { IAutoMovieMotionHumanWalkParams } from "../actions/IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieMotionHumanDrillRegulation } from "./IAutoMovieMotionHumanDrillRegulation";

/**
 * The parameters of the styled gaits: named ways of going somewhere on foot,
 * whose destination the composition gives. The speed model and the walk
 * presets (`stroll`, `hurry`, `trudge`, `swagger`) are on the Gait family
 * (`IAutoMovieMotionHumanNext.IAutoMovieMotionHumanGait`).
 *
 * A styled gait has a speed no pace has. It runs the walk's stepping plan in
 * a gait of its own, as the run does, and counts as a walk wherever actions
 * are told apart by kind:
 *
 * - `march` keeps the drill regulation's cadence and step, 120 steps a
 *   minute and 30 inches (0.762 m) in quick time, the same step for every
 *   marcher (US Army TC 3-21.5). The cadence governs: the way is covered in
 *   the whole number of steps nearest it in drill steps, so over a way that
 *   is not a whole number of them the step gives and the cadence stays.
 * - `doubleTime` keeps 180 steps a minute on the same step, which is a
 *   jog's speed, so it is run in the jog's gait with the count kept.
 * - `prowl` is the sneak on deeply bent knees; `sad` and `proud` carry a
 *   mood in speed, arm swing and trunk; `limp` spares one leg, standing on
 *   it briefly; `drunk` is slow, unsteady in time and wanders off its line.
 *   All provisional, each constant saying what was read and what was not.
 * - `sneak` goes slower than the slow walk on shorter steps, with the
 *   pelvis lowered and the arms held close (provisional values; no study of
 *   stealthy gait has been read).
 *
 * @evidence contracts/development/common.md#meaningful-documentation regulation: The drill regulation (`HUMAN_DRILL_CADENCES`); TC 3-21.5's quick time (`MARCH`) when absent. time: The regulation's time by its own name (`ordinary`, `quick`...); its first time when absent. side: The leg spared; the right when absent.
 * @evidence contracts/development/design.md#principled-representation regulation: The drill regulation (`HUMAN_DRILL_CADENCES`); TC 3-21.5's quick time (`MARCH`) when absent. time: The regulation's time by its own name (`ordinary`, `quick`...); its first time when absent. side: The leg spared; the right when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanGait.ts (HumanGait.march, context); lexicon/HumanGait.ts (regulated, params); lexicon/HumanGait.ts (HumanGait.doubleTime, context); lexicon/HumanGait.ts (HumanGait.sad, context); lexicon/HumanGait.ts (HumanGait.proud, context); lexicon/HumanGait.ts (HumanGait.drunk, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkParams, IAutoMovieMotionHumanDrillRegulation.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanGait {
  /**
   * What a styled gait leaves to the composition: the walk's destination, waypoints, arrival heading and elbows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation What a styled gait leaves to the composition: the walk's destination, waypoints, arrival heading and elbows.
   * @evidence contracts/development/design.md#principled-representation Closed choices "pace", "stride", "armSwing" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanGait.ts (HumanGait.doubleTime, context); lexicon/HumanGait.ts (HumanGait.sad, context); lexicon/HumanGait.ts (HumanGait.proud, context); lexicon/HumanGait.ts (HumanGait.drunk, context); lexicon/HumanGait.ts (mood, context); lexicon/HumanGait.ts (distance, context).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkParams identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IParams = Omit<
    IAutoMovieMotionHumanWalkParams,
    "pace" | "stride" | "armSwing"
  >;

  /**
   * What a march leaves to the composition: the walk's, and the regulation and time it marches at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation regulation: The drill regulation (`HUMAN_DRILL_CADENCES`); TC 3-21.5's quick time (`MARCH`) when absent. time: The regulation's time by its own name (`ordinary`, `quick`...); its first time when absent.
   * @evidence contracts/development/design.md#principled-representation regulation: The drill regulation (`HUMAN_DRILL_CADENCES`); TC 3-21.5's quick time (`MARCH`) when absent. time: The regulation's time by its own name (`ordinary`, `quick`...); its first time when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanGait.ts (HumanGait.march, context); lexicon/HumanGait.ts (regulated, params); lexicon/HumanGait.ts (HumanGait.march).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanDrillRegulation.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IMarch extends IAutoMovieMotionHumanGait.IParams {
    /** The drill regulation (`HUMAN_DRILL_CADENCES`); TC 3-21.5's quick time (`MARCH`) when absent. */
    regulation?: IAutoMovieMotionHumanDrillRegulation.Name;

    /** The regulation's time by its own name (`ordinary`, `quick`...); its first time when absent. */
    time?: string;
  }

  /**
   * What a limp leaves to the composition: the walk's, and the leg spared.
   *
   * @evidence contracts/development/common.md#meaningful-documentation side: The leg spared; the right when absent.
   * @evidence contracts/development/design.md#principled-representation side: The leg spared; the right when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanGait.ts (HumanGait.stiffLimp, context); lexicon/HumanGait.ts (HumanGait.limp, context); lexicon/HumanGait.ts (HumanGait.stiffLimp); lexicon/HumanGait.ts (HumanGait.limp).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanGait.stiffLimp.
   */
  export interface ILimp extends IAutoMovieMotionHumanGait.IParams {
    /** The leg spared; the right when absent. */
    side?: "left" | "right";
  }
}
