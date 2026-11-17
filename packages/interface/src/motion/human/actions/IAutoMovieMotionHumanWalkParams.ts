import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanFormation } from "../ensemble/IAutoMovieMotionHumanFormation";
import type { IAutoMovieMotionHumanWalkCadence } from "./IAutoMovieMotionHumanWalkCadence";
import type { IAutoMovieMotionHumanWalkFacing } from "./IAutoMovieMotionHumanWalkFacing";

/**
 * The walk's parameters (`IAutoMovieMotionHumanWalkParams`): where it goes and by which way,
 * how it faces, its Effort hooks and manner, a formation slot it keeps, a
 * beat it keeps step to, and a moving support it walks on.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit, frame, range and default.
 * @evidence contracts/development/design.md#principled-representation World metres and degrees about +Y; bounded scales as `HumanUnit.Bounded`; a station, a cadence and a support as their owners' records.
 * @evidence contracts/development/design.md#minimal-and-owned-surface What `walk.locomote`, the styled gaits and the rows read, split from `walk` so the law's file holds its planning.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names one gait: every walk-family law reads the same record.
 *
 * HumanPerformanceParams checks supplied parameters against the motions schema before planning; the action law owns reach and contact refusals.
 */
export interface IAutoMovieMotionHumanWalkParams {
  /** The floor point to stop at, world metres. */
  to: IAutoMovieVector3;

  /** The pace; `normal` when absent. */
  pace?: "slow" | "normal" | "fast";

  /** Floor points passed in order before `to`, world metres. */
  via?: IAutoMovieVector3[];

  /** The heading at arrival, degrees about +Y (0 faces +Z); the last leg's direction when absent. */
  face?: number;

  /** Which way the body faces while it walks, apart from the way it goes: a fixed heading, or toward a floor point (turned by `turn` degrees), so it walks backward, sideways or round while it faces it; along the way when absent. */
  facing?: IAutoMovieMotionHumanWalkFacing.IFacing;

  /** Step-length scale, an Effort hook (a hurried or a dragging gait), in [0.6, 1.3]; 1 when absent.
   * Inclusive range [0.6, 1.3]; schema default 1; unit dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
   */
  stride?: number;

  /** Arm-swing scale, an Effort hook, in [0, 2]; 1 when absent.
   * Inclusive range [0, 2]; schema default 1; unit dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
   */
  armSwing?: number;

  /** Elbows held out from the body, shoulder abduction added, degrees in [0, 30]; 0 when absent.
   * Inclusive range [0, 30]; schema default 0; unit "degrees". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas.
   */
  elbows?: number;

  /**
   * How the walk is performed (`AutoMovieMotionManner`), a preset such as
   * `weary` or `brisk` or a manner of its own: its step factor scales the
   * step with `stride`, its swing factor the arm swing with `armSwing`, and
   * its tempo slows the speed at that step, so the cadence falls with it.
   * Neutral when absent.
   */
  manner?: IAutoMovieMotionManner;

  /**
   * A formation slot to keep (`walkStation.resolve`): the walk goes along
   * the slot's way from its start until the station ends, `to` and `via`
   * read from it, and a gait that draws its own tempo keeps station by
   * speed matching (`walkStation`) while a cadenced one lets its step give.
   * No station when absent.
   */
  station?: IAutoMovieMotionHumanFormation.IStation;

  /**
   * A beat track to keep step to (`walkCadence`): each heel strike answers
   * a beat, by the walker's drawn asynchrony and phase correction, when the
   * walker locks to it; no beat when absent.
   */
  cadence?: IAutoMovieMotionHumanWalkCadence.ICadence;

  /**
   * A moving support walked on (#3491): a wagon's bed, a deck. `to` and
   * `via` are read where the support stood at the walk's start, the walk is
   * planned there and carried by the support's motion, and its feet plant
   * on the prop. The ground when absent.
   */
  on?: {
    /** Scene subject id of the prop on which the performer walks. */
    prop: string;
  };
}
