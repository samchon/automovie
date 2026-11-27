import type { IAutoMovieMotionHumanAidWalk } from "./IAutoMovieMotionHumanAidWalk";
import type { IAutoMovieMotionHumanCaneSweep } from "./IAutoMovieMotionHumanCaneSweep";
import type { IAutoMovieMotionHumanCrutchWalk } from "./IAutoMovieMotionHumanCrutchWalk";
import type { IAutoMovieMotionHumanFrailWalk } from "./IAutoMovieMotionHumanFrailWalk";

/**
 * The aided walks of the Gait family: a cane, a crutch or a walking frame over
 * authored floor stations, two crutches, the frail walk, and a long cane swept
 * over a walk. The speed model and what a method's return and anchor are, are
 * on `IAutoMovieMotionHumanGait`.
 *
 * A method here is a method of `AutoMovieMotionHumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanGaitAided` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanGaitAided<Chain> {
  /**
   * Walk through the authored floor stations with a cane or a crutch in one
   * hand, advanced during the opposite foot's swing, or behind a walking frame
   * advanced while both feet stand, and stop at the last station holding the
   * aid. Each station's seconds set its speed: no natural aided speed is
   * defined, and 0.6 m/s or slower fits a frail walker (Studenski et al.
   * 2011).
   *
   * Registered law: `registered("aidWalk", params)`; not a chain method.
   *
   * @param params The aid's kind and prop, the hand for a cane or crutch, and
   *   the floor stations.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the aided walk appended.
   */
  aidWalk(params: IAutoMovieMotionHumanAidWalk, anchor?: string): Chain;

  /**
   * Walk to `to` as a frail older person does, graded by `severity` from the
   * ordinary walk (0) to a shuffle (1): slower, on shorter and lower steps and
   * a wider base, the trunk flexed forward and the arms barely swinging
   * (`HumanFrailWalk`). It stops at `to` as a walk does.
   *
   * Registered law: `registered("frailWalk", params)`; not a chain method.
   *
   * @param params The destination, waypoints, arrival heading, severity and
   *   manner.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the frail walk appended.
   */
  frailWalk(params: IAutoMovieMotionHumanFrailWalk, anchor?: string): Chain;

  /**
   * Walk through the floor stations on two crutches: at each station both tips
   * plant ahead first, then the body swings on the hands in the three-point,
   * swing-to or swing-through gait (Physiopedia, Crutches), the three-point
   * gait holding the injured foot off the floor. It stops at the last station
   * standing between the crutches.
   *
   * Registered law: `registered("crutchWalk", params)`; not a chain method.
   *
   * @param params The two crutch props, the floor stations, the crutch gait and
   *   the injured leg.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the crutch walk appended.
   */
  crutchWalk(params: IAutoMovieMotionHumanCrutchWalk, anchor?: string): Chain;

  /**
   * Sweep a long cane for `seconds` over the walk this action rides (`over`):
   * the cane hand at the body's midline, the tip arcing from side to side just
   * wider than the body and touching the floor opposite each landing foot
   * (two-point touch) or sliding along it (constant contact). A sweep over
   * anything but a walk of at least one step is refused.
   *
   * Registered law: `registered("caneSweep", params)`; not a chain method.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims the cane hand's arm and hand.
   *
   * @param params The cane prop, the cane hand, the technique and the sweep's
   *   seconds.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the sweep appended.
   */
  caneSweep(params: IAutoMovieMotionHumanCaneSweep, anchor?: string): Chain;
}
