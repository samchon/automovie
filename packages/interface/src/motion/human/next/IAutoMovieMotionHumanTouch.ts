import type { IAutoMovieQuaternion } from "../../../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../../../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { AutoMovieHumanoidBone } from "../../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanBody } from "../body/IAutoMovieMotionHumanBody";
import type { IAutoMovieMotionClock } from "../compose/IAutoMovieMotionClock";
import type { IAutoMovieMotionHumanArmAngles } from "../compose/IAutoMovieMotionHumanArmAngles";
import type { IAutoMovieMotionHumanArmPlanned } from "../compose/IAutoMovieMotionHumanArmPlanned";
import type { IAutoMovieMotionHumanTarget } from "../compose/IAutoMovieMotionHumanTarget";
import type { IAutoMovieMotionHumanTouchContacts } from "../compose/IAutoMovieMotionHumanTouchContacts";
import type { IAutoMovieMotionHumanTouchEffector } from "../compose/IAutoMovieMotionHumanTouchEffector";
import type { IAutoMovieMotionHumanTouchForm } from "../compose/IAutoMovieMotionHumanTouchForm";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanHeldUse } from "../handling/IAutoMovieMotionHumanHeldUse";
import type { IAutoMovieMotionHumanActionPlan } from "../law/IAutoMovieMotionHumanActionPlan";
import type { IAutoMovieMotionHumanBalance } from "../law/IAutoMovieMotionHumanBalance";
import type { IAutoMovieMotionHumanContactWindow } from "../law/IAutoMovieMotionHumanContactWindow";
import type { IAutoMovieHumanLimbGoal } from "../posture/IAutoMovieHumanLimbGoal";
import type { IAutoMovieMotionHumanPosture } from "../posture/IAutoMovieMotionHumanPosture";
import type { IAutoMovieMotionHumanBackToBack } from "../touch/IAutoMovieMotionHumanBackToBack";
import type { IAutoMovieMotionHumanEmbraceFromBehind } from "../touch/IAutoMovieMotionHumanEmbraceFromBehind";
import type { IAutoMovieMotionHumanHeadRest } from "../touch/IAutoMovieMotionHumanHeadRest";
import type { IAutoMovieMotionHumanHighFive } from "../touch/IAutoMovieMotionHumanHighFive";
import type { IAutoMovieMotionHumanKiss } from "../touch/IAutoMovieMotionHumanKiss";
import type { IAutoMovieMotionHumanLegTouch } from "../touch/IAutoMovieMotionHumanLegTouch";
import type { IAutoMovieMotionHumanSitOnLap } from "../touch/IAutoMovieMotionHumanSitOnLap";
import type { IAutoMovieMotionHumanTouchEffectors } from "../touch/IAutoMovieMotionHumanTouchEffectors";
import type { IAutoMovieMotionHumanTouchSite } from "../touch/IAutoMovieMotionHumanTouchSite";

