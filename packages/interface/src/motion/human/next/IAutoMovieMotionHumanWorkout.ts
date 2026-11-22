import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanExercise } from "../exercise/IAutoMovieMotionHumanExercise";
import type { IAutoMovieMotionHumanLineWalk } from "../exercise/IAutoMovieMotionHumanLineWalk";
import type { IAutoMovieMotionHumanRopeSkip } from "../exercise/IAutoMovieMotionHumanRopeSkip";
import type { IAutoMovieMotionHumanStiltWalk } from "../exercise/IAutoMovieMotionHumanStiltWalk";
import type { IAutoMovieMotionHumanStretch } from "../exercise/IAutoMovieMotionHumanStretch";
import type { IAutoMovieMotionHumanWorkoutBodyweight } from "../exercise/IAutoMovieMotionHumanWorkoutBodyweight";
import type { IAutoMovieMotionHumanWorkoutDance } from "../exercise/IAutoMovieMotionHumanWorkoutDance";
import type { IAutoMovieMotionHumanWorkoutEquipment } from "../exercise/IAutoMovieMotionHumanWorkoutEquipment";
import type { IAutoMovieMotionHumanWorkoutFloor } from "../exercise/IAutoMovieMotionHumanWorkoutFloor";
import type { IAutoMovieMotionHumanWorkoutGym } from "../exercise/IAutoMovieMotionHumanWorkoutGym";
import type { IAutoMovieMotionHumanWorkoutHanging } from "../exercise/IAutoMovieMotionHumanWorkoutHanging";
import type { IAutoMovieMotionHumanWorkoutLoad } from "../exercise/IAutoMovieMotionHumanWorkoutLoad";
import type { IAutoMovieMotionHumanWorkoutLying } from "../exercise/IAutoMovieMotionHumanWorkoutLying";
import type { IAutoMovieMotionHumanWorkoutPoses } from "../exercise/IAutoMovieMotionHumanWorkoutPoses";
import type { IAutoMovieMotionHumanWorkoutStanding } from "../exercise/IAutoMovieMotionHumanWorkoutStanding";

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
   * @param params The `kind`, `reps`, `hold`, `on`, `stay`, `load` and `manner` of `IAutoMovieMotionHumanWorkout.IParams`.
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
  export type IWorkout = IAutoMovieMotionHumanWorkout.IParams;

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

