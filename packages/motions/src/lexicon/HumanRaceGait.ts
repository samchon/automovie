import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanGait,
  IAutoMovieMotionHumanWalkGait,
} from "@automovie/interface";

import { walk } from "../gait/internal/walk";

/**
 * The race walk: a walk driven to a run's speed without a flight. World
 * Athletics rule TR54.2 defines it: one foot is always on the ground, and the
 * advancing leg is straight from its first contact until it passes under the
 * body. So the swing takes almost the whole step and the double support shrinks
 * to a sliver (`SWING`), the pelvis barely rises (the flattened bob, `BOB`),
 * and the arms pump with the elbows near a right angle (`ARMS`). Its speed is a
 * Froude number of `FROUDE`, about 2.9 m/s on a 0.93 m hip, a club walker's
 * pace (elite 20 km walkers keep near 4 m/s on longer steps than the walk's hip
 * range admits here).
 *
 * Not yet: the pelvis's transverse rotation that lengthens the elite step, and
 * a stance knee locked straight by its own rule rather than by the walk's
 * contact flexion.
 */
export namespace HumanRaceGait {
  /** The race walk's Froude number (provisional, a club walker's speed). */
  export const FROUDE: number = 0.9;

  /**
   * The swing's duration in step periods: just under one, so a foot is always
   * down (TR54.2).
   */
  export const SWING: number = 0.94;

  /**
   * The pelvis's mean drop below a walk's and its vertical oscillation, hip
   * heights (provisional: race walkers flatten the centre of mass's path).
   */
  export const BOB: Readonly<
    NonNullable<IAutoMovieMotionHumanWalkGait["bob"]>
  > = {
    mean: -0.015,
    amplitude: 0.01,
  };

  /**
   * The arms' pump: shoulder swing, the elbow's mean flexion and its swing,
   * degrees (provisional).
   */
  export const ARMS: Readonly<IAutoMovieMotionHumanWalkGait["arms"]> = {
    shoulder: 35,
    elbow: 90,
    swing: 10,
  };

  /**
   * A race walk: a walk at a run's pace, one foot always down, the arms
   * pumping.
   */
  export const raceWalk: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanGait.IParams> =
    {
      name: "raceWalk",
      family: walk.name,
      interrupts: walk.interrupts,
      yields: walk.yields,
      plan: (
        context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanGait.IParams>,
      ): IAutoMovieMotionHumanActionPlan =>
        walk.locomote(context, {
          ...walk.walking(FROUDE),
          swing: SWING,
          bob: { ...BOB },
          arms: { ...ARMS },
        }),
    };
}
