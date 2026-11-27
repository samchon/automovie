import type { IAutoMovieMotionHumanSword } from "./IAutoMovieMotionHumanSword";
import type { IAutoMovieMotionHumanSwordGuard } from "./IAutoMovieMotionHumanSwordGuard";
import type { IAutoMovieMotionHumanSwordParry } from "./IAutoMovieMotionHumanSwordParry";

/**
 * Open parameters of the sword lexicon family, keyed by each runtime export
 * name.
 */
export interface IAutoMovieMotionHumanLexiconSwordParams {
  /**
   * Cut along one of the eight lines: the blade's landing part passes through
   * the target at the decisive instant (`stroke`), edge leading. A target
   * beyond the arm with the chosen advance is refused on `target`.
   *
   * The contact pose puts the landing part (`LANDS.cut` along the held thing's
   * edge, or its working point when it declares no edge) on the target with the
   * edge along the travel, the blade's lean back and its turn about the travel
   * chosen by the arm's fit (`HumanSwordLanding`); the stroke is that pose
   * turned back by `SWING` about the axis square to blade and travel, the hilt
   * going from a chamber by the shoulder to the contact on one progress, so the
   * edge leads through the whole arc. The aim, the contact pose, the chamber
   * and the path, then the shared stroke planner. `SWING`, the leans and turns
   * of the blade at contact and the chamber's place are provisional values
   * named in code and documentation; an unreachable target is refused, never
   * shortened. The landing's fits (`HumanSwordLanding`), ending at the first
   * the arm holds exactly; each posture costs the stroke planner's two elbow
   * searches. Planned once per instance; nothing is shared between instances.
   * The plan closes over its constants and the entry state, released with the
   * plan.
   */
  cut: IAutoMovieMotionHumanSword.ICut;

  /**
   * Take a guard and hold it: the hilt reaches the guard's place after the
   * setting time (`stroke`) and stays to the end.
   *
   * The guard's row gives the hilt's place in arm lengths from the blade hand's
   * shoulder and the blade's two directions in the performer's frame; the hand
   * frame that holds the blade so is carried from the entry hold on the clock's
   * minimum-jerk progress. One table row, one pose, the shared stroke planner.
   * The setting time (0.5 s, scaled by recovery skill) and every row are
   * provisional; a duration under the setting time is raised to it, as
   * documented on `seconds`. Constant work per plan. Planned once per instance;
   * nothing is shared between instances. The plan closes over its constants and
   * the entry state, released with the plan.
   */
  guard: IAutoMovieMotionHumanSwordGuard.IParams;

  /**
   * Parry: the strong of the blade brought across an incoming blade where its
   * attack is stopped, meeting it at `stroke`, or to a line as a drill. A
   * meeting beyond the arm is refused on `target`; an attack without a blade on
   * `against`.
   *
   * The attacker's displayed blade at the attack's decisive instant gives the
   * meeting point (`WEAK` of its length back from its point, the strong of the
   * parrying blade on the weak of the attacking one); the parrying blade
   * crosses it, upright for a high line and point down for a low one, offset to
   * the defender's side by `HumanSword.GAP`. The parry waits in its entry hold
   * so that its own travel ends on that instant. Where the blades meet, the
   * closed pose, the timing, then the shared stroke planner. The meeting share,
   * the hold and the retraction times are provisional; a parry that starts too
   * late for its travel keeps its own time and arrives late, never faster than
   * its skill. One read of the attacker's prop frame per plan. Planned once per
   * instance; nothing is shared between instances. The plan closes over its
   * constants and the entry state, released with the plan.
   */
  parry: IAutoMovieMotionHumanSwordParry.IParry;

  /**
   * Thrust: the point driven straight onto the target at the decisive instant
   * (`stroke`), with a step or a lunge when asked, then recovered. A target
   * beyond the arm with the chosen advance, or so near that the hand would land
   * within `NEAR` of the arm from the shoulder in a pose the arm cannot hold,
   * is refused on `target`.
   *
   * The landed pose puts the point on the target with the blade along the line
   * from the shoulder, as it stands after the advance; the hilt starts drawn
   * back beside the lower ribs with the point already on the line, and point
   * and turn run to the landed pose on one progress. The attack lasts as a
   * minimum-jerk unit arrested at its peak speed, the sword's cited peak
   * velocity in a lunge. The aim, the landed pose, the chamber, then the shared
   * stroke planner. The chamber's place is provisional; the shoulder used for
   * the reach ignores the lunge's sink, stated at `StrikingBlade.shoulder`.
   * Constant work per plan; each posture costs the stroke planner's elbow
   * searches and, in an advance, one root lowering. Planned once per instance;
   * nothing is shared between instances. The plan closes over its constants and
   * the entry state, released with the plan.
   */
  thrust: IAutoMovieMotionHumanSword.IAttack;
}
