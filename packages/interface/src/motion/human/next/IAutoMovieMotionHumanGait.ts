import type { IAutoMovieMotionHumanRun } from "../actions/IAutoMovieMotionHumanRun";
import type { IAutoMovieMotionHumanWalkParams } from "../actions/IAutoMovieMotionHumanWalkParams";
import type { IAutoMovieMotionHumanCarry } from "../carrying/IAutoMovieMotionHumanCarry";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanApproach } from "../everyday/IAutoMovieMotionHumanApproach";
import type { IAutoMovieMotionHumanProxemics } from "../everyday/IAutoMovieMotionHumanProxemics";
import type { IAutoMovieMotionHumanDrillRegulation } from "../lexicon/IAutoMovieMotionHumanDrillRegulation";
import type { IAutoMovieMotionHumanPursuit } from "../lexicon/IAutoMovieMotionHumanPursuit";
import type { IAutoMovieMotionHumanTravelDoor } from "../lexicon/IAutoMovieMotionHumanTravelDoor";
import type { IAutoMovieMotionHumanGaitAided } from "./IAutoMovieMotionHumanGaitAided";
import type { IAutoMovieMotionHumanGaitStyled } from "./IAutoMovieMotionHumanGaitStyled";

/**
 * The gaits: walking and running to a floor point, travel relative to a person, passing an opening and walking with a load, with the styled gaits (`IAutoMovieMotionHumanGaitStyled`) and the aided walks (`IAutoMovieMotionHumanGaitAided`), which run the walk's stepping plan.
 *
 * Every gait shares one speed model: a pace is a Froude number `Fr` and the speed is `v = sqrt(Fr g l)` for the hip height `l` (`walk.FROUDE`, `run.GAITS`): a body with a longer leg is faster by the square root of `l`, its step is longer by `l` and its steps a minute fall by the square root of `l`. Every speed and steps a minute stated on these types is at the reference hip, 0.93 m (`walkRoot.REFERENCE_HIP`). `stride` changes the step and the steps a minute inversely and leaves the speed; `manner.pace` multiplies the speed (`IAutoMovieMotionManner.pace`).
 *
 * `WalkPace` and `RunPace` name the closed paces. A style that fixes more than the pace is a preset, data spread into `walk`'s parameters beside the destination: `AutoMovieMotionHumanGait.STROLL`, `HURRY` and `TRUDGE` (`IStridePreset`) and `SWAGGER` (`ICarriagePreset`); a preset adds no method. The approach has presets too: `FOLLOW` and `ESCORT` (`ITrackingApproachPreset`) and `CONFRONT` (`IFacingApproachPreset`). A jog and a sprint fix only the run's pace, so they are `pace: "jog"` and `pace: "sprint"`, with no preset.
 *
 * Every method appends its action to the chain and returns the chain. Its `anchor` is the action's id, unique in the composition, which another action syncs to (`sync({ of })`) or is cut on (`until({ of, event })`).
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family, its two sub-interfaces, the speed model and the reference hip of every stated speed, the presets and their types, and what every method returns and what its anchor is.
 * @evidence contracts/development/design.md#principled-representation One method per gait law, each taking the law's own parameter type, over the one speed model of the walk's stepping plan.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The gait laws of the walk family: walk, run, approach, carryLoad, the pursuit laws, the door, the aided walks and the styled gaits.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; no gait has a method of its own that only respells a pace.
 */
