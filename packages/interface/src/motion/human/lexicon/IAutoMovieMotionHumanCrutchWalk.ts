import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanActionLaw } from "../law/IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanAidWalk } from "./IAutoMovieMotionHumanAidWalk";

/**
 * Walking on two crutches: both crutch tips plant ahead of the feet first, then
 * the body swings on the hands through the crutches, in one of the clinical
 * crutch gaits (Physiopedia, Crutches):
 *
 * - `threePoint`: both crutches and the injured leg advance together, the injured
 *   foot held off the floor, then the sound foot steps through to land between
 *   the crutch tips;
 * - `swingTo`: both crutches advance, then both feet swing together to land level
 *   with the tips;
 * - `swingThrough`: both crutches advance, then both feet swing past the tips to
 *   land ahead of them.
 *
 * Through each swing the hands bear the body's weight on the handgrips; the
 * underarm pads press the chest's side, never the axillae.
 */
export interface IAutoMovieMotionHumanCrutchWalk {
  /** The crutch staged at the left side, a prop with a `grip` and a `tip`. */
  left: string;

  /** The crutch staged at the right side, a prop with a `grip` and a `tip`. */
  right: string;

  /**
   * Consecutive floor stations of the body, from its standing pose between the
   * crutches.
   */
  stations: readonly IAutoMovieMotionHumanAidWalk.IStation[];

  /**
   * The entry station's world floor point, metres: where the body stands at
   * entry, from which every station's `x` and `z` are measured and about which
   * its `turn` carries the body, its feet and both crutches as one rigid whole.
   * Absent, the feet turn about the crutch tips' midpoint and each crutch about
   * its own tip, which matches only a walk that never turns.
   */
  origin?: IAutoMovieVector3;

  /** The crutch gait; `threePoint` when absent. */
  pattern?: IAutoMovieMotionHumanCrutchWalk.Pattern;

  /**
   * The injured leg a three-point gait holds off the floor; the left when
   * absent.
   */
  injured?: AutoMovieHumanSide;
}

export namespace IAutoMovieMotionHumanCrutchWalk {
  /** The clinical crutch gaits. */
  export type Pattern = "threePoint" | "swingTo" | "swingThrough";

  /** The crutch walk's law and the track that moves each crutch on its clock. */
  export interface ILaw extends IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCrutchWalk> {
    /**
     * From one crutch's staged floor frame, the walk's parameters, the crutch's
     * side and the walk's first film second (zero when absent), the crutch's
     * world frame at each film second. If the crutch's origin differs from its
     * named tip, supply that tip in crutch-local metres.
     */
    track: (
      start: IAutoMovieRigidTransform,
      params: IAutoMovieMotionHumanCrutchWalk,
      side: AutoMovieHumanSide,
      startsAt?: number,
      localTip?: IAutoMovieVector3,
    ) => (filmSecond: number) => IAutoMovieRigidTransform;
  }
}