/**
 * An exercise, a stretch or a pose done on a support that is not only the
 * feet, or with the feet kept under a moving trunk: the body gets from
 * standing into the exercise's first posture, passes through the postures
 * of each repetition, and gets up again (#3377, #3378).
 *
 * The physics is kinematic and stated: every posture is a set of joint
 * angles and a whole-body tilt (`WorkoutKind`, `ExerciseKey`), passed
 * through in joint space on minimum-jerk progress, and the body is placed
 * by what bears it. The bones that bear (the toes of a push-up, the hands
 * on a bar, the pelvis on a bench, the feet of a squat) keep their mean
 * place, so the body pivots about its support and rises by what its limbs
 * shorten. Hands that bear on the floor are laid there by the arm's solve
 * and stay. Nothing is integrated: no force, no load and no balance check
 * decides a posture.
 *
 * Events: `enter`; for each repetition `r` the kind's own pairs (such as
 * `lower1`, `bottom1`, `press1`, `top1`; `reach1`, `reachEnd1` for a held
 * pose); `release` and `relax`. With `stay`, the body is left on its
 * support and the plan declares that base.
 *
 * First pass limits: the way down from standing and back is a blend of the
 * two postures with the root carried between them and kept above the floor,
 * so the feet slide while it lasts and no hand helps; equipment (bars,
 * benches, machines, ropes) is not shown and nothing is held; a kind's own
 * table states which of its supports are kept by angles alone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation count: Repetitions; the kind's own count when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. hold: Seconds a held pose is stayed in; the kind's own when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. on: The prop the body bears on, by one of its affordances: a bench's `surface` under a kind that lies or sits raised, a bar's `bar` between the hands of a hanging kind, which hangs from nothing else. Its place when the action starts replaces the height the kind computes from the body, and the body goes to it. None when absent.
 * @evidence contracts/development/design.md#principled-representation count: Repetitions; the kind's own count when absent. Numeric representation: "uint32". Inclusive minimum: 1. Unit: dimensionless. Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. hold: Seconds a held pose is stayed in; the kind's own when absent. Inclusive minimum: 0. Unit: "s". Admission metadata is enforced by HumanPerformanceParams for generated action and row schemas. on: The prop the body bears on, by one of its affordances: a bench's `surface` under a kind that lies or sits raised, a bar's `bar` between the hands of a hanging kind, which hangs from nothing else. Its place when the action starts replaces the height the kind computes from the body, and the body goes to it. None when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/workout.ts (workout.plan, context); exercise/workout.ts (workout.KINDS); exercise/workout.ts (workout.plan).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWorkoutFloor.Name, IAutoMovieMotionHumanWorkoutEquipment.Name, IAutoMovieMotionHumanWorkoutGym.Name, IAutoMovieMotionHumanWorkoutBodyweight.Name, IAutoMovieMotionHumanWorkoutLying.Name, IAutoMovieMotionHumanWorkoutStanding.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanWorkout {
  /**
   * An exercise's name.
   *
   * @evidence contracts/development/common.md#meaningful-documentation An exercise's name.
   * @evidence contracts/development/design.md#principled-representation Workout names are the union of the floor, equipment, gym, bodyweight, lying and standing vocabularies; those owners define the routines rather than a second copied string list.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: exercise/workout.ts (workout.KINDS).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWorkoutFloor.Name, IAutoMovieMotionHumanWorkoutEquipment.Name, IAutoMovieMotionHumanWorkoutGym.Name, IAutoMovieMotionHumanWorkoutBodyweight.Name, IAutoMovieMotionHumanWorkoutLying.Name, IAutoMovieMotionHumanWorkoutStanding.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type Kind =
    | IAutoMovieMotionHumanWorkoutFloor.Name
    | IAutoMovieMotionHumanWorkoutEquipment.Name
    | IAutoMovieMotionHumanWorkoutGym.Name
    | IAutoMovieMotionHumanWorkoutBodyweight.Name
    | IAutoMovieMotionHumanWorkoutLying.Name
    | IAutoMovieMotionHumanWorkoutStanding.Name
    | IAutoMovieMotionHumanWorkoutPoses.Name
    | IAutoMovieMotionHumanWorkoutHanging.Name
    | IAutoMovieMotionHumanWorkoutDance.Name;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The exercise, the count, the hold, the prop borne and whether the body stays down.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The kind is a closed union; no angle is typed by the author.
   */
  export interface IParams {
    /** The exercise. */
    kind: IAutoMovieMotionHumanWorkout.Kind;

    /** Repetitions, a whole number of at least 1; the kind's own count when absent. */
    count?: number;

    /** Seconds a held pose is stayed in, at least 0; the kind's own when absent. */
    hold?: number;

    /** The prop the body bears on, by one of its affordances: a bench's `surface` under a kind that lies or sits raised, a bar's `bar` between the hands of a hanging kind, which hangs from nothing else. Its place when the action starts replaces the height the kind computes from the body, and the body goes to it. None when absent. */
    on?: {
      /** Scene subject id of the exercise support prop. */
      prop: string;
      /** Affordance id on that prop used for the first contact. */
      affordance: string;
      /** Optional second support affordance id on the same prop; omitted uses the single-contact case. */
      other?: string;
    };

    /** Whether the body stays on its support at the end instead of standing up; `false` when absent. */
    stay?: boolean;

    /** The prop the exercise is done with, already held (`WorkoutLoad`); none when absent. */
    load?: IAutoMovieMotionHumanWorkoutLoad.IParams;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }
}