export interface IAutoMovieMotionHumanGait<Chain>
  extends
    IAutoMovieMotionHumanGaitStyled<Chain>,
    IAutoMovieMotionHumanGaitAided<Chain> {
  /**
   * Walk in whole steps through `via` to `to` and stop with the feet side by
   * side, facing `face` or along the last leg. The pace fixes the speed by the
   * family's speed model, and no step is longer than the pace allows, so the
   * step count rounds up.
   *
   * @param params The destination, way, pace, Effort scales, manner, formation slot, beat and moving support.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the walk appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the walk does, where and how it ends, what fixes its speed and step count, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.walk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.walk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.walk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.walk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.walk is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.walk is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  walk(params: IAutoMovieMotionHumanGait.IWalk, anchor?: string): Chain;

  /**
   * Run through `via` to `to` at a jog, a run or a sprint, both feet leaving
   * the floor once a step, and stop at `to`, facing `face` or along the last
   * leg. The pace fixes the speed and the share of each stride a foot is
   * down (`IAutoMovieMotionHumanRun`).
   *
   * @param params The destination, way, pace, Effort scales and manner.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the run appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the run does, where it ends, what the pace fixes, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.run is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.run is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.run is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.run is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.run is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.run is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  run(params: IAutoMovieMotionHumanGait.IRun, anchor?: string): Chain;

  /**
   * Walk straight at a person, a prop or a point and stop facing it, the front
   * of the chest `at` short of it: a proxemic band or metres. The target is
   * read where it is at the start, or followed to where a person comes to
   * rest (`track`). An approach always walks; a charge is a `run`.
   *
   * @param params The target, gap, side, pace, movement quality, manner, people to walk round and tracking.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the approach appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the approach does, where it stops, how the target is read, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.approach is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.approach is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.approach is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.approach is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.approach is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.approach is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  approach(params: IAutoMovieMotionHumanGait.IApproach, anchor?: string): Chain;

  /**
   * Walk to `to` with a load in one hand, a box in both, a child on the hip,
   * or a cart pushed by its handle, and stop holding it. The loaded arms stop
   * swinging, a held load slows the walk and leans the trunk by its mass, and
   * the steps are the walk's.
   *
   * @param params The destination, the hold, the loaded side, the load's mass share, the pace and the manner.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the carry appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the carry does, how it ends, what the load changes, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.carryLoad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.carryLoad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.carryLoad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.carryLoad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.carryLoad is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.carryLoad is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  carryLoad(
    params: IAutoMovieMotionHumanGait.ICarryLoad,
    anchor?: string,
  ): Chain;

  /**
   * Run straight to where a moving person will be when the runner gets there
   * and stop at arm's length of that place, facing it. The person is read
   * from their placed actions, so they are composed first; a pace that does
   * not close on them is refused.
   *
   * @param params The person headed off and the run's pace.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the interception appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the interception does, where it stops, what it reads, its refusal, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.intercept is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.intercept is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.intercept is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.intercept is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.intercept is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.intercept is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  intercept(
    params: IAutoMovieMotionHumanGait.IIntercept,
    anchor?: string,
  ): Chain;

  /**
   * Run straight away from a person, read where they are when the flight
   * begins, for `metres` and stop there facing away.
   *
   * @param params The person fled from, the distance and the run's pace.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the flight appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the flight does, how far it goes and where it stops, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.flee is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.flee is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.flee is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.flee is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.flee is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.flee is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  flee(params: IAutoMovieMotionHumanGait.IFlee, anchor?: string): Chain;

  /**
   * Square up on a named opening of an obstacle, pass through its middle
   * upright, ducking, side-on or crawling prone, and stop one step beyond it.
   * An opening narrower or lower than the posed body is refused with the
   * measure it needs; a crawl is entered prone.
   *
   * @param params The obstacle, its opening, the posture and the walk's pace.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the passage appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the passage does, where it ends, its refusal and entry condition, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGait.travelDoor is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGait.travelDoor is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGait.travelDoor is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGait.travelDoor is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGait.travelDoor is provided by the chain that implements IAutoMovieMotionHumanGait.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGait.travelDoor is provided by the chain that implements IAutoMovieMotionHumanGait.
   */
  travelDoor(
    params: IAutoMovieMotionHumanGait.ITravelDoor,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Gait methods.
 */
export namespace IAutoMovieMotionHumanGait {
  /**
   * The parameters of `walk`: the walk law's own `IAutoMovieMotionHumanWalkParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanWalkParams` owns the type; the alias serves this family's `walk` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `walk` takes the type its law reads.
   */
  export type IWalk = IAutoMovieMotionHumanWalkParams;

  /**
   * The parameters of `run`: the run law's own `IAutoMovieMotionHumanRun.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanRun` owns the type; the alias serves this family's `run` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `run` takes the type its law reads.
   */
  export type IRun = IAutoMovieMotionHumanRun.IParams;

  /**
   * The parameters of `approach`: the law's own `IAutoMovieMotionHumanApproach.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanApproach` owns the type; the alias serves this family's `approach` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `approach` takes the type its law reads.
   */
  export type IApproach = IAutoMovieMotionHumanApproach.IParams;

  /**
   * The parameters of `carryLoad`: the carry law's own `IAutoMovieMotionHumanCarry.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCarry` owns the type; the alias serves this family's `carryLoad` signature, the carry law exported under that name.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `carryLoad` takes the type its law reads.
   */
  export type ICarryLoad = IAutoMovieMotionHumanCarry.IParams;

  /**
   * The parameters of `intercept`: the pursuit law's own `IAutoMovieMotionHumanPursuit.IIntercept`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPursuit` owns the type; the alias serves this family's `intercept` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `intercept` takes the type its law reads.
   */
  export type IIntercept = IAutoMovieMotionHumanPursuit.IIntercept;

  /**
   * The parameters of `flee`: the pursuit law's own `IAutoMovieMotionHumanPursuit.IFlee`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPursuit` owns the type; the alias serves this family's `flee` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `flee` takes the type its law reads.
   */
  export type IFlee = IAutoMovieMotionHumanPursuit.IFlee;

  /**
   * The parameters of `travelDoor`: the law's own `IAutoMovieMotionHumanTravelDoor.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTravelDoor` owns the type; the alias serves this family's `travelDoor` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `travelDoor` takes the type its law reads.
   */
  export type ITravelDoor = IAutoMovieMotionHumanTravelDoor.IParams;

  /**
   * The closed paces of the walk, `slow`, `normal` and `fast`, each a Froude
   * number of the speed model (`walk.FROUDE`). Each pace's speed and steps a
   * minute are on `IAutoMovieMotionHumanWalkParams.pace`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three paces, the constant that gives each its Froude number and where each pace's result is documented.
   * @evidence contracts/development/design.md#principled-representation A closed string union, so only the walk's paces are admitted; a pace's Froude number and speed are the walk law's (`walk.FROUDE`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the paces; the walk, the approach, the load carry and the door read them for their `pace` members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the parameter types read this named union instead of restating or indexing it.
   */
  export type WalkPace = "slow" | "normal" | "fast";

  /**
   * The closed paces of the run, `jog`, `run` and `sprint`, each a duty factor
   * and a Froude number of the speed model (`run.GAITS`). Each pace's speed
   * and steps a minute are on `IAutoMovieMotionHumanRun.IParams.pace`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three paces, the constant that gives each its duty factor and Froude number and where each pace's result is documented.
   * @evidence contracts/development/design.md#principled-representation A closed string union, so only the run's paces are admitted; a pace's duty factor, Froude number and speed are the run law's (`run.GAITS`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the paces; the run and the pursuit laws read them for their `pace` members.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the parameter types read this named union instead of restating or indexing it.
   */
  export type RunPace = "jog" | "run" | "sprint";

  /**
   * A walk preset that fixes the pace, the step-length scale and the
   * arm-swing scale: the stroll, the hurry and the trudge. Spread into
   * `walk`'s parameters with the destination; each value means what the
   * walk's member of the same name does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, which presets use it, how it is applied and where its members' meanings are.
   * @evidence contracts/development/design.md#principled-representation Three required members with the walk's own units and ranges, so a preset always fixes exactly these three and the walk keeps every other default.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `AutoMovieMotionHumanGait.STROLL`, `HURRY` and `TRUDGE` are its data and the stroll, hurry and trudge rows read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the members are named once here instead of an inline pick of the walk's parameters.
   */
  export interface IStridePreset {
    /** The walk's pace. */
    pace: WalkPace;

    /** The step-length scale, in [0.6, 1.3], as `IAutoMovieMotionHumanWalkParams.stride`. */
    stride: number;

    /** The arm-swing scale, in [0, 2], as `IAutoMovieMotionHumanWalkParams.armSwing`. */
    armSwing: number;
  }

  /**
   * A walk preset that fixes the pace, the arm-swing scale and the elbows'
   * spread: the swagger. Spread into `walk`'s parameters with the
   * destination; each value means what the walk's member of the same name
   * does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, which preset uses it, how it is applied and where its members' meanings are.
   * @evidence contracts/development/design.md#principled-representation Three required members with the walk's own units and ranges, so the preset always fixes exactly these three and the walk keeps every other default.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `AutoMovieMotionHumanGait.SWAGGER` is its data and the swagger row reads it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the members are named once here instead of an inline pick of the walk's parameters.
   */
  export interface ICarriagePreset {
    /** The walk's pace. */
    pace: WalkPace;

    /** The arm-swing scale, in [0, 2], as `IAutoMovieMotionHumanWalkParams.armSwing`. */
    armSwing: number;

    /** The elbows held out from the body, degrees in [0, 30], as `IAutoMovieMotionHumanWalkParams.elbows`. */
    elbows: number;
  }

  /**
   * The side of a person an approach comes to: `front`, `left`, `right` or `behind`, as `IAutoMovieMotionHumanApproach.IParams.from`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the four sides and the member that reads them.
   * @evidence contracts/development/design.md#principled-representation A closed string union of the body-relative sides, so only a side of the person is admitted.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the approach presets that fix a side; the approach's `from` takes the same four.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the preset type reads this named union instead of an indexed access onto the approach's parameters.
   */
  export type ApproachSide = "front" | "left" | "right" | "behind";

  /**
   * Whether an approach follows a person where they go: `true` stops at the place they come to rest, `"pace"` also matches their speed on the way, and `false` reads them once where they are when it begins; as `IAutoMovieMotionHumanApproach.IParams.track`, whose result is stated there.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three modes and the member that reads them.
   * @evidence contracts/development/design.md#principled-representation A closed union of the tracking modes the approach admits.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the approach presets that fix tracking; the approach's `track` takes the same modes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the preset type reads this named union instead of an inline union.
   */
  export type ApproachTrack = boolean | "pace";

  /**
   * An approach preset that fixes the side, the distance and whether the walk tracks the person: the follow and the escort. Spread into `approach`'s parameters with the person; each value means what the approach's member of the same name does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, which presets use it, how it is applied and where its members' meanings are.
   * @evidence contracts/development/design.md#principled-representation Three required members with the approach's own units, so a preset always fixes exactly these three and the approach keeps every other default.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `AutoMovieMotionHumanGait.FOLLOW` and `ESCORT` are its data and the follow and escort rows read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the members are named once here instead of an inline pick of the approach's parameters.
   */
  export interface ITrackingApproachPreset {
    /** The side of the person the walker comes to. */
    from: ApproachSide;

    /** The distance the walker stops at: a proxemic band of `IAutoMovieMotionHumanProxemics`. */
    at: IAutoMovieMotionHumanProxemics.Band;

    /** Whether, and how, the walker keeps up with the person while they move. */
    track: ApproachTrack;
  }

  /**
   * An approach preset that fixes the side and the distance: the confrontation. Spread into `approach`'s parameters with the person; each value means what the approach's member of the same name does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, which preset uses it, how it is applied and where its members' meanings are.
   * @evidence contracts/development/design.md#principled-representation Two required members with the approach's own units, so the preset always fixes exactly these two and the approach keeps every other default.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; `AutoMovieMotionHumanGait.CONFRONT` is its data and the confront row reads it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the members are named once here instead of an inline pick of the approach's parameters.
   */
  export interface IFacingApproachPreset {
    /** The side of the person the walker comes to. */
    from: ApproachSide;

    /** The distance the walker stops at: a proxemic band of `IAutoMovieMotionHumanProxemics`. */
    at: IAutoMovieMotionHumanProxemics.Band;
  }
}

/**
 * The parameters of the styled gaits: named ways of going somewhere on foot,
 * whose destination the composition gives. The speed model and the walk
 * presets (`stroll`, `hurry`, `trudge`, `swagger`) are on the Gait family
 * (`IAutoMovieMotionHumanGait<Chain>`, above).
 *
 * A styled gait has a speed no pace has. It runs the walk's stepping plan in
 * a gait of its own, as the run does, and counts as a walk wherever actions
 * are told apart by kind:
 *
 * - `march` keeps the drill regulation's cadence and step, 120 steps a
 *   minute and 30 inches (0.762 m) in quick time, the same step for every
 *   marcher (US Army TC 3-21.5). The cadence governs: the way is covered in
 *   the whole number of steps nearest it in drill steps, so over a way that
 *   is not a whole number of them the step gives and the cadence stays.
 * - `doubleTime` keeps 180 steps a minute on the same step, which is a
 *   jog's speed, so it is run in the jog's gait with the count kept.
 * - `prowl` is the sneak on deeply bent knees; `sad` and `proud` carry a
 *   mood in speed, arm swing and trunk; `limp` spares one leg, standing on
 *   it briefly; `drunk` is slow, unsteady in time and wanders off its line.
 *   All provisional, each constant saying what was read and what was not.
 * - `sneak` goes slower than the slow walk on shorter steps, with the
 *   pelvis lowered and the arms held close (provisional values; no study of
 *   stealthy gait has been read).
 *
 * @evidence contracts/development/common.md#meaningful-documentation regulation: The drill regulation (`HUMAN_DRILL_CADENCES`); TC 3-21.5's quick time (`MARCH`) when absent. time: The regulation's time by its own name (`ordinary`, `quick`...); its first time when absent. side: The leg spared; the right when absent.
 * @evidence contracts/development/design.md#principled-representation regulation: The drill regulation (`HUMAN_DRILL_CADENCES`); TC 3-21.5's quick time (`MARCH`) when absent. time: The regulation's time by its own name (`ordinary`, `quick`...); its first time when absent. side: The leg spared; the right when absent.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanGait.ts (HumanGait.march, context); lexicon/HumanGait.ts (regulated, params); lexicon/HumanGait.ts (HumanGait.doubleTime, context); lexicon/HumanGait.ts (HumanGait.sad, context); lexicon/HumanGait.ts (HumanGait.proud, context); lexicon/HumanGait.ts (HumanGait.drunk, context).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkParams, IAutoMovieMotionHumanDrillRegulation.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
 */
export namespace IAutoMovieMotionHumanGait {
  /**
   * What a styled gait leaves to the composition: the walk's destination, waypoints, arrival heading and elbows.
   *
   * @evidence contracts/development/common.md#meaningful-documentation What a styled gait leaves to the composition: the walk's destination, waypoints, arrival heading and elbows.
   * @evidence contracts/development/design.md#principled-representation Closed choices "pace", "stride", "armSwing" distinguish the admitted cases.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanGait.ts (HumanGait.doubleTime, context); lexicon/HumanGait.ts (HumanGait.sad, context); lexicon/HumanGait.ts (HumanGait.proud, context); lexicon/HumanGait.ts (HumanGait.drunk, context); lexicon/HumanGait.ts (mood, context); lexicon/HumanGait.ts (distance, context).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanWalkParams identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export type IParams = Omit<
    IAutoMovieMotionHumanWalkParams,
    "pace" | "stride" | "armSwing"
  >;

  /**
   * What a march leaves to the composition: the walk's, and the regulation and time it marches at.
   *
   * @evidence contracts/development/common.md#meaningful-documentation regulation: The drill regulation (`HUMAN_DRILL_CADENCES`); TC 3-21.5's quick time (`MARCH`) when absent. time: The regulation's time by its own name (`ordinary`, `quick`...); its first time when absent.
   * @evidence contracts/development/design.md#principled-representation regulation: The drill regulation (`HUMAN_DRILL_CADENCES`); TC 3-21.5's quick time (`MARCH`) when absent. time: The regulation's time by its own name (`ordinary`, `quick`...); its first time when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanGait.ts (HumanGait.march, context); lexicon/HumanGait.ts (regulated, params); lexicon/HumanGait.ts (HumanGait.march).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares the canonical IAutoMovieMotionHumanDrillRegulation.Name identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
   */
  export interface IMarch extends IAutoMovieMotionHumanGait.IParams {
    /** The drill regulation (`HUMAN_DRILL_CADENCES`); TC 3-21.5's quick time (`MARCH`) when absent. */
    regulation?: IAutoMovieMotionHumanDrillRegulation.Name;

    /** The regulation's time by its own name (`ordinary`, `quick`...); its first time when absent. */
    time?: string;
  }

  /**
   * What a limp leaves to the composition: the walk's, and the leg spared.
   *
   * @evidence contracts/development/common.md#meaningful-documentation side: The leg spared; the right when absent.
   * @evidence contracts/development/design.md#principled-representation side: The leg spared; the right when absent.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Runtime boundary references: lexicon/HumanGait.ts (HumanGait.stiffLimp, context); lexicon/HumanGait.ts (HumanGait.limp, context); lexicon/HumanGait.ts (HumanGait.stiffLimp); lexicon/HumanGait.ts (HumanGait.limp).
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literal values are declared here directly; runtime handling remains in HumanGait.stiffLimp.
   */
  export interface ILimp extends IAutoMovieMotionHumanGait.IParams {
    /** The leg spared; the right when absent. */
    side?: AutoMovieHumanSide;
  }
}
