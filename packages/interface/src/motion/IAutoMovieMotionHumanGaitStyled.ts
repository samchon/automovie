import type { IAutoMovieMotionHumanGait } from "./IAutoMovieMotionHumanGait";

/**
 * The styled gaits of the Gait family, each running the walk's stepping plan in
 * a gait of its own: the march and double time at a drill cadence, the sneak,
 * prowl and tiptoe, the moods, the limps and the drunk walk. Each stops at `to`
 * with the feet side by side, facing `face` or along the last leg, as a walk
 * does. The speed model, the presets and what a method's return and anchor are,
 * are on `IAutoMovieMotionHumanGait`.
 *
 * A method here is a method of `AutoMovieMotionHumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanGaitStyled` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanGaitStyled<Chain> {
  /**
   * March at the drill regulation's cadence and step (`HUMAN_DRILL_CADENCES`),
   * the arms swung nearly straight, in the whole number of drill steps nearest
   * the way, so the step gives and the cadence holds. A beat track replaces the
   * cadence; a formation slot sets the step count by the cadence.
   *
   * Registered law: `registered("march", params)`; not a chain method.
   *
   * @param params The walk's parameters but the pace, stride and arm swing, and
   *   the drill regulation and its time.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the march appended.
   */
  march(params: IAutoMovieMotionHumanGait.IMarch, anchor?: string): Chain;

  /**
   * Run the 0.762 m drill step at 180 steps a minute (`HumanGait.DOUBLE`, US
   * Army TC 3-21.5), a jog's speed, in the jog's gait, over the whole number of
   * drill steps nearest the way.
   *
   * Registered law: `registered("doubleTime", params)`; not a chain method.
   *
   * @param params The walk's parameters but the pace, stride and arm swing,
   *   which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the double time appended.
   */
  doubleTime(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;

  /**
   * Walk slower than the slow walk, at a third of its Froude number, on steps
   * 0.8 of the walking step there, the pelvis 0.05 hip heights low and the arms
   * held close with the elbows bent (`HumanGait.SNEAK`, provisional).
   *
   * Registered law: `registered("sneak", params)`; not a chain method.
   *
   * @param params The walk's parameters but the pace, stride and arm swing,
   *   which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the sneak appended.
   */
  sneak(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;

  /**
   * Sneak on deeply bent knees, the pelvis 0.12 hip heights low
   * (`HumanGait.PROWL`, provisional).
   *
   * Registered law: `registered("prowl", params)`; not a chain method.
   *
   * @param params The walk's parameters but the pace, stride and arm swing,
   *   which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the prowl appended.
   */
  prowl(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;

  /**
   * Sneak on the balls of the feet, the heels held 25 degrees up about the
   * toes' joint and never set down (`HumanGait.TIPTOE`, provisional).
   *
   * Registered law: `registered("tiptoe", params)`; not a chain method.
   *
   * @param params The walk's parameters but the pace, stride and arm swing,
   *   which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the tiptoe appended.
   */
  tiptoe(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;

  /**
   * Walk with the `sad` manner preset's speed, step and arm swing
   * (`AutoMovieMotionManner.PRESETS`) and the trunk leaning 8 degrees forward
   * (`HumanGait.MOODS`, provisional; Michalak et al. 2009 give the direction).
   *
   * Registered law: `registered("sad", params)`; not a chain method.
   *
   * @param params The walk's parameters but the pace, stride and arm swing,
   *   which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the sad walk appended.
   */
  sad(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;

  /**
   * Walk with the `proud` manner preset's speed, step and arm swing
   * (`AutoMovieMotionManner.PRESETS`) and the trunk upright
   * (`HumanGait.MOODS`).
   *
   * Registered law: `registered("proud", params)`; not a chain method.
   *
   * @param params The walk's parameters but the pace, stride and arm swing,
   *   which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the proud walk appended.
   */
  proud(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;

  /**
   * Walk slowly sparing the `side` leg: each step standing on it is cut 15 %
   * short and the next drawn out by as much (`HumanGait.LIMP`, provisional).
   *
   * Registered law: `registered("limp", params)`; not a chain method.
   *
   * @param params The walk's parameters but the pace, stride and arm swing, and
   *   the spared side.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the limp appended.
   */
  limp(params: IAutoMovieMotionHumanGait.ILimp, anchor?: string): Chain;

  /**
   * Limp as `limp` does, the spared leg also swinging with its knee straight,
   * the foot barely clearing the floor.
   *
   * Registered law: `registered("stiffLimp", params)`; not a chain method.
   *
   * @param params The walk's parameters but the pace, stride and arm swing, and
   *   the spared side.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the stiff-knee limp appended.
   */
  stiffLimp(params: IAutoMovieMotionHumanGait.ILimp, anchor?: string): Chain;

  /**
   * Walk slowly and unsteadily in time, three times a sober walk's step-to-step
   * unevenness, wandering to a seeded side by up to 0.15 hip heights every 2
   * hip heights of a straight way and back (`HumanGait.DRUNK`, provisional).
   * Waypoints given are walked as given, with no wander laid on them.
   *
   * Registered law: `registered("drunk", params)`; not a chain method.
   *
   * @param params The walk's parameters but the pace, stride and arm swing,
   *   which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the drunk walk appended.
   */
  drunk(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;

  /**
   * Walk at a run's speed with one foot always on the ground (World Athletics
   * rule TR54.2): a Froude number of 0.9, about 2.9 m/s on a 0.93 m hip, the
   * swing taking just under a whole step period so the double support shrinks
   * to a sliver, the pelvis barely rising, and the arms pumping with the elbows
   * near a right angle (`HumanRaceGait.FROUDE`, `SWING`, `BOB` and `ARMS`;
   * provisional). It ends as the walk does, with the feet side by side.
   *
   * Registered law: `registered("raceWalk", params)`; not a chain method.
   *
   * @param params The walk's parameters but the pace, stride and arm swing,
   *   which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the race walk appended.
   */
  raceWalk(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;
}
