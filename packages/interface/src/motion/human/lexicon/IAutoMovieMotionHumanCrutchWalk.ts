import type { IAutoMovieRigidTransform } from "../../../geometry/IAutoMovieRigidTransform";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanActionLaw } from "../law/IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanAidWalk } from "./IAutoMovieMotionHumanAidWalk";

/**
 * Walking on two crutches (#3994): both crutch tips plant ahead of the feet
 * first, then the body swings on the hands through the crutches, in one of
 * the clinical crutch gaits (Physiopedia, Crutches):
 *
 * - `threePoint`: both crutches and the injured leg advance together, the
 *   injured foot held off the floor, then the sound foot steps through to
 *   land between the crutch tips;
 * - `swingTo`: both crutches advance, then both feet swing together to land
 *   level with the tips;
 * - `swingThrough`: both crutches advance, then both feet swing past the
 *   tips to land ahead of them.
 *
 * Through each swing the hands bear the body's weight on the handgrips; the
 * underarm pads press the chest's side, never the axillae.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three gaits, their orders and where the weight goes.
 * @evidence contracts/development/design.md#principled-representation Two staged crutch props, the body's floor stations and a closed gait choice.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The members `HumanCrutchWalk` reads, with the aided walk's own station record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No crutch or foot place is typed; each follows the stations and the crutches' own staged frames.
 */
export interface IAutoMovieMotionHumanCrutchWalk {
  /** The crutch staged at the left side, a prop with a `grip` and a `tip`. */
  left: string;

  /** The crutch staged at the right side, a prop with a `grip` and a `tip`. */
  right: string;

  /** Consecutive floor stations of the body, from its standing pose between the crutches. */
  stations: readonly IAutoMovieMotionHumanAidWalk.IStation[];

  /**
   * The entry station's world floor point, metres: where the body stands at
   * entry, from which every station's `x` and `z` are measured and about
   * which its `turn` carries the body, its feet and both crutches as one
   * rigid whole. Absent, the feet turn about the crutch tips' midpoint and
   * each crutch about its own tip, which matches only a walk that never turns.
   */
  origin?: IAutoMovieVector3;

  /** The crutch gait; `threePoint` when absent. */
  pattern?: IAutoMovieMotionHumanCrutchWalk.Pattern;

  /** The injured leg a three-point gait holds off the floor; the left when absent. */
  injured?: AutoMovieHumanSide;
}

export namespace IAutoMovieMotionHumanCrutchWalk {
  /**
   * The clinical crutch gaits.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the three clinical crutch gaits; the law states each one's order.
   * @evidence contracts/development/design.md#principled-representation A closed union of the gaits in Physiopedia's crutch-gait classification that the law performs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The walk's `pattern` member reads it and HumanCrutchWalk's plan branches on it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts One literal per gait, with no optional fields to combine.
   */
  export type Pattern = "threePoint" | "swingTo" | "swingThrough";

  /**
   * The crutch walk's law and the track that moves each crutch on its clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the law and the track reader's inputs, frame and timebase.
   * @evidence contracts/development/design.md#principled-representation The track maps a film second to one crutch's world rigid frame, from its staged frame, the walk's parameters and its side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The law the vocabulary registers and the track the scene's two props read, so both share one course.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Every crutch frame derives from the same stations the law plans.
   */
  export interface ILaw extends IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanCrutchWalk> {
    /**
     * From one crutch's staged floor frame, the walk's parameters, the crutch's side and the walk's first film second (zero when absent), the crutch's world frame at each film second.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the start's default, the reader's timebase and the result's frame.
     */
    track: (
      start: IAutoMovieRigidTransform,
      params: IAutoMovieMotionHumanCrutchWalk,
      side: AutoMovieHumanSide,
      startsAt?: number,
    ) => (filmSecond: number) => IAutoMovieRigidTransform;
  }
}
