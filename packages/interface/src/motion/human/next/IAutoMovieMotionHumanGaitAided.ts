import type { IAutoMovieMotionHumanAidWalk } from "../lexicon/IAutoMovieMotionHumanAidWalk";
import type { IAutoMovieMotionHumanCaneSweep } from "../lexicon/IAutoMovieMotionHumanCaneSweep";
import type { IAutoMovieMotionHumanCrutchWalk } from "../lexicon/IAutoMovieMotionHumanCrutchWalk";
import type { IAutoMovieMotionHumanFrailWalk } from "../lexicon/IAutoMovieMotionHumanFrailWalk";

/**
 * The aided walks of the Gait family: a cane, a crutch or a walking frame over authored floor stations, two crutches, the frail walk, and a long cane swept over a walk. The speed model and what a method's return and anchor are, are on `IAutoMovieMotionHumanGait`.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the walks it holds and where the shared speed model, return and anchor are documented.
 * @evidence contracts/development/design.md#principled-representation One method per gait law, each taking the law's own parameter type, over the one speed model of the walk's stepping plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The gait laws of the walk family: walk, run, approach, carryLoad, the pursuit laws, the door, the aided walks and the styled gaits.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; no gait has a method of its own that only respells a pace.
 */
export interface IAutoMovieMotionHumanGaitAided<Chain> {
  /**
   * Walk through the authored floor stations with a cane or a crutch in one
   * hand, advanced during the opposite foot's swing, or behind a walking frame
   * advanced while both feet stand, and stop at the last station holding the
   * aid. Each station's seconds set its speed: no natural aided speed is
   * defined, and 0.6 m/s or slower fits a frail walker (Studenski et al. 2011).
   *
   * @param params The aid's kind and prop, the hand for a cane or crutch, and the floor stations.
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
   * @param params The destination, waypoints, arrival heading, severity and manner.
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
   * @param params The two crutch props, the floor stations, the crutch gait and the injured leg.
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
   * @param params The cane prop, the cane hand, the technique and the sweep's seconds.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the sweep appended.
   */
  caneSweep(params: IAutoMovieMotionHumanCaneSweep, anchor?: string): Chain;
}
