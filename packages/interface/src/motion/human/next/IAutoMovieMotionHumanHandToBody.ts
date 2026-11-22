import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "../../IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanArmPhrase } from "../compose/IAutoMovieMotionHumanArmPhrase";
import type { IAutoMovieMotionManner } from "../compose/IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanHandToFace } from "../daily/IAutoMovieMotionHumanHandToFace";
import type { IAutoMovieMotionHumanHandToFaceRows } from "../daily/IAutoMovieMotionHumanHandToFaceRows";
import type { IAutoMovieMotionHumanHeadTilt } from "../everyday/IAutoMovieMotionHumanHeadTilt";
import type { IAutoMovieMotionHumanHeldUse } from "../handling/IAutoMovieMotionHumanHeldUse";
import type { IAutoMovieMotionHumanHand } from "../posture/IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanSelfAction } from "../touch/IAutoMovieMotionHumanSelfAction";

/**
 * The hand's own-body actions: touching the face, and self-directed touch such as scratching or smoothing.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the HandToBody family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The HandToBody laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanHandToBody<Chain> {
  /**
   * A hand-to-face task of daily living while standing: drinking, sipping, eating with a spoon, biting held food, a phone at the ear, reading a held sheet, brushing the teeth, combing the hair, washing the face and wiping the mouth (M14, #3234).
   *
   * @param params The `task`, `side`, `count`, `seconds`, `prop`, `point`, `grasp`, `other` and `manner` of `IAutoMovieMotionHumanHandToFace.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHandToBody.handToFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHandToBody.handToFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHandToBody.handToFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHandToBody.handToFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHandToBody.handToFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHandToBody.handToFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   */
  handToFace(
    params: IAutoMovieMotionHumanHandToBody.IHandToFace,
    anchor?: string,
  ): Chain;

  /**
   * A whole-body self action while standing (#3285): the yawn-and-stretch with both arms overhead, both arms raised in victory, a fist pump, a neck roll and a shoulder roll.
   *
   * @param params The `kind`, `side`, `count` and `manner` of `IAutoMovieMotionHumanSelfAction.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHandToBody.selfAction is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHandToBody.selfAction is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHandToBody.selfAction is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHandToBody.selfAction is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHandToBody.selfAction is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHandToBody.selfAction is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   */
  selfAction(
    params: IAutoMovieMotionHumanHandToBody.ISelfAction,
    anchor?: string,
  ): Chain;

  /**
   * A conversational head tilt toward either shoulder, held and then returned to the posture underneath: a roll of the cervical chain over the entry posture or a carrier that yields its head.
   *
   * @param params The `degrees` and `duration` of `IAutoMovieMotionHumanHeadTilt`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHandToBody.headTilt is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHandToBody.headTilt is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHandToBody.headTilt is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHandToBody.headTilt is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHandToBody.headTilt is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHandToBody.headTilt is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   */
  headTilt(
    params: IAutoMovieMotionHumanHandToBody.IHeadTilt,
    anchor?: string,
  ): Chain;

  /**
   * Covering the face with both bare hands: the open palms settle on the cheeks with the fingers upward, and the head bows 15 degrees into the cover as both hands arrive; the hold after `taskEnd` is 1.2 s when `hold` is absent.
   *
   * @param params The `hold` and `manner` of `IAutoMovieMotionHumanHandToBody.ICoverFace`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHandToBody.coverFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHandToBody.coverFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHandToBody.coverFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHandToBody.coverFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHandToBody.coverFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHandToBody.coverFace is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   */
  coverFace(
    params: IAutoMovieMotionHumanHandToBody.ICoverFace,
    anchor?: string,
  ): Chain;

  /**
   * Brushing tears from one cheek: the chosen hand rises to its own cheek, wipes up and down along it and returns to its entry pose; `atCheek` marks the arrival and `taskEnd` the end of the wipe.
   *
   * @param params The `hand`, `count`, `hold`, `prop`, `point`, `grasp` and `manner` of `IAutoMovieMotionHumanHandToBody.IWipeTears`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHandToBody.wipeTears is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHandToBody.wipeTears is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHandToBody.wipeTears is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHandToBody.wipeTears is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHandToBody.wipeTears is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHandToBody.wipeTears is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   */
  wipeTears(
    params: IAutoMovieMotionHumanHandToBody.IWipeTears,
    anchor?: string,
  ): Chain;

  /**
   * Tucking hair behind the ear: the relaxed index fingertip sweeps from in front of the same-side ear to behind it, then retracts; `both` sweeps each ear on the same clock.
   *
   * @param params The `hand` and `manner` of `IAutoMovieMotionHumanHandToBody.ITuckHair`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the action does, its parameters, its anchor and its return.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This callable contract has no algorithm body; the provider supplies the method and its premises; IAutoMovieMotionHumanHandToBody.tuckHair is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure This signature fixes the call boundary only; provider decomposition belongs to the implementation; IAutoMovieMotionHumanHandToBody.tuckHair is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no handles or retained state; the callable provider and its caller own lifetime and release; IAutoMovieMotionHumanHandToBody.tuckHair is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This declaration selects no execution strategy; the provider owns traversal and allocation costs; IAutoMovieMotionHumanHandToBody.tuckHair is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No computation or fitted constants are implemented by this signature; the provider must justify its computation; IAutoMovieMotionHumanHandToBody.tuckHair is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This signature coordinates no requests and defines no cache; the provider owns result equivalence and invalidation; IAutoMovieMotionHumanHandToBody.tuckHair is provided by the chain that implements IAutoMovieMotionHumanHandToBody.
   */
  tuckHair(
    params: IAutoMovieMotionHumanHandToBody.ITuckHair,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the HandToBody methods.
 */
export namespace IAutoMovieMotionHumanHandToBody {
  /**
   * The parameters of `handToFace`: the law's own `IAutoMovieMotionHumanHandToFace.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanHandToFace` owns the type; the alias serves this family's `handToFace` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `handToFace` takes the type its law reads.
   */
  export type IHandToFace = IAutoMovieMotionHumanHandToFace.IParams;

  /**
   * The parameters of `selfAction`: the law's own `IAutoMovieMotionHumanSelfAction.IParams`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanSelfAction` owns the type; the alias serves this family's `selfAction` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `selfAction` takes the type its law reads.
   */
  export type ISelfAction = IAutoMovieMotionHumanSelfAction.IParams;

  /**
   * The parameters of `headTilt`: the law's own `IAutoMovieMotionHumanHeadTilt`, unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the method it parameterises and the law type it aliases unchanged.
   * @evidence contracts/development/design.md#principled-representation An alias: units, frames, defaults and invariants are those the law type states; the alias adds none.
   * @evidence contracts/development/design.md#minimal-and-owned-surface `IAutoMovieMotionHumanHeadTilt` owns the type; the alias serves this family's `headTilt` signature.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no member is added, widened or cast, so `headTilt` takes the type its law reads.
   */
  export type IHeadTilt = IAutoMovieMotionHumanHeadTilt;

  /**
   * Seconds at the face after the repetitions: one duration, or two bounds the seed draws one between, evenly.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the unit and the two forms.
   * @evidence contracts/development/design.md#principled-representation The same two forms `IAutoMovieMotionHumanHandToFace.IParams.hold` takes, named once for the rows that pass it on.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `IWipeTears` only.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no form is added to the law's own.
   */
  export type Hold = number | IAutoMovieMotionHumanHandToBody.IHoldBetween;

  /**
   * Two bounds, in seconds, between which the seed draws a hold evenly.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the unit of the bounds.
   * @evidence contracts/development/design.md#principled-representation The lower and the upper bound of one draw.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One member, as the law's own hold states it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the bounds are not checked here; the law refuses a bad hold.
   */
  export interface IHoldBetween {
    /** Lower and upper bounds for an evenly drawn hold duration at the face AFTER repetitions, seconds. */
    between: readonly [number, number];
  }

  /**
   * The parameters of `coverFace`: what the row leaves open of `IAutoMovieMotionHumanHandToFace.IParams`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, its unit and its default.
   * @evidence contracts/development/design.md#principled-representation The two members of the hand-to-face law the cover leaves open; the hand, the count, the cheeks and the head's bow are `COVER_FACE`'s.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Fixes the gesture and exposes only the hold and the manner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: both members are optional as the law's own are.
   */
  export interface ICoverFace {
    /** Seconds the cover is held after `taskEnd`, at least 0, or two bounds the seed draws between; 1.2 when absent. */
    hold?: IAutoMovieMotionHumanHandToBody.Hold;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * The parameters of `wipeTears`: what the row leaves open of `IAutoMovieMotionHumanHandToFace.IParams`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, its unit and its default.
   * @evidence contracts/development/design.md#principled-representation The members of the hand-to-face law the wipe leaves open; the task and the second hand are `WIPE_TEARS`'s.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Fixes the task and excludes a second hand while inheriting the timing, one-hand controls and cuts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: every member is optional as the law's own are.
   */
  export interface IWipeTears {
    /** The hand that wipes; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** Wipes at the cheek; the wipe's own when absent. */
    count?: number;

    /** Seconds at the cheek after the wipes; the wipe's own when absent. */
    hold?: IAutoMovieMotionHumanHandToBody.Hold;

    /** The subject id of a held tissue, performed with instead of the bare hand; none when absent. */
    prop?: string;

    /** The held prop's point that meets the cheek, one of its affordance ids; the row's when absent. */
    point?: string;

    /** The grasp the prop was taken up by for its use; the prop's point faces into the cheek when absent. */
    grasp?: IAutoMovieMotionHumanHeldUse.IGrasp;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * One hand, or both hands on one clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two forms.
   * @evidence contracts/development/design.md#principled-representation The arm phrase's own hand choice, named once.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `ITuckHair` only.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: no form is added to the phrase's own.
   */
  export type Hands = AutoMovieHumanSide | "both";

  /**
   * The parameters of `tuckHair`: the acting hand and the manner; the ear, the stroke and the hand's shape are `TUCK_HAIR`'s.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the caller selects and the omitted defaults.
   * @evidence contracts/development/design.md#principled-representation The arm phrase's canonical hand and manner contracts, including their optionality.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the hand and the manner vary.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: both members keep the phrase's own defaults, the right hand and the neutral manner.
   */
  export interface ITuckHair {
    /** The hand; `right` when absent. `both` sweeps each ear on the same clock. */
    hand?: IAutoMovieMotionHumanHandToBody.Hands;

    /** How it is performed; neutral when absent. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * The values `coverFace` fixes of the hand-to-face law: the right hand, one cover, no prop, no grasp and no other hand, and the hold on both cheeks as one row.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each fixed member and what it fixes.
   * @evidence contracts/development/design.md#principled-representation The law's own members, fixed as data so the row and a reader share one value.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly the members the `coverFace` row fixes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row reads the constant instead of repeating its values.
   */
  export interface ICoverFacePreset {
    /** The hand of a one-hand task. */
    hand: AutoMovieHumanSide;

    /** The repetitions at the face. */
    count: number;

    /** No prop: the hands are bare. */
    prop: undefined;

    /** No prop point. */
    point: undefined;

    /** No grasp. */
    grasp: undefined;

    /** No other prop handle. */
    other: undefined;

    /** The cover as one hold-on-two-cheeks row. */
    kind: IAutoMovieMotionHumanHandToFaceRows.IRow;
  }

  /**
   * The values `wipeTears` fixes of the hand-to-face law: no other prop handle and the rub of one cheek as one row.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each fixed member and what it fixes.
   * @evidence contracts/development/design.md#principled-representation The law's own members, fixed as data so the row and a reader share one value.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly the members the `wipeTears` row fixes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row reads the constant instead of repeating its values.
   */
  export interface IWipeTearsPreset {
    /** No other prop handle. */
    other: undefined;

    /** The rub of the right cheek as one row, mirrored for the left hand. */
    kind: IAutoMovieMotionHumanHandToFaceRows.IRow;
  }

  /**
   * The values `tuckHair` fixes of the arm phrase: the stroke on the right ear, mirrored for the left hand, by the relaxed index fingertip.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each fixed member, its unit and what it fixes.
   * @evidence contracts/development/design.md#principled-representation The arm phrase's own members, fixed as data so the row and a reader share one value; the offsets are shares of the arm's length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Exactly the members the `tuckHair` row fixes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row reads the constant instead of repeating its values.
   */
  export interface ITuckHairPreset {
    /** The phrase: a single stroke. */
    phrase: IAutoMovieMotionHumanArmPhrase.Phrase;

    /** The target of the stroke's end: the right ear on the performer's own body. */
    target: IAutoMovieMotionTarget;

    /** Whether the target is written for the right hand and mirrored for the left. */
    mirror: boolean;

    /** The hand's surface brought to the target. */
    surface: IAutoMovieMotionHumanHand.Surface;

    /** The hand's shape. */
    shape: IAutoMovieMotionHumanHand.Shape;

    /** The target's point moved in the performer's frame, by shares of the arm's length. */
    offset: IAutoMovieMotionHumanArmPhrase.IOffset;

    /** The stroke's start, by the same shares from the target's point. */
    from: IAutoMovieMotionHumanArmPhrase.IOffset;
  }
}
