import type { IAutoMovieMotionHumanGait } from "./IAutoMovieMotionHumanGait";

/**
 * The styled gaits of the Gait family, each running the walk's stepping plan in a gait of its own: the march and double time at a drill cadence, the sneak, prowl and tiptoe, the moods, the limps and the drunk walk. Each stops at `to` with the feet side by side, facing `face` or along the last leg, as a walk does. The speed model, the presets and what a method's return and anchor are, are on `IAutoMovieMotionHumanGait`.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the gaits it holds, where every one ends, and where the shared speed model, presets, return and anchor are documented.
 * @evidence contracts/development/design.md#principled-representation One method per gait law, each taking the law's own parameter type, over the one speed model of the walk's stepping plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The gait laws of the walk family: walk, run, approach, carryLoad, the pursuit laws, the door, the aided walks and the styled gaits.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; no gait has a method of its own that only respells a pace.
 */
export interface IAutoMovieMotionHumanGaitStyled<Chain> {
  /**
   * March at the drill regulation's cadence and step (`HUMAN_DRILL_CADENCES`),
   * the arms swung nearly straight, in the whole number of drill steps nearest
   * the way, so the step gives and the cadence holds. A beat track replaces
   * the cadence; a formation slot sets the step count by the cadence.
   *
   * @param params The walk's parameters but the pace, stride and arm swing, and the drill regulation and its time.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the march appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the cadence and step source, how the step count is chosen, what overrides the cadence, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.march is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.march is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.march is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.march is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.march is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.march is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  march(params: IAutoMovieMotionHumanGait.IMarch, anchor?: string): Chain;

  /**
   * Run the 0.762 m drill step at 180 steps a minute (`HumanGait.DOUBLE`, US
   * Army TC 3-21.5), a jog's speed, in the jog's gait, over the whole number
   * of drill steps nearest the way.
   *
   * @param params The walk's parameters but the pace, stride and arm swing, which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the double time appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the step, cadence and source, the gait it is run in, the step count, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.doubleTime is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  doubleTime(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;

  /**
   * Walk slower than the slow walk, at a third of its Froude number, on steps
   * 0.8 of the walking step there, the pelvis 0.05 hip heights low and the
   * arms held close with the elbows bent (`HumanGait.SNEAK`, provisional).
   *
   * @param params The walk's parameters but the pace, stride and arm swing, which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the sneak appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the sneak's speed, step, pelvis and arms with their provisional constant, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.sneak is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.sneak is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.sneak is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.sneak is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.sneak is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.sneak is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  sneak(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;

  /**
   * Sneak on deeply bent knees, the pelvis 0.12 hip heights low
   * (`HumanGait.PROWL`, provisional).
   *
   * @param params The walk's parameters but the pace, stride and arm swing, which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the prowl appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States how the prowl differs from the sneak with its provisional constant, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.prowl is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.prowl is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.prowl is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.prowl is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.prowl is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.prowl is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  prowl(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;

  /**
   * Sneak on the balls of the feet, the heels held 25 degrees up about the
   * toes' joint and never set down (`HumanGait.TIPTOE`, provisional).
   *
   * @param params The walk's parameters but the pace, stride and arm swing, which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the tiptoe appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States how the tiptoe differs from the sneak with its provisional constant, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.tiptoe is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  tiptoe(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;

  /**
   * Walk with the `sad` manner preset's speed, step and arm swing
   * (`AutoMovieMotionManner.PRESETS`) and the trunk leaning 8 degrees forward
   * (`HumanGait.MOODS`, provisional; Michalak et al. 2009 give the direction).
   *
   * @param params The walk's parameters but the pace, stride and arm swing, which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the sad walk appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States where the sad walk's speed, step and swing come from and its trunk lean with source and status, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.sad is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.sad is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.sad is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.sad is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.sad is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.sad is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  sad(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;

  /**
   * Walk with the `proud` manner preset's speed, step and arm swing
   * (`AutoMovieMotionManner.PRESETS`) and the trunk upright
   * (`HumanGait.MOODS`).
   *
   * @param params The walk's parameters but the pace, stride and arm swing, which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the proud walk appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States where the proud walk's speed, step and swing come from and its trunk, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.proud is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.proud is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.proud is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.proud is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.proud is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.proud is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  proud(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;

  /**
   * Walk slowly sparing the `side` leg: each step standing on it is cut 15 %
   * short and the next drawn out by as much (`HumanGait.LIMP`, provisional).
   *
   * @param params The walk's parameters but the pace, stride and arm swing, and the spared side.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the limp appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the limp's asymmetry with its provisional constant, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.limp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.limp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.limp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.limp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.limp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.limp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  limp(params: IAutoMovieMotionHumanGait.ILimp, anchor?: string): Chain;

  /**
   * Limp as `limp` does, the spared leg also swinging with its knee straight,
   * the foot barely clearing the floor.
   *
   * @param params The walk's parameters but the pace, stride and arm swing, and the spared side.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the stiff-knee limp appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States how the stiff-knee limp differs from the limp, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.stiffLimp is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  stiffLimp(params: IAutoMovieMotionHumanGait.ILimp, anchor?: string): Chain;

  /**
   * Walk slowly and unsteadily in time, three times a sober walk's
   * step-to-step unevenness, wandering to a seeded side by up to 0.15 hip
   * heights every 2 hip heights of a straight way and back
   * (`HumanGait.DRUNK`, provisional). Waypoints given are walked as given,
   * with no wander laid on them.
   *
   * @param params The walk's parameters but the pace, stride and arm swing, which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the drunk walk appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the drunk walk's unevenness and wander with their provisional constant, when the wander is not laid, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.drunk is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.drunk is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.drunk is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.drunk is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.drunk is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.drunk is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  drunk(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;

  /**
   * Walk at a run's speed with one foot always on the ground (World Athletics rule TR54.2): a Froude number of 0.9, about 2.9 m/s on a 0.93 m hip, the swing taking just under a whole step period so the double support shrinks to a sliver, the pelvis barely rising, and the arms pumping with the elbows near a right angle (`HumanRaceGait.FROUDE`, `SWING`, `BOB` and `ARMS`; provisional). It ends as the walk does, with the feet side by side.
   *
   * @param params The walk's parameters but the pace, stride and arm swing, which the gait fixes.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the race walk appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule the walk follows, its speed and the factors that give its signature, how it ends, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGaitStyled.raceWalk is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGaitStyled.raceWalk is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGaitStyled.raceWalk is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGaitStyled.raceWalk is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGaitStyled.raceWalk is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGaitStyled.raceWalk is provided by the chain that implements IAutoMovieMotionHumanGaitStyled.
   */
  raceWalk(params: IAutoMovieMotionHumanGait.IParams, anchor?: string): Chain;
}
