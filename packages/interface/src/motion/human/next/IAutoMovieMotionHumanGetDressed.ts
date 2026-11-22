import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanBindPartner } from "../dressing/IAutoMovieMotionHumanBindPartner";
import type { IAutoMovieMotionHumanCoatPartner } from "../dressing/IAutoMovieMotionHumanCoatPartner";
import type { IAutoMovieMotionHumanDressPartner } from "../dressing/IAutoMovieMotionHumanDressPartner";
import type { IAutoMovieMotionHumanPlaceOverHead } from "../dressing/IAutoMovieMotionHumanPlaceOverHead";
import type { IAutoMovieMotionHumanPresentHand } from "../dressing/IAutoMovieMotionHumanPresentHand";
import type { IAutoMovieMotionHumanSlipRing } from "../dressing/IAutoMovieMotionHumanSlipRing";

/**
 * Dressing another person, or being dressed by one: binding, coating, ring and garment handovers between a dresser and a partner, and the staged straightening of a tie or a cuff. The laws are planned by the chain between the two bodies; the two helpers append shipped touch actions to the performer's chain, so they are fitted, refused and checked as those actions are.
 *
 * The helpers djustCuff and straightenPartnerTie take the chain first and return it with the actions appended, as the runtime namespace takes it; the laws take their parameters and an anchor.
 *
 * @template Chain The chain every method takes and returns.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law or helper of the GetDressed behaviour, each taking the law's own parameter type or one named parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The partner dressing laws and the two touch helpers, and nothing the Dress family owns.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each law method takes the existing parameter type of its law; the helpers author no posture.
 */
export interface IAutoMovieMotionHumanGetDressed<Chain> {
  /**
   * Bind another performer with a held restraint: handcuffs closed on a wrist and linked to the other wrist, a rope tied round the wrists or the ankles. The binder carries the restraint to the partner's region, it is worn there from the arrival, and the bound parts keep their places within the link's slack until a later grip takes it off.
   *
   * @param params The `hold` and `link` of `IAutoMovieMotionHumanBindPartner`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGetDressed.bindPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGetDressed.bindPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGetDressed.bindPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGetDressed.bindPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGetDressed.bindPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGetDressed.bindPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   */
  bindPartner(params: IAutoMovieMotionHumanGetDressed.IBindPartner, anchor?: string): Chain;

  /**
   * Put a held wearable on another performer: a ring onto a finger, a necklace at the nape, a medal or a flower at the chest, a crown on the head. The dresser carries the item to the partner's region, it is worn there from the arrival, and the hand lets go and returns.
   *
   * @param params The `prop`, `partner`, `region`, `side`, `point` and `hold` of `IAutoMovieMotionHumanDressPartner`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGetDressed.dressPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGetDressed.dressPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGetDressed.dressPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGetDressed.dressPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGetDressed.dressPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGetDressed.dressPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   */
  dressPartner(params: IAutoMovieMotionHumanGetDressed.IDressPartner, anchor?: string): Chain;

  /**
   * Help a partner into a coat: the dresser stands behind, carries the held open-front jacket up to the partner's collar and holds it open while the partner's arms go back into its sleeves, then lets go and the jacket is worn on the partner's chest.
   *
   * @param params The `prop`, `partner`, `hand` and `hold` of `IAutoMovieMotionHumanCoatPartner`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGetDressed.coatPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGetDressed.coatPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGetDressed.coatPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGetDressed.coatPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGetDressed.coatPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGetDressed.coatPartner is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   */
  coatPartner(params: IAutoMovieMotionHumanGetDressed.ICoatPartner, anchor?: string): Chain;

  /**
   * Slip a ring onto a partner's finger: the partner presents a hand, the dresser's other hand holds it from below, and the hand that holds the ring brings its hole onto the fingertip and slides it to the finger's base, where it is worn from then on.
   *
   * @param params The `prop`, `partner`, `hand`, `finger` and `side` of `IAutoMovieMotionHumanSlipRing`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGetDressed.slipRing is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGetDressed.slipRing is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGetDressed.slipRing is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGetDressed.slipRing is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGetDressed.slipRing is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGetDressed.slipRing is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   */
  slipRing(params: IAutoMovieMotionHumanGetDressed.ISlipRing, anchor?: string): Chain;

  /**
   * Present a hand to a partner and keep it there: the upper arm hangs, the forearm comes forward level at the elbow's height and the hand is held out palm down, fingers forward, for a ring to be slipped on or a hand to be kissed, then it returns.
   *
   * @param params The `side` and `hold` of `IAutoMovieMotionHumanPresentHand`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGetDressed.presentHand is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGetDressed.presentHand is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGetDressed.presentHand is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGetDressed.presentHand is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGetDressed.presentHand is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGetDressed.presentHand is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   */
  presentHand(params: IAutoMovieMotionHumanGetDressed.IPresentHand, anchor?: string): Chain;

