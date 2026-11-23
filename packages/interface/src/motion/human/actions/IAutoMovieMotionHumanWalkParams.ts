import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanFormation } from "../ensemble/IAutoMovieMotionHumanFormation";
import type { IAutoMovieMotionHumanGait } from "../next/IAutoMovieMotionHumanGait";
import type { IAutoMovieMotionHumanWalkCadence } from "./IAutoMovieMotionHumanWalkCadence";
import type { IAutoMovieMotionHumanWalkFacing } from "./IAutoMovieMotionHumanWalkFacing";

/**
 * The walk's parameters (`IAutoMovieMotionHumanWalkParams`): where it goes and
 * by which way, how it faces, its Effort hooks and manner, a formation slot it
 * keeps, a beat it keeps step to, and a moving support it walks on.
 *
 * A walk yields its head, both arms and both hands to an overlay. A gait
 * entered while moving keeps the pelvis's speed along the new way
 * (`entrySpeed`); every walk ramps from its start and down to a stop at its own
 * `to`, so a short walk takes longer than its distance over the pace's speed,
 * and a `face` turn at the arrival adds the steps of the turn. A turn in place
 * (`to` where the performer stands, with `face`) yaws each foot by about 74
 * degrees a step for a 90 degree turn, 89 for 135 and 95 for 180, over about 2,
 * 2.75 and 3.25 steps (Khobkhun, Hollands and Richards 2022); a planted leg
 * leans at most 20 degrees to the side of its foot.
 */
export interface IAutoMovieMotionHumanWalkParams {
  /** The floor point to stop at, world metres. */
  to: IAutoMovieVector3;

  /**
   * The gait, which fixes the speed (`walk.FROUDE`; the speed model is
   * {@link IAutoMovieMotionHumanGait}). No step exceeds 0.75 m
   * (`walk.longestStep`):
   *
   * - `slow`: about 0.82 m/s, about 85 steps a minute; a stroll, a weary, sad or
   *   cautious walk.
   * - `normal`: about 1.5 m/s, about 120 steps a minute; ordinary walking.
   * - `fast`: about 1.72 m/s, about 138 steps a minute; hurrying, a brisk errand.
   *   A quicker way is a `run` jog.
   *
   * `normal` when absent. `normal` is the metabolic minimum of ordinary limbs
   * (PMID 21653821); `slow` and `fast` are the slow and the fast outdoor paces
   * of healthy adults at the reference hip (Murtagh, Mair, Aguiar, Tudor-Locke
   * and Murphy 2021, Sports Med 51:125).
   */
  pace?: IAutoMovieMotionHumanGait.WalkPace;

  /** Floor points passed in order before `to`, world metres. */
  via?: IAutoMovieVector3[];

  /**
   * The heading at arrival, degrees about +Y (0 faces +Z); the last leg's
   * direction when absent.
   */
  face?: number;

  /**
   * Which way the body faces while it walks, apart from the way it goes: a
   * fixed heading, or toward a floor point (turned by `turn` degrees), so it
   * walks backward, sideways or round while it faces it; along the way when
   * absent.
   */
  facing?: IAutoMovieMotionHumanWalkFacing.IFacing;

  /**
   * Step-length scale, an Effort hook (a hurried or a dragging gait), in [0.6,
   * 1.3]; 1 when absent. It changes the step and the steps a minute inversely
   * and leaves the speed.
   */
  stride?: number;

  /**
   * Arm-swing scale, an Effort hook, in [0, 2]; 1 when absent. It multiplies
   * the shoulder swing of the gait (`walk.SHOULDER`, 15 degrees either way).
   */
  armSwing?: number;

  /**
   * Elbows held out from the body, shoulder abduction added, degrees in [0,
   * 30]; 0 when absent.
   */
  elbows?: number;

  /**
   * How the walk is performed (`AutoMovieMotionManner`), a preset such as
   * `weary` or `brisk` or a manner of its own: its step factor scales the step
   * with `stride`, its swing factor the arm swing with `armSwing`, and its
   * tempo divides the speed. `pace: 1.5` makes the speed 1.5 times the `pace`
   * gait's (a normal walk at the reference hip: about 2.3 m/s in steps of at
   * most 0.75 m, so about 180 steps a minute); `pace: 0.8` makes it 0.8 times.
   * An Effort `time` factor makes the speed `1 / (1 - 0.3 time)` times
   * (`HumanEffort.modifiers`). Neutral when absent.
   */
  manner?: IAutoMovieMotionManner;

  /**
   * A formation slot to keep (`walkStation.resolve`): the walk goes along the
   * slot's way from its start until the station ends, `to` and `via` read from
   * it, and a gait that draws its own tempo keeps station by speed matching
   * (`walkStation`) while a cadenced one lets its step give. No station when
   * absent.
   */
  station?: IAutoMovieMotionHumanFormation.IStation;

  /**
   * A beat track to keep step to (`walkCadence`): each heel strike answers a
   * beat, by the walker's drawn asynchrony and phase correction, when the
   * walker locks to it; no beat when absent.
   */
  cadence?: IAutoMovieMotionHumanWalkCadence.ICadence;

  /**
   * A moving support walked on: a wagon's bed, a deck. `to` and `via` are read
   * where the support stood at the walk's start, the walk is planned there and
   * carried by the support's motion, and its feet plant on the prop. The ground
   * when absent.
   */
  on?: {
    /** Scene subject id of the prop on which the performer walks. */
    prop: string;
  };
}
