import type { IAutoMovieMotionHumanExercise } from "../exercise/IAutoMovieMotionHumanExercise";
import type { IAutoMovieMotionHumanLineWalk } from "../exercise/IAutoMovieMotionHumanLineWalk";
import type { IAutoMovieMotionHumanRopeSkip } from "../exercise/IAutoMovieMotionHumanRopeSkip";
import type { IAutoMovieMotionHumanStiltWalk } from "../exercise/IAutoMovieMotionHumanStiltWalk";
import type { IAutoMovieMotionHumanStretch } from "../exercise/IAutoMovieMotionHumanStretch";
import type { IAutoMovieMotionHumanWorkout as ILegacyWorkout } from "../exercise/IAutoMovieMotionHumanWorkout";

/**
 * Repeated exercises and stretches: a repetition clock built from `tempo` (3.3 s a repetition by default) and the kind tables.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Workout family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Workout laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanWorkout<Chain> {
  /**
   * A standing bodyweight exercise counted in repetitions (#3245, M24): the squat, the forward lunge, high knees and the jumping jack (ACSM's Guidelines for Exercise Testing and Prescription, 11th ed.).
   *
   * @param params The `balance`, `kind`, `reps`, `depth`, `tempo`, `side` and `manner` of `IAutoMovieMotionHumanExercise.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWorkout.exercise is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWorkout.exercise is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWorkout.exercise is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWorkout.exercise is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWorkout.exercise is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWorkout.exercise is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   */
  exercise(
    params: IAutoMovieMotionHumanWorkout.IExercise,
    anchor?: string,
  ): Chain;

  /**
   * A standing static stretch or yoga pose held and released (#3246): the neck side bend, the cross-body shoulder stretch, the overhead side bend, the standing quadriceps stretch and the tree pose, held 30 s by default (`stretch.HOLD`, Bandy et al. 1997).
   *
   * @param params The `kind`, `side`, `seconds`, `intensity` and `manner` of `IAutoMovieMotionHumanStretch.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWorkout.stretch is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWorkout.stretch is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWorkout.stretch is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWorkout.stretch is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWorkout.stretch is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWorkout.stretch is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   */
  stretch(
    params: IAutoMovieMotionHumanWorkout.IStretch,
    anchor?: string,
  ): Chain;

  /**
   * An exercise, a stretch or a pose done on a support that is not only the feet, or with the feet kept under a moving trunk: the body gets from standing into the exercise's first posture, passes through the postures of each repetition, and gets up again (#3377, #3378).
   *
   * @param params The `kind`, `reps`, `hold`, `on`, `stay`, `load` and `manner` of `ILegacyWorkout.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWorkout.workout is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWorkout.workout is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWorkout.workout is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWorkout.workout is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWorkout.workout is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWorkout.workout is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   */
  workout(
    params: IAutoMovieMotionHumanWorkout.IWorkout,
    anchor?: string,
  ): Chain;

  /**
   * Skip a rope in place: one two-foot jump over the rope at each of its turns.
   *
   * @param params The `periodSeconds` and `flightSeconds` of `IAutoMovieMotionHumanRopeSkip.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWorkout.ropeSkip is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWorkout.ropeSkip is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWorkout.ropeSkip is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWorkout.ropeSkip is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWorkout.ropeSkip is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWorkout.ropeSkip is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   */
  ropeSkip(
    params: IAutoMovieMotionHumanWorkout.IRopeSkip,
    anchor?: string,
  ): Chain;

  /**
   * A walk along a line too narrow for a normal gait (#3875 beam, #3997 tightrope): the feet step heel to toe on the line, each turned out from it, the arms held out to the sides, and the body sways over the line and corrects (`lineWalk`).
   *
   * @param params The `on`, `to`, `steps`, `pole` and `sag` of `IAutoMovieMotionHumanLineWalk.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWorkout.lineWalk is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWorkout.lineWalk is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWorkout.lineWalk is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWorkout.lineWalk is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWorkout.lineWalk is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWorkout.lineWalk is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   */
  lineWalk(
    params: IAutoMovieMotionHumanWorkout.ILineWalk,
    anchor?: string,
  ): Chain;

  /**
   * A walk on stilts (#3997): each foot strapped on a stilt's platform, the stilts' tips the only floor contacts, short steps on a wide base.
   *
   * @param params The `stilts`, `to` and `steps` of `IAutoMovieMotionHumanStiltWalk.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanWorkout.stiltWalk is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanWorkout.stiltWalk is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanWorkout.stiltWalk is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanWorkout.stiltWalk is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanWorkout.stiltWalk is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanWorkout.stiltWalk is provided by the chain that implements IAutoMovieMotionHumanWorkout.
   */
  stiltWalk(
    params: IAutoMovieMotionHumanWorkout.IStiltWalk,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Workout methods.
 */
export namespace IAutoMovieMotionHumanWorkout {
  /**
   * The parameters of `exercise`: `IAutoMovieMotionHumanExercise.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanExercise.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanExercise.IParams` owns the shape; the alias serves `exercise` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IExercise = IAutoMovieMotionHumanExercise.IParams;

  /**
   * The parameters of `stretch`: `IAutoMovieMotionHumanStretch.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanStretch.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStretch.IParams` owns the shape; the alias serves `stretch` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IStretch = IAutoMovieMotionHumanStretch.IParams;

  /**
   * The parameters of `workout`: `IAutoMovieMotionHumanWorkout.IParams` (`exercise/IAutoMovieMotionHumanWorkout`), the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanWorkout.IParams` (`exercise/IAutoMovieMotionHumanWorkout`): the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWorkout.IParams` (`exercise/IAutoMovieMotionHumanWorkout`) owns the shape; the alias serves `workout` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IWorkout = ILegacyWorkout.IParams;

  /**
   * The parameters of `ropeSkip`: `IAutoMovieMotionHumanRopeSkip.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanRopeSkip.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRopeSkip.IParams` owns the shape; the alias serves `ropeSkip` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IRopeSkip = IAutoMovieMotionHumanRopeSkip.IParams;

  /**
   * The parameters of `lineWalk`: `IAutoMovieMotionHumanLineWalk.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanLineWalk.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanLineWalk.IParams` owns the shape; the alias serves `lineWalk` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ILineWalk = IAutoMovieMotionHumanLineWalk.IParams;

  /**
   * The parameters of `stiltWalk`: `IAutoMovieMotionHumanStiltWalk.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanStiltWalk.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanStiltWalk.IParams` owns the shape; the alias serves `stiltWalk` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IStiltWalk = IAutoMovieMotionHumanStiltWalk.IParams;
}
