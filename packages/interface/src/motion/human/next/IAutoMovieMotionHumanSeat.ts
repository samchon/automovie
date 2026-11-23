import type { IAutoMovieMotionHumanCrossAnkleOverKnee } from "../everyday/IAutoMovieMotionHumanCrossAnkleOverKnee";
import type { IAutoMovieMotionHumanKneel } from "../everyday/IAutoMovieMotionHumanKneel";
import type { IAutoMovieMotionHumanRise } from "../everyday/IAutoMovieMotionHumanRise";
import type { IAutoMovieMotionHumanSeatedHeelBounce } from "../everyday/IAutoMovieMotionHumanSeatedHeelBounce";
import type { IAutoMovieMotionHumanSit } from "../everyday/IAutoMovieMotionHumanSit";

/**
 * The seated postures and their transitions: sitting down, rising and kneeling.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 */
export interface IAutoMovieMotionHumanSeat<Chain> {
  /**
   * Sitting down on a chair, bench or stool from standing in front of it: the body's seat socket is lowered onto the seat while the trunk leans forward and the feet stay where they stand.
   *
   * @param params The `balance`, `seat`, `back`, `seconds`, `legs` and `manner` of `IAutoMovieMotionHumanSit.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  sit(params: IAutoMovieMotionHumanSit.IParams, anchor?: string): Chain;

  /**
   * Standing up from a seat, in the four phases of sit-to-stand (Schenkman, Berger, Riley, Mann and Hodge 1990, Phys Ther 70:638): flexion momentum, where the trunk flexes forward while the seat still bears the weight; momentum transfer at seat-off, where the hips leave the seat and the body moves forward over the feet; extension of the hips and knees; and stabilisation.
   *
   * @param params The `balance`, `to` and `manner` of `IAutoMovieMotionHumanRise.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  rise(params: IAutoMovieMotionHumanRise.IParams, anchor?: string): Chain;

  /**
   * Kneeling from standing: on one knee (half kneel), on both knees upright, or sitting back on the heels, held, then rising the way it went down.
   *
   * @param params The `balance`, `kind`, `knee`, `hold`, `rise`, `at` and `manner` of `IAutoMovieMotionHumanKneel.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  kneel(params: IAutoMovieMotionHumanKneel.IParams, anchor?: string): Chain;

  /**
   * An ankle-over-knee rest after sitting on a chair with both feet down: one ankle lifts over the other knee, rests there and returns.
   *
   * @param params The `side` and `hold` of `IAutoMovieMotionHumanCrossAnkleOverKnee`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
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
   */
  export type IKneelPreset = Pick<
    IAutoMovieMotionHumanKneel.IParams,
    "kind" | "hold" | "rise"
  >;
}
