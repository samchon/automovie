import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanCrossing } from "./IAutoMovieMotionHumanCrossing";

/**
 * Bathing composed from shipped actions (#3995): getting into and out of a bathtub, washing under a shower and drying with a towel. Each method appends shipped step-over, sit, rise, operate, touch and pickup actions, so they are fitted, refused and checked as those actions are.
 *
 * - Into the tub: step over its apron onto its floor, turn along the tub and sit on its floor with the legs long; out by stepping over the apron from inside onto the floor outside.
 * - Shower: turn the tap's knob on, scrub the scalp with both hands, the face and each forearm with the other hand, then turn it off.
 * - Towel: take the towel and rub it over the scalp with both hands.
 *
 * Each region is rubbed in 4 strokes, the tap knob turns a quarter turn (90 degrees) and the bather soaks 3 s in the tub (all provisional); the owning constants are `AutoMovieMotionHumanBathing.SCRUBS`, `TAP_TURN` and `SOAK`.
 *
 * Each method is a helper over a chain: it takes the chain first and returns it with the actions appended, as the runtime namespace takes it.
 *
 * @template Chain The chain every method takes and returns.
 * @evidence contracts/development/common.md#meaningful-documentation States the order of each act and the provisional counts.
 * @evidence contracts/development/design.md#principled-representation One method per helper of the Bathing behaviour, each taking one named parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Only the compositions the bathroom scenes use.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No posture is authored here; the composed actions plan and refuse.
 */
export interface IAutoMovieMotionHumanBathing<Chain> {
  /**
   * Step over the tub's apron onto its floor, turn along the tub with a few steps on that floor, and sit down on it with the legs long, as one sits in a bath.
   * @param chain The chain the helper appends to; it is returned with the actions added.
   * @param params The `tub`, `floor`, `at` and `face` of `IAutoMovieMotionHumanBathing.IIntoTub`; the bather stands before the tub's apron.
   * @returns The chain with the entry appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBathing.intoTub is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBathing.intoTub is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBathing.intoTub is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBathing.intoTub is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBathing.intoTub is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBathing.intoTub is provided by the chain that implements IAutoMovieMotionHumanBathing.
   */
  intoTub(chain: Chain, params: IAutoMovieMotionHumanBathing.IIntoTub): Chain;

  /**
   * Step out of the tub over its apron, from standing on its floor facing the apron, onto the floor outside, such as a bath mat.
   * @param chain The chain the helper appends to; it is returned with the actions added.
   * @param params The `tub` and `onto` of `IAutoMovieMotionHumanBathing.IOutOfTub`.
   * @returns The chain with the exit appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBathing.outOfTub is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBathing.outOfTub is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBathing.outOfTub is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBathing.outOfTub is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBathing.outOfTub is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBathing.outOfTub is provided by the chain that implements IAutoMovieMotionHumanBathing.
   */
  outOfTub(chain: Chain, params: IAutoMovieMotionHumanBathing.IOutOfTub): Chain;

  /**
   * Shower: open the tap, wash the scalp, the face and both forearms, close the tap.
   * @param chain The chain the helper appends to; it is returned with the actions added.
   * @param params The `tap` of `IAutoMovieMotionHumanBathing.IShower`.
   * @returns The chain with the wash appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBathing.shower is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBathing.shower is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBathing.shower is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBathing.shower is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBathing.shower is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBathing.shower is provided by the chain that implements IAutoMovieMotionHumanBathing.
   */
  shower(chain: Chain, params: IAutoMovieMotionHumanBathing.IShower): Chain;

  /**
   * Take the towel and dry the scalp with it in both hands.
   * @param chain The chain the helper appends to; it is returned with the actions added.
   * @param params The `towel` and `handle` of `IAutoMovieMotionHumanBathing.ITowelDry`.
   * @returns The chain with the drying appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanBathing.towelDry is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanBathing.towelDry is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanBathing.towelDry is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanBathing.towelDry is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanBathing.towelDry is provided by the chain that implements IAutoMovieMotionHumanBathing.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanBathing.towelDry is provided by the chain that implements IAutoMovieMotionHumanBathing.
   */
  towelDry(chain: Chain, params: IAutoMovieMotionHumanBathing.ITowelDry): Chain;
}

/**
 * The parameter types of the Bathing methods.
 */
export namespace IAutoMovieMotionHumanBathing {
  /**
   * A region one hand scrubs with the other.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each washed region.
   * @evidence contracts/development/design.md#principled-representation The closed set of regions the shower scrubs by hand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the regions `shower` scrubs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The admitted literals are the body's own region names.
   */
  export type IWashed = "face" | "forearmLeft" | "forearmRight";

  /**
   * The parameters of `intoTub`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and units.
   * @evidence contracts/development/design.md#principled-representation The tub, its floor, the sitting place and the heading.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members `intoTub` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The place and heading are the author's world values.
   */
  export interface IIntoTub {
    /** The tub's subject, the obstacle stepped over and the floor walked on. */
    tub: string;

    /** The tub's floor surface inside the apron, where both feet land. */
    floor: string;

    /** Where on the tub's floor the bather sits, world metres. */
    at: IAutoMovieVector3;

    /** The heading the bather sits facing, degrees about +Y: along the tub. */
    face: number;
  }

  /**
   * The parameters of `outOfTub`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The tub and the landing surface.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members `outOfTub` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The landing is the crossing law's own surface type.
   */
  export interface IOutOfTub {
    /** The tub's subject, the obstacle stepped over from inside. */
    tub: string;

    /** The level surface outside the tub both feet land on. */
    onto: IAutoMovieMotionHumanCrossing.ISurface;
  }

  /**
   * The parameters of `shower`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The tap knob the shower turns.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the member `shower` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tap is the shared target type.
   */
  export interface IShower {
    /** The tap knob. */
    tap: IAutoMovieMotionTarget;
  }

  /**
   * The parameters of `towelDry`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The towel and its grip.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members `towelDry` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both are the prop's own names.
   */
  export interface ITowelDry {
    /** The towel's subject. */
    towel: string;

    /** The towel's grip. */
    handle: string;
  }
}