/**
 * Touching a partner: a touch, a high five, a kiss and a leg touch.
 *
 * The family carries its fixed-parameter touches as presets, data on `AutoMovieMotionHumanTouch`: the touch kinds `TAP`, `PAT`, `STROKE`, `RUB`, `PRESS`, `SQUEEZE`, `HOLD` and `SCRATCH`, read by the rows of `HumanTouchRows`; the emblems `EMBLEM_SALUTE`, `EMBLEM_HAND_ON_HEART`, `EMBLEM_BLOWN_KISS_SEND`, `EMBLEM_COVER_MOUTH` and `EMBLEM_COVER_EARS`, read by the rows of `HumanEmblem`; the social touches `SOCIAL_SHOULDER_PAT`, `SOCIAL_COMFORT` and `SOCIAL_FIRM_PRESS`, read by the rows of `HumanSocial`; and `PARTNER_DANCE_HOLD`, read by the row of `HumanPartner`. A preset adds no method and is spread into the parameters of `touch`; each row and its preset share one value.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the Touch family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The Touch laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanTouch<Chain> {
  /**
   * A touch while standing: one hand, or both, laid on a region of a partner or of the performer's own body and moved on it by a kind of social touch; the kinds and their source are on `IAutoMovieMotionHumanTouch`.
   *
   * @param params The `balance`, `target`, `kind`, `with`, `side`, `site`, `prop`, `point`, `grasp`, `clear`, `elbow`, `arms`, `other`, `rests`, `count`, `hold`, `tangent` and `manner` of `IAutoMovieMotionHumanTouch.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.touch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.touch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.touch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.touch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.touch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.touch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  touch(
    params: IAutoMovieMotionHumanTouch.ITouchParams,
    anchor?: string,
  ): Chain;

  /**
   * A high five, a low five or a fist bump between two standing partners: both bring one hand to one shared point between them and meet there at one shared instant (#3284), the mutual goal the handshake uses (`AutoMovieMotionMeeting`).
   *
   * @param params The `partner`, `kind`, `side`, `prop`, `point`, `window` and `at` of `IAutoMovieMotionHumanHighFive.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.highFive is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  highFive(
    params: IAutoMovieMotionHumanTouch.IHighFive,
    anchor?: string,
  ): Chain;

  /**
   * A kiss while standing: the lips brought to a partner's region (a cheek, the forehead, the crown, the lips, the back of a hand) by leaning the body from the hips and flexing the neck, the head turned to one side for a cheek or the lips so the noses stay clear (#3284).
   *
   * @param params The `partner`, `region`, `handRole`, `side`, `hold` and `manner` of `IAutoMovieMotionHumanKiss.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.kiss is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.kiss is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.kiss is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.kiss is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.kiss is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.kiss is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  kiss(params: IAutoMovieMotionHumanTouch.IKiss, anchor?: string): Chain;

  /**
   * A touch with the leg while standing (#3357's effectors below the hip): the toes, the heel or the knee of one leg is brought onto a place and held there, the other leg bearing the body.
   *
   * @param params The `balance`, `target`, `with`, `side` and `hold` of `IAutoMovieMotionHumanLegTouch.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.legTouch is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  legTouch(
    params: IAutoMovieMotionHumanTouch.ILegTouch,
    anchor?: string,
  ): Chain;

  /**
   * Rest the head on a partner: the temple or the cheek laid on the partner's shoulder or chest, seated side by side or standing, held for the authored span and released.
   *
   * @param params The `IAutoMovieMotionHumanHeadRest` members, as `IAutoMovieMotionHumanTouch.IHeadRest`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.headRest is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.headRest is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.headRest is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.headRest is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.headRest is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.headRest is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  headRest(
    params: IAutoMovieMotionHumanTouch.IHeadRest,
    anchor?: string,
  ): Chain;
  /**
   * Two people seated or standing back to back, their backs in contact and held for the authored span.
   *
   * @param params The `IAutoMovieMotionHumanBackToBack` members, as `IAutoMovieMotionHumanTouch.IBackToBack`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.backToBack is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.backToBack is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.backToBack is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.backToBack is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.backToBack is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.backToBack is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  backToBack(
    params: IAutoMovieMotionHumanTouch.IBackToBack,
    anchor?: string,
  ): Chain;
  /**
   * Sit on a seated partner's lap: the sitter stands before the partner's knees, facing away, and sits onto the partner's thighs, which bear the sitter's seat. Getting off is the ordinary rise.
   *
   * @param params The `IAutoMovieMotionHumanSitOnLap` members, as `IAutoMovieMotionHumanTouch.ISitOnLap`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.sitOnLap is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.sitOnLap is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.sitOnLap is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.sitOnLap is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.sitOnLap is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.sitOnLap is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  sitOnLap(
    params: IAutoMovieMotionHumanTouch.ISitOnLap,
    anchor?: string,
  ): Chain;
  /**
   * Embrace a partner from behind: the arms around their waist with the palms on their abdomen, the chest against their upper back and the chin on one of their shoulders, held for the authored span and released.
   *
   * @param params The `IAutoMovieMotionHumanEmbraceFromBehind` members, as `IAutoMovieMotionHumanTouch.IEmbraceFromBehind`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanTouch.embraceFromBehind is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanTouch.embraceFromBehind is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanTouch.embraceFromBehind is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanTouch.embraceFromBehind is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanTouch.embraceFromBehind is provided by the chain that implements IAutoMovieMotionHumanTouch.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanTouch.embraceFromBehind is provided by the chain that implements IAutoMovieMotionHumanTouch.
   */
  embraceFromBehind(
    params: IAutoMovieMotionHumanTouch.IEmbraceFromBehind,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the Touch methods.
 */
export namespace IAutoMovieMotionHumanTouch {
  /**
   * The parameters of `touch`: `IAutoMovieMotionHumanTouch.IParams` (`touch/IAutoMovieMotionHumanTouch`), the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanTouch.IParams` (`touch/IAutoMovieMotionHumanTouch`): the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanTouch.IParams` (`touch/IAutoMovieMotionHumanTouch`) owns the shape; the alias serves `touch` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ITouchParams = IAutoMovieMotionHumanTouch.IParams;

  /**
   * The parameters of `highFive`: `IAutoMovieMotionHumanHighFive.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanHighFive.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanHighFive.IParams` owns the shape; the alias serves `highFive` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IHighFive = IAutoMovieMotionHumanHighFive.IParams;

  /**
   * The parameters of `kiss`: `IAutoMovieMotionHumanKiss.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanKiss.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanKiss.IParams` owns the shape; the alias serves `kiss` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IKiss = IAutoMovieMotionHumanKiss.IParams;

  /**
   * The parameters of `legTouch`: `IAutoMovieMotionHumanLegTouch.IParams`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanLegTouch.IParams`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanLegTouch.IParams` owns the shape; the alias serves `legTouch` of this family, naming its parameters in the family namespace without a second definition.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ILegTouch = IAutoMovieMotionHumanLegTouch.IParams;

  /**
   * The parameters of `headRest`: `IAutoMovieMotionHumanHeadRest`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanHeadRest`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanHeadRest` owns the shape; the alias serves `headRest` of this family.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IHeadRest = IAutoMovieMotionHumanHeadRest;
  /**
   * The parameters of `backToBack`: `IAutoMovieMotionHumanBackToBack`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanBackToBack`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanBackToBack` owns the shape; the alias serves `backToBack` of this family.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IBackToBack = IAutoMovieMotionHumanBackToBack;
  /**
   * The parameters of `sitOnLap`: `IAutoMovieMotionHumanSitOnLap`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanSitOnLap`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSitOnLap` owns the shape; the alias serves `sitOnLap` of this family.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type ISitOnLap = IAutoMovieMotionHumanSitOnLap;
  /**
   * The parameters of `embraceFromBehind`: `IAutoMovieMotionHumanEmbraceFromBehind`, the type its law takes.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method these parameters serve and the law type they alias.
   * @evidence contracts/development/design.md#principled-representation An alias of `IAutoMovieMotionHumanEmbraceFromBehind`: the units, frames, invariants and runtime-validated states are that type's, and the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanEmbraceFromBehind` owns the shape; the alias serves `embraceFromBehind` of this family.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: a plain alias, with no field added, widened, cast or made optional.
   */
  export type IEmbraceFromBehind = IAutoMovieMotionHumanEmbraceFromBehind;
  /**
   * The parameters of the mutual `hug` and `shoulderClasp` rows: the nominal touch dwell.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the member's meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation One dwell in seconds, as the `touch` law's own `hold`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only what the two mutual rows read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is widened or cast.
   */
  export interface IHold {
    /** The nominal touch dwell, seconds; 1 when absent, a brief greeting. */
    hold?: number;
  }
  /**
   * The `touch` parameters a preset fixes: `kind`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the `touch` members the presets of this key set fix.
   * @evidence contracts/development/design.md#principled-representation A `Pick` of the law's own parameters; the alias adds no member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Serves the presets that fix exactly these members, so the rows keep their open parameters.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type ITouchKindPreset = Pick<ITouchParams, "kind">;

  /**
   * The `touch` parameters a preset fixes: `target`, `effector`, `kind`, `hand`, `elbow`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the `touch` members the presets of this key set fix.
   * @evidence contracts/development/design.md#principled-representation A `Pick` of the law's own parameters; the alias adds no member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Serves the presets that fix exactly these members, so the rows keep their open parameters.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type ITouchTargetEffectorKindHandElbowPreset = Pick<
    ITouchParams,
    "target" | "effector" | "kind" | "hand" | "elbow"
  >;

  /**
   * The `touch` parameters a preset fixes: `target`, `effector`, `kind`, `hand`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the `touch` members the presets of this key set fix.
   * @evidence contracts/development/design.md#principled-representation A `Pick` of the law's own parameters; the alias adds no member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Serves the presets that fix exactly these members, so the rows keep their open parameters.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type ITouchTargetEffectorKindHandPreset = Pick<
    ITouchParams,
    "target" | "effector" | "kind" | "hand"
  >;

  /**
   * The `touch` parameters a preset fixes: `target`, `effector`, `kind`, `hold`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the `touch` members the presets of this key set fix.
   * @evidence contracts/development/design.md#principled-representation A `Pick` of the law's own parameters; the alias adds no member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Serves the presets that fix exactly these members, so the rows keep their open parameters.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type ITouchTargetEffectorKindHoldPreset = Pick<
    ITouchParams,
    "target" | "effector" | "kind" | "hold"
  >;

  /**
   * The `touch` parameters a preset fixes: `target`, `other`, `effector`, `kind`, `hand`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the `touch` members the presets of this key set fix.
   * @evidence contracts/development/design.md#principled-representation A `Pick` of the law's own parameters; the alias adds no member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Serves the presets that fix exactly these members, so the rows keep their open parameters.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type ITouchTargetOtherEffectorKindHandPreset = Pick<
    ITouchParams,
    "target" | "other" | "effector" | "kind" | "hand"
  >;

  /**
   * The `touch` parameters a preset fixes: `effector`, `kind`, `count`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the `touch` members the presets of this key set fix.
   * @evidence contracts/development/design.md#principled-representation A `Pick` of the law's own parameters; the alias adds no member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Serves the presets that fix exactly these members, so the rows keep their open parameters.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type ITouchEffectorKindCountPreset = Pick<
    ITouchParams,
    "effector" | "kind" | "count"
  >;

  /**
   * The `touch` parameters a preset fixes: `effector`, `kind`, `hold`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the `touch` members the presets of this key set fix.
   * @evidence contracts/development/design.md#principled-representation A `Pick` of the law's own parameters; the alias adds no member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Serves the presets that fix exactly these members, so the rows keep their open parameters.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type ITouchEffectorKindHoldPreset = Pick<
    ITouchParams,
    "effector" | "kind" | "hold"
  >;

  /**
   * The `touch` parameters a preset fixes: `effector`, `kind`, `manner`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the `touch` members the presets of this key set fix.
   * @evidence contracts/development/design.md#principled-representation A `Pick` of the law's own parameters; the alias adds no member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Serves the presets that fix exactly these members, so the rows keep their open parameters.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type ITouchEffectorKindMannerPreset = Pick<
    ITouchParams,
    "effector" | "kind" | "manner"
  >;

  /**
   * The `touch` parameters a preset fixes: `effector`, `kind`, `hold`, `hand`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the `touch` members the presets of this key set fix.
   * @evidence contracts/development/design.md#principled-representation A `Pick` of the law's own parameters; the alias adds no member.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Serves the presets that fix exactly these members, so the rows keep their open parameters.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast.
   */
  export type ITouchEffectorKindHoldHandPreset = Pick<
    ITouchParams,
    "effector" | "kind" | "hold" | "hand"
  >;
}

/**
 * A touch while standing: one hand, or both, laid on a region of a partner
 * or of the performer's own body and moved on it by a kind of social touch
 * (Jung et al. 2017): a tap, a pat, a stroke, a rub, a press, a squeeze, a
 * hold or a scratch. It is the one law of the affectionate and social touch
 * family (#3284: a pat on the head, a tap on the shoulder, a hand on the
 * arm) and of the self-directed family (#3285: a belly pat, a nape rub, a
 * forearm scratch, a self hug, hands over the ears), each item a row of
 * `(effector, region, kind, timing)`.
 *
 * The hand reaches the region in the free-space transport time of the
 * distance (`AutoMovieMotionHumanTiming.transport`), repeats the kind's
 * stroke `count` times (`AutoMovieMotionHumanTouchForm.FORMS`), dwells for the
 * hold and goes back in the reach's time; the manner's tempo scales every
 * span and its extent the lift and the travel. The feet stay planted and the
 * body keeps the entry posture. A region of the performer's limbs is read on
 * the entry pose, so it must ride a limb the touch does not move, except a
 * region on the other arm: a person scratching or patting their own forearm
 * first brings it up, so that arm is carried on the same envelope to its
 * forearm held across the front of the waist, palm down, and the region is
 * read on the arm held there (`present`). A region above the shoulder that
 * the standing arm does not reach (a taller person's cheek) is risen to on
 * the toes, and a region beyond the standing arm (a thigh slapped while
 * standing) is leaned into, each as far as the hand needs
 * (`AutoMovieMotionHumanTouchStance`), a leg's region then read on the legs
 * as the lean leaves them; one still out of reach at the lean's limit is
 * refused. A seated or carried body does not rise.
 *
 * Events: the phrase instants (`ready` on the region, `strokeStart` to
 * `strokeEnd` the repetitions, `relax` leaving). A touch may be cut before
 * it arrives or from `relax` on, into standing, a walk, a gesture or another
 * touch, the declined handshake's rule.
 */
export namespace IAutoMovieMotionHumanTouch {
  /**
   * How a touch's arms hold on their regions: `relaxed`, the elbow never
   * locked, or `straight`, the elbow locked and the arm's whole length
   * reached.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each value's meaning.
   * @evidence contracts/development/design.md#principled-representation A closed union of the two arm holds the touch's reach share reads.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The two holds the touch law distinguishes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A named alias instead of an inline union on the parameter.
   */
  export type Arms = "relaxed" | "straight";

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The region as the shared target union, the kind and the effector as closed unions, timing as counts and seconds.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the target union and the manner.
   */
  export interface IParams {
    /**
     * A balancing shift (`IAutoMovieMotionHumanBalance`): one closed-form shift
     * of its part, scaled by its weight between its two event-named instants,
     * each field absent taking the law's recommendation. Absent, none: the
     * posture is the law's own kinematic one with no balance shift or
     * centre-of-mass reading.
     */
    balance?: IAutoMovieMotionHumanBalance;

    /** The region touched: a partner's (`person`) or the performer's own (`self`). */
    target: IAutoMovieMotionTarget;

    /** The kind; `pat` when absent. */
    kind?: IAutoMovieMotionHumanTouchForm.Kind;

    /** The part of the hand; the palm when absent. `forefinger` is the end of the forefinger of a flat hand held in line with its forearm, the palm turned down, as a salute meets the brow. */
    effector?: IAutoMovieMotionHumanTouchEffectors.With;

    /** The hand; when absent, the one whose arm reaches the region with the least strain, or the hand holding `prop` (`touchSide`). */
    hand?: AutoMovieHumanSide;

    /** Where on the region the first hand lands (`touchSite`): an offset, a place the seed draws, or the place a rule chooses; the region's own point when absent. */
    site?: IAutoMovieMotionHumanTouchSite.ISite;

    /** The subject id of the prop that hand holds, whose point touches in place of the hand part: a cigarette's lit end tapped on an ashtray, a pen's tip on a page. No prop when absent. */
    prop?: string;

    /** The held prop's point that touches, one of its affordance ids; required with `prop`. */
    point?: string;

    /**
     * With `prop` on a region of the performer's own, the grasp the tool was
     * taken up by for its use (`pickUp`'s `handle` and `use.line`): the
     * stroke holds the tool as that grasp presents it at the region
     * (`HumanGraspUse.presented`, the region as the use's place) and moves
     * only its point, as a razor keeps its angle on the jaw. Absent, the
     * prop's point faces into the region.
     */
    grasp?: IAutoMovieMotionHumanHeldUse.IGrasp;

    /** A miss staged as a touch: the effector passes the region this far off its surface along its normal, in the hand's lengths, at the stroke's full speed, and no contact is declared (a stage slap). A touch that lands when absent. */
    clear?: number;

    /**
     * Where the elbow lies while the hand is on the region: `natural`, the
     * place of least strain, or `level`, raised to the shoulder's height so
     * the upper arm is horizontal, as a salute or a hand shading the eyes
     * holds it. `natural` when absent.
     */
    elbow?: "natural" | "level";

    /**
     * How the arms hold while the hands are on their regions: `relaxed`, the
     * elbow never locked, the wrist kept within a share of the arm's length
     * (`touch.REACH`), or `straight`, the elbow locked and the whole arm's
     * length reached, as chest compressions are given with the arms straight
     * and the shoulders over the hands (American Heart Association 2020).
     * `relaxed` when absent.
     */
    arms?: IAutoMovieMotionHumanTouch.Arms;

    /** The other hand's region, touched the same way at the same time; one hand when absent. */
    other?: IAutoMovieMotionTarget;

    /** The arms' segments that lie on the performer's own body while the hands are on their regions, as a self-hug's forearms lie on each other and on the chest (`AutoMovieMotionHumanTouchContacts.sided`); none when absent. */
    rests?: readonly IAutoMovieMotionHumanTouchContacts.IDeclared[];

    /** Repetitions; 3 for a tap, a pat, a rub or a scratch and 1 otherwise when absent. */
    count?: number;

    /** Seconds the hand stays after the repetitions; 0.4, or 1.2 for a press, a squeeze or a hold, when absent. */
    hold?: number;

    /** The travel's direction on the region; when absent, `up`, or `across` for a hand on the performer's own region whose travel up and down would sink it into another part of the body (`touchHold.lay`). */
    tangent?: IAutoMovieMotionHumanTouchForm.Tangent;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * One touch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, unit and default.
   * @evidence contracts/development/design.md#principled-representation The phrase clock, the effector, the region as a frame of the posture and the kind with its repetitions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The members `touch` reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The region is a frame function, so a partner's region and the performer's own fit one member.
   */
  export interface ITouch {
    /** The body. */
    body: IAutoMovieMotionHumanBody;

    /** A phrase clock: arrive by `ready`, repeat from `strokeStart` to `strokeEnd`, leave from `relax`. */
    clock: IAutoMovieMotionClock;

    /** The hand. */
    side: AutoMovieHumanSide;

    /** The arm's angles before and after the touch. */
    rest: IAutoMovieMotionHumanArmAngles.IAngles;

    /** The effector. */
    effector: IAutoMovieMotionHumanTouchEffector.IEffector;

    /**
     * The region at a second.
     *
     * @param posture The posture written so far in this frame.
     * @param seconds Seconds since the action's start.
     * @param resolution Optional same-body FK metadata borrowed only during this invocation.
     * @param projection Optional genuine same-body ROM metadata borrowed only during this invocation.
     * @returns The region's point in world metres and its unit normal, pointing away from the surface.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States both arguments, the space and unit of the point and the sense of the normal.
     * @evidence contracts/development/implementation.md#principled-implementation The region is read on the posture so far, so a region on a moving partner or on the performer's own body is followed frame by frame.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One query returning the surface frame's two quantities; the touch builds its lift and travel on them.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The normal is required, so the lift's direction is never guessed from the point alone.
     * @evidence contracts/development/implementation.md#efficient-algorithms Touch.goal invokes one actual region read per target query; touchRegion/touchHold choose the original own-entry, current trunk or partner observation, paying only its demanded FK and surface placement when needed.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The actual adapters may borrow same-body FK/ROM metadata for the current posture and invocation; partner bodies and film instants retain separate observations, with no sampled region result cache.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Touch.goal retains the region callback with its action props; query loans are synchronous arguments only and never enter the returned numeric region frame or retained action state.
     */
    region(
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): Pick<IAutoMovieMotionHumanTarget.IPlace, "point" | "normal">;

    /** The kind. */
    kind: IAutoMovieMotionHumanTouchForm.Kind;

    /** How many repetitions; a positive whole number. */
    count: number;

    /** The travel's direction; `up` when absent. */
    tangent?: IAutoMovieMotionHumanTouchForm.Tangent;

    /** The effector's stand-off from the region along its normal beyond the skin's pad, metres; 0 when absent. */
    standoff?: number;

    /** Factor on the lift and the travel; 1 when absent. */
    extent?: number;

    /** The elbow's bend hint, world, on the entry posture; carried with the root. */
    bend: IAutoMovieVector3;

    /** The arm laid on the region at the entry (`laid`), which every second's fit is held to; no reference when absent. */
    reference?: NonNullable<IAutoMovieHumanLimbGoal["reference"]>;

    /** What the effector's along axis lies on: the travel's tangent, or `arm`, the direction away from the elbow across the region (`AutoMovieMotionHumanTouchPath.lay`), or `reach`, for an effector that meets its place end on: its facing axis runs from the elbow straight to the place (`AutoMovieMotionHumanTouchPath.reach`) and its along axis lies on the world's up, or `upright`, the world's up as a held vessel stands, the effector facing against `facing`, or `limb`, the long axis of the touched limb (`facing`) square to the region's normal, so a flat hand lies along a curved segment rather than across it; the tangent when absent. */
    lay?: "tangent" | "arm" | "reach" | "upright" | "limb";

    /** The hand's rotation the stroke keeps, world, on the entry posture, turned with the posture's heading: a held tool laid as the grasp chosen for its use presents it (`HumanGraspUse.presented`), so only its point moves. The effector is laid by `lay` when absent. */
    held?: IAutoMovieQuaternion;

    /** With `upright`, the level world direction the effector faces against (`AutoMovieMotionHumanTouchUpright`); the region's level normal when absent. With `limb`, the touched limb's long axis, world, that the effector's along axis follows; the travel's tangent when absent. */
    facing?: IAutoMovieVector3;

    /** With `upright` or `held`, how far the vessel leans toward the region at the face, degrees (`AutoMovieMotionHumanTouchUpright.tip`): the goal holds it so leaned, so the arm is carried toward the arm that holds it at the lips, while the hand's attitude on the way (`AutoMovieMotionHumanDrinkingArm.carried`) carries it as it is laid or held, tipped over the last `TIP` of the carry's progress and righted over the first `TIP` of the way back; no lean when absent. */
    lean?: number;

    /** Where the elbow lies while the hand is on the region, which `arm` lays the effector from: the place of least strain (`natural`) or `level` with the shoulder; `natural` when absent. */
    elbow?: "natural" | "level";

    /** With `reach`, the elbow's place the effector runs from (`settled`), world, on the entry posture; carried with the root. Read from the body's measures when absent. */
    from?: IAutoMovieVector3;

    /** The entry posture the hint was solved on. */
    entry: Pick<IAutoMovieMotionHumanPosture, "root" | "yaw">;

    /** What the hand bears on while it is on the region; no window when absent, nor when a held tool's point touches a person (the tool touches them, not the hand, so the hand's fingers are read against the body like any other part). */
    contact?: IAutoMovieMotionHumanContactWindow.Support;

    /** `keep` leaves the fingers as the base holds them, as a hand that grips a prop must; they take the effector's shape when absent. */
    fingers?: "keep";

    /** The arm's segments that lie on a person's segment while the hand is on the region, each declared as a contact from `ready` to `relax` (a self-hug's forearm on the other forearm or on the chest); none when absent. */
    rests?: readonly IAutoMovieMotionHumanTouchContacts.IRest[];

    /** The arms of a touch with two hands, planned as one trajectory (`IAutoMovieMotionHumanArmPlanned.ITogether`); this arm alone when absent. */
    together?: IAutoMovieMotionHumanArmPlanned.ITogether;

    /** The radius about its site the hand may land within on the region, metres: the site's own, or the region's extent; the audit's contact skin when absent. */
    disc?: number;
    /** Maximum distance in metres between the hand skin and a held material site. */
    skinDistance?: number;

    /** The region and the colliders as a plan perceives them, for a touch of another person (`IAutoMovieMotionHumanArmCarry.ICarry.perceived`); the hand then follows the person on the hold. */
    perceived?: Pick<IAutoMovieMotionHumanTouch.ITouch, "region" | "others">;

    /** The performer's own bone the region rides, for a region of the performer, so a region on the other arm of the touch rides that arm as it is planned. */
    on?: AutoMovieHumanoidBone;

    /**
     * Another body's placed colliders the arm keeps clear of at a second (`IAutoMovieHumanLimbGoal.clear`), and the ones it lays the hand on (`IAutoMovieHumanLimbGoal.rests`); none when absent.
     *
     * @param posture The posture written so far in this frame.
     * @param seconds Seconds since the action's start.
     * @param resolution Optional same-body FK metadata borrowed only during this invocation.
     * @param projection Optional genuine same-body ROM metadata borrowed only during this invocation.
     * @returns The colliders, placed in the world, kept clear of and rested on.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States both arguments, the result's frame and the default.
     * @evidence contracts/development/implementation.md#principled-implementation A partner moves, so their colliders are read at the second the goal is written.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One query, written into the arm's goal.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The colliders are the profile's, placed by the partner's displayed bones.
     * @evidence contracts/development/implementation.md#efficient-algorithms Touch.goal performs this optional collider query once per actual target read; touchHold places the original partner profile parts in O(P) for P parts without reducing the requested film instants.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Callback adapters may share fixed profile/demand metadata and explicit same-body invocation loans; different partner poses, reaction instants and stop states remain separate actual placement queries.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The action retains the callback, while each invocation owns its collider arrays and numeric placements. Borrowed query metadata is not stored in those outputs or the retained action.
     */
    others?(
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
    ): Pick<IAutoMovieHumanLimbGoal, "clear" | "rests">;
  }
}