  /**
   * Set a neck loop over a partner's head with both hands: a ribbon medal over a bowed head, or a necklace from behind a seated partner; the loop is raised above the crown, lowered round the head to the neck and worn on the upper chest, and the hands let go.
   *
   * @param params The `prop`, `partner` and `side` of `IAutoMovieMotionHumanPlaceOverHead`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGetDressed.placeOverHead is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGetDressed.placeOverHead is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGetDressed.placeOverHead is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGetDressed.placeOverHead is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGetDressed.placeOverHead is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGetDressed.placeOverHead is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   */
  placeOverHead(params: IAutoMovieMotionHumanGetDressed.IPlaceOverHead, anchor?: string): Chain;

  /**
   * Straighten a partner's tie, facing them: the flat palm of one hand smooths the tie's front blade along the partner's sternum with one short sweep, read where the partner stands when the touch starts, so the partner is placed first.
   *
   * @param chain The dresser's entry chain.
   * @param params The partner and side of `IAutoMovieMotionHumanGetDressed.IStraightenPartnerTie`.
   * @param anchor A stable cue id for the smoothing action; none when absent.
   * @returns The same kind of chain with one touch appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States whose tie, the gesture, the chosen hand and the cue.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGetDressed.straightenPartnerTie is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGetDressed.straightenPartnerTie is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGetDressed.straightenPartnerTie is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGetDressed.straightenPartnerTie is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGetDressed.straightenPartnerTie is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGetDressed.straightenPartnerTie is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   */
  straightenPartnerTie(chain: Chain, params: IAutoMovieMotionHumanGetDressed.IStraightenPartnerTie, anchor?: string): Chain;

  /**
   * Adjust one's own cuff: the sleeved wrist is presented across the waist and the opposite hand's curled fingertips squeeze the cuff for a brief hold; the wrist is the garment landmark.
   *
   * @param chain The performer's entry chain.
   * @param params The cuff of `IAutoMovieMotionHumanGetDressed.IAdjustCuff`.
   * @param anchor A stable cue id for the adjustment; none when absent.
   * @returns The same kind of chain with one touch appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which wrist is presented, which hand reaches and what the cue identifies.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanGetDressed.adjustCuff is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanGetDressed.adjustCuff is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanGetDressed.adjustCuff is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanGetDressed.adjustCuff is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanGetDressed.adjustCuff is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanGetDressed.adjustCuff is provided by the chain that implements IAutoMovieMotionHumanGetDressed.
   */
  adjustCuff(chain: Chain, params: IAutoMovieMotionHumanGetDressed.IAdjustCuff, anchor?: string): Chain;
}

/**
 * The parameter types of the GetDressed methods.
 */
export namespace IAutoMovieMotionHumanGetDressed {
  /**
   * The parameters of `bindPartner`: `IAutoMovieMotionHumanBindPartner`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanBindPartner`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanBindPartner` owns the shape; the alias serves `bindPartner` of this family without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IBindPartner = IAutoMovieMotionHumanBindPartner;

  /**
   * The parameters of `dressPartner`: `IAutoMovieMotionHumanDressPartner`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanDressPartner`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanDressPartner` owns the shape; the alias serves `dressPartner` of this family without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IDressPartner = IAutoMovieMotionHumanDressPartner;

  /**
   * The parameters of `coatPartner`: `IAutoMovieMotionHumanCoatPartner`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanCoatPartner`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanCoatPartner` owns the shape; the alias serves `coatPartner` of this family without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ICoatPartner = IAutoMovieMotionHumanCoatPartner;

  /**
   * The parameters of `slipRing`: `IAutoMovieMotionHumanSlipRing`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanSlipRing`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSlipRing` owns the shape; the alias serves `slipRing` of this family without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ISlipRing = IAutoMovieMotionHumanSlipRing;

  /**
   * The parameters of `presentHand`: `IAutoMovieMotionHumanPresentHand`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanPresentHand`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPresentHand` owns the shape; the alias serves `presentHand` of this family without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IPresentHand = IAutoMovieMotionHumanPresentHand;

  /**
   * The parameters of `placeOverHead`: `IAutoMovieMotionHumanPlaceOverHead`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanPlaceOverHead`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanPlaceOverHead` owns the shape; the alias serves `placeOverHead` of this family without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IPlaceOverHead = IAutoMovieMotionHumanPlaceOverHead;

  /**
   * The parameters of `straightenPartnerTie`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The partner whose tie is smoothed and the smoothing hand.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the members `straightenPartnerTie` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The partner is a subject name, never a pose.
   */
  export interface IStraightenPartnerTie {
    /** The partner's subject whose tie is straightened. */
    partner: string;

    /** The smoothing hand. */
    side: AutoMovieHumanSide;
  }

  /**
   * The parameters of `adjustCuff`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The side of the sleeve adjusted.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the member `adjustCuff` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The side is the body's own side name.
   */
  export interface IAdjustCuff {
    /** The side of the sleeve being adjusted. */
    cuff: AutoMovieHumanSide;
  }
}
