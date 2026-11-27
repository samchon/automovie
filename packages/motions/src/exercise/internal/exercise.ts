import type {
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanExercise,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { exercisePlan } from "./exercisePlan";

/** The record of `IDropM`'s site. */
type IDropM = { thigh: number; shank: number };

/**
 * A standing bodyweight exercise counted in repetitions: the squat, the forward
 * lunge, high knees and the jumping jack (ACSM's Guidelines for Exercise
 * Testing and Prescription, 11th ed.).
 *
 * Every repetition has four spans: `eccentricStart` (lowering, or opening),
 * `bottom` (the pause at the bottom), `concentricStart` (rising, or closing)
 * and `top` (the pause on top), numbered from 1, so the counts are exact and
 * the tempo is the declared eccentric, pause and concentric seconds (2, 0, 1
 * when absent, the common 2-0-1 tempo; provisional).
 *
 * - Squat lowers and moves the hips back over planted feet. The quarter, half and
 *   parallel depths place the thighs 60, 45 and 0 degrees above horizontal. The
 *   shanks lean forward up to 35 degrees and the trunk pitches 15, 25 or 40
 *   degrees. The optional balance correction acts on this path.
 * - Lunge: the hips come down until the lead thigh is level over an upright shank
 *   and travel forward until the trailing thigh hangs under its hip, that leg's
 *   shank level behind it on a foot stood on its toes with the ankle at its
 *   dorsiflexion range; the lead foot steps out to stand a thigh ahead of the
 *   hips there, and steps back.
 * - High knees: one knee rises per repetition, alternating, the ankle under a
 *   thigh raised to the horizontal ahead of the hip, the hips carried over the
 *   standing foot.
 * - Jumping jack: the feet jump apart to 1.5 half shoulder widths each side of
 *   the midline (provisional) with the arms raised overhead, and back; a hop of
 *   4 cm (provisional) lifts the body in each jump, the feet free while they
 *   travel.
 *
 * Events: the numbered repetition instants. A cut at a repetition's `top` into
 * standing or another exercise is legal.
 *
 * Not drafted: floor exercises (push-up, plank, sit-up, glute bridge, mountain
 * climber, burpee), loaded lifts, machines and skipping rope; they need hand
 * and back supports on the floor.
 */
export namespace exercise {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "exercise";

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      exercise: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
    });

  /** The thigh's angle from the horizontal at the bottom, degrees, by depth. */
  export const THIGH: Readonly<
    Record<IAutoMovieMotionHumanExercise.Depth, number>
  > = {
    quarter: 60,
    half: 45,
    parallel: 0,
  };

  /** The trunk's pitch at the bottom, degrees, by depth (provisional). */
  export const PITCH: Readonly<
    Record<IAutoMovieMotionHumanExercise.Depth, number>
  > = {
    quarter: 15,
    half: 25,
    parallel: 40,
  };

  /** The shank's greatest forward lean in a squat, degrees (provisional). */
  export const SHANK: number = 35;

  /**
   * The hips' drop of a squat to a depth.
   *
   * @param m The body's measure.
   * @param depth The depth.
   * @returns Metres.
   */
  export function drop(
    m: IDropM,
    depth: IAutoMovieMotionHumanExercise.Depth,
  ): number {
    return m.thigh + m.shank - bottom(m, depth).height;
  }

  /** Hip position relative to the ankles at the bottom, in metres. */
  export function bottom(
    m: IDropM,
    depth: IAutoMovieMotionHumanExercise.Depth,
    extent: number = 1,
  ): { height: number; forward: number } {
    const alpha: number = ((90 - (90 - THIGH[depth]) * extent) * Math.PI) / 180;
    const radius: number = (m.thigh * Math.cos(alpha)) / m.shank;
    const beta: number = Math.min(
      (SHANK * Math.PI) / 180,
      Math.asin(Math.max(0, Math.min(1, radius))),
    );
    return {
      height: m.shank * Math.cos(beta) + m.thigh * Math.sin(alpha),
      forward: m.shank * Math.sin(beta) - m.thigh * Math.cos(alpha),
    };
  }

  /** {@link exercisePlan}, read through this namespace. */
  export const plan: typeof exercisePlan = exercisePlan;
}
