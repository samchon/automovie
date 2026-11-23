import type { IAutoMovieMotionHumanCrossAnkleOverKnee } from "../everyday/IAutoMovieMotionHumanCrossAnkleOverKnee";
import type { IAutoMovieMotionHumanKneel } from "../everyday/IAutoMovieMotionHumanKneel";
import type { IAutoMovieMotionHumanRise } from "../everyday/IAutoMovieMotionHumanRise";
import type { IAutoMovieMotionHumanSeatedHeelBounce } from "../everyday/IAutoMovieMotionHumanSeatedHeelBounce";
import type { IAutoMovieMotionHumanSit } from "../everyday/IAutoMovieMotionHumanSit";

/**
 * The seated postures and their transitions: sitting down, rising and kneeling.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Seat family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Seat laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanSeat<Chain> {
  /**
   * Sitting down on a chair, bench or stool from standing in front of it: the body's seat socket is lowered onto the seat while the trunk leans forward and the feet stay where they stand.
   *
   * @param params The `balance`, `seat`, `back`, `seconds`, `legs` and `manner` of `IAutoMovieMotionHumanSit.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  sit(params: IAutoMovieMotionHumanSit.IParams, anchor?: string): Chain;

  /**
   * Standing up from a seat, in the four phases of sit-to-stand (Schenkman, Berger, Riley, Mann and Hodge 1990, Phys Ther 70:638): flexion momentum, where the trunk flexes forward while the seat still bears the weight; momentum transfer at seat-off, where the hips leave the seat and the body moves forward over the feet; extension of the hips and knees; and stabilisation.
   *
   * @param params The `balance`, `to` and `manner` of `IAutoMovieMotionHumanRise.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  rise(params: IAutoMovieMotionHumanRise.IParams, anchor?: string): Chain;

  /**
   * Kneeling from standing: on one knee (half kneel), on both knees upright, or sitting back on the heels, held, then rising the way it went down.
   *
   * @param params The `balance`, `kind`, `knee`, `hold`, `rise`, `at` and `manner` of `IAutoMovieMotionHumanKneel.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  kneel(params: IAutoMovieMotionHumanKneel.IParams, anchor?: string): Chain;

  /**
   * An ankle-over-knee rest after sitting on a chair with both feet down: one ankle lifts over the other knee, rests there and returns.
   *
   * @param params The `side` and `hold` of `IAutoMovieMotionHumanCrossAnkleOverKnee`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  crossAnkleOverKnee(
    params: IAutoMovieMotionHumanCrossAnkleOverKnee,
    anchor?: string,
  ): Chain;

  /**
   * One or more rhythmic heel raises from a seated position with both feet planted: the moving leg's heel rises and returns while the opposite foot stays down.
   *
   * @param params The `side`, `count`, `cadence` and `amplitude` of `IAutoMovieMotionHumanSeatedHeelBounce`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   */
  seatedHeelBounce(
    params: IAutoMovieMotionHumanSeatedHeelBounce,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Seat methods.
 */
export namespace IAutoMovieMotionHumanSeat {
  /**
   * The kind, hold and rise that a named kneel fixes: the `kind`, `hold` and `rise` of `kneel`. Spread into `kneel`'s parameters; `AutoMovieMotionHumanSeat.TAKE_A_KNEE`, `KNEEL_BRIEFLY` and `KNEEL_SIT` are its data and the rows of the same names read them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, which presets use it, how it is applied and where the members' meanings are.
   * @evidence contracts/development/design.md#principled-representation The kneel law's own members, so a preset fixes only the values its row means and the law keeps every other default.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `kneel` owns the members' meanings.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the type names the pick of `kneel`'s own members and redefines none.
   */
  export type IKneelPreset = Pick<
    IAutoMovieMotionHumanKneel.IParams,
    "kind" | "hold" | "rise"
  >;
}
