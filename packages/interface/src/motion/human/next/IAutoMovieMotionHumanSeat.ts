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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSeat.sit is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSeat.sit is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSeat.sit is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSeat.sit is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSeat.sit is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSeat.sit is provided by the chain that implements IAutoMovieMotionHumanSeat.
   */
  sit(params: IAutoMovieMotionHumanSeat.ISit, anchor?: string): Chain;

  /**
   * Standing up from a seat, in the four phases of sit-to-stand (Schenkman, Berger, Riley, Mann and Hodge 1990, Phys Ther 70:638): flexion momentum, where the trunk flexes forward while the seat still bears the weight; momentum transfer at seat-off, where the hips leave the seat and the body moves forward over the feet; extension of the hips and knees; and stabilisation.
   *
   * @param params The `balance`, `to` and `manner` of `IAutoMovieMotionHumanRise.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSeat.rise is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSeat.rise is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSeat.rise is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSeat.rise is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSeat.rise is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSeat.rise is provided by the chain that implements IAutoMovieMotionHumanSeat.
   */
  rise(params: IAutoMovieMotionHumanSeat.IRise, anchor?: string): Chain;

  /**
   * Kneeling from standing: on one knee (half kneel), on both knees upright, or sitting back on the heels, held, then rising the way it went down.
   *
   * @param params The `balance`, `kind`, `knee`, `hold`, `rise`, `at` and `manner` of `IAutoMovieMotionHumanKneel.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSeat.kneel is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSeat.kneel is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSeat.kneel is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSeat.kneel is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSeat.kneel is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSeat.kneel is provided by the chain that implements IAutoMovieMotionHumanSeat.
   */
  kneel(params: IAutoMovieMotionHumanSeat.IKneel, anchor?: string): Chain;

  /**
   * An ankle-over-knee rest after sitting on a chair with both feet down: one ankle lifts over the other knee, rests there and returns.
   *
   * @param params The `side` and `hold` of `IAutoMovieMotionHumanCrossAnkleOverKnee`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSeat.crossAnkleOverKnee is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSeat.crossAnkleOverKnee is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSeat.crossAnkleOverKnee is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSeat.crossAnkleOverKnee is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSeat.crossAnkleOverKnee is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSeat.crossAnkleOverKnee is provided by the chain that implements IAutoMovieMotionHumanSeat.
   */
  crossAnkleOverKnee(
    params: IAutoMovieMotionHumanSeat.ICrossAnkleOverKnee,
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
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanSeat.seatedHeelBounce is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanSeat.seatedHeelBounce is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanSeat.seatedHeelBounce is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanSeat.seatedHeelBounce is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanSeat.seatedHeelBounce is provided by the chain that implements IAutoMovieMotionHumanSeat.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanSeat.seatedHeelBounce is provided by the chain that implements IAutoMovieMotionHumanSeat.
   */
  seatedHeelBounce(
    params: IAutoMovieMotionHumanSeat.ISeatedHeelBounce,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Seat methods.
 */
export namespace IAutoMovieMotionHumanSeat {
  /**
   * The parameters of `sit`: `IAutoMovieMotionHumanSit.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanSit.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSit.IParams` owns the shape; the alias serves `sit` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ISit = IAutoMovieMotionHumanSit.IParams;

  /**
   * The parameters of `rise`: `IAutoMovieMotionHumanRise.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanRise.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRise.IParams` owns the shape; the alias serves `rise` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IRise = IAutoMovieMotionHumanRise.IParams;

  /**
   * The parameters of `kneel`: `IAutoMovieMotionHumanKneel.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanKneel.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKneel.IParams` owns the shape; the alias serves `kneel` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IKneel = IAutoMovieMotionHumanKneel.IParams;

  /**
   * The parameters of `crossAnkleOverKnee`: the law's own `IAutoMovieMotionHumanCrossAnkleOverKnee`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCrossAnkleOverKnee` owns the type; the alias serves this family's `crossAnkleOverKnee` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `crossAnkleOverKnee` takes the type its law reads.
   */
  export type ICrossAnkleOverKnee = IAutoMovieMotionHumanCrossAnkleOverKnee;

  /**
   * The parameters of `seatedHeelBounce`: the law's own `IAutoMovieMotionHumanSeatedHeelBounce`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSeatedHeelBounce` owns the type; the alias serves this family's `seatedHeelBounce` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `seatedHeelBounce` takes the type its law reads.
   */
  export type ISeatedHeelBounce = IAutoMovieMotionHumanSeatedHeelBounce;

  /**
   * The kind, hold and rise that a named kneel fixes: the `kind`, `hold` and `rise` of `kneel`. Spread into `kneel`'s parameters; `AutoMovieMotionHumanSeat.TAKE_A_KNEE`, `KNEEL_BRIEFLY` and `KNEEL_SIT` are its data and the rows of the same names read them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, which presets use it, how it is applied and where the members' meanings are.
   * @evidence contracts/development/design.md#principled-representation The kneel law's own members, so a preset fixes only the values its row means and the law keeps every other default.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `kneel` owns the members' meanings.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the type names the pick of `kneel`'s own members and redefines none.
   */
  export type IKneelPreset = Pick<IKneel, "kind" | "hold" | "rise">;
}
