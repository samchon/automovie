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
 * The hand's own-body actions: touching the face, and self-directed touch such
 * as scratching or smoothing.
 *
 * A method here is a method of `HumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanHandToBody` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanHandToBody<Chain> {
  /**
   * A hand-to-face task of daily living while standing: drinking, sipping,
   * eating with a spoon, biting held food, a phone at the ear, reading a held
   * sheet, brushing the teeth, combing the hair, washing the face and wiping
   * the mouth.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims the acting arms, their hands and the head.
   *
   * @param params The `task`, `hand`, `count`, `hold`, `prop`, `point`,
   *   `grasp`, `other` and `manner` of
   *   `IAutoMovieMotionHumanHandToFace.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  handToFace(
    params: IAutoMovieMotionHumanHandToFace.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A whole-body self action while standing: the yawn-and-stretch with both
   * arms overhead, both arms raised in victory, a fist pump, a neck roll and a
   * shoulder roll.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims only the parts it moves.
   *
   * @param params The `kind`, `hand`, `count` and `manner` of
   *   `IAutoMovieMotionHumanSelfAction.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  selfAction(
    params: IAutoMovieMotionHumanSelfAction.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A conversational head tilt toward either shoulder, held and then returned
   * to the posture underneath: a roll of the cervical chain over the entry
   * posture or a carrier that yields its head.
   *
   * Registered law: `registered("headTilt", params)`; not a chain method.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims the head only; it can be cut into any action at any time.
   *
   * @param params The `degrees` and `duration` of
   *   `IAutoMovieMotionHumanHeadTilt`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  headTilt(params: IAutoMovieMotionHumanHeadTilt, anchor?: string): Chain;

  /**
   * Covering the face with both bare hands: the open palms settle on the cheeks
   * with the fingers upward, and the head bows 15 degrees into the cover as
   * both hands arrive; the hold after `taskEnd` is 1.2 s when `hold` is
   * absent.
   *
   * Registered law: `registered("coverFace", params)`; not a chain method.
   *
   * @param params The `hold` and `manner` of
   *   `IAutoMovieMotionHumanHandToBody.ICoverFace`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  coverFace(
    params: IAutoMovieMotionHumanHandToBody.ICoverFace,
    anchor?: string,
  ): Chain;

  /**
   * Brushing tears from one cheek: the chosen hand rises to its own cheek,
   * wipes up and down along it and returns to its entry pose; `atCheek` marks
   * the arrival and `taskEnd` the end of the wipe.
   *
   * Registered law: `registered("wipeTears", params)`; not a chain method.
   *
   * @param params The `hand`, `count`, `hold`, `prop`, `point`, `grasp` and
   *   `manner` of `IAutoMovieMotionHumanHandToBody.IWipeTears`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  wipeTears(
    params: IAutoMovieMotionHumanHandToBody.IWipeTears,
    anchor?: string,
  ): Chain;

  /**
   * Tucking hair behind the ear: the relaxed index fingertip sweeps from in
   * front of the same-side ear to behind it, then retracts; `both` sweeps each
   * ear on the same clock.
   *
   * Registered law: `registered("tuckHair", params)`; not a chain method.
   *
   * @param params The `hand` and `manner` of
   *   `IAutoMovieMotionHumanHandToBody.ITuckHair`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  tuckHair(
    params: IAutoMovieMotionHumanHandToBody.ITuckHair,
    anchor?: string,
  ): Chain;
}

/** The parameter types of the HandToBody methods. */
export namespace IAutoMovieMotionHumanHandToBody {
  /**
   * Seconds at the face after the repetitions: one duration, or two bounds the
   * seed draws one between, evenly.
   */
  export type Hold = number | IAutoMovieMotionHumanHandToBody.IHoldBetween;

  /** Two bounds, in seconds, between which the seed draws a hold evenly. */
  export interface IHoldBetween {
    /**
     * Lower and upper bounds for an evenly drawn hold duration at the face
     * AFTER repetitions, seconds.
     */
    between: readonly [number, number];
  }

  /**
   * The parameters of `coverFace`: what the row leaves open of
   * `IAutoMovieMotionHumanHandToFace.IParams`.
   */
  export interface ICoverFace {
    /**
     * Seconds the cover is held after `taskEnd`, at least 0, or two bounds the
     * seed draws between; 1.2 when absent.
     */
    hold?: IAutoMovieMotionHumanHandToBody.Hold;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * The parameters of `wipeTears`: what the row leaves open of
   * `IAutoMovieMotionHumanHandToFace.IParams`.
   */
  export interface IWipeTears {
    /** The hand that wipes; `right` when absent. */
    hand?: AutoMovieHumanSide;

    /** Wipes at the cheek; the wipe's own when absent. */
    count?: number;

    /** Seconds at the cheek after the wipes; the wipe's own when absent. */
    hold?: IAutoMovieMotionHumanHandToBody.Hold;

    /**
     * The subject id of a held tissue, performed with instead of the bare hand;
     * none when absent.
     */
    prop?: string;

    /**
     * The held prop's point that meets the cheek, one of its affordance ids;
     * the row's when absent.
     */
    point?: string;

    /**
     * The grasp the prop was taken up by for its use; the prop's point faces
     * into the cheek when absent.
     */
    grasp?: IAutoMovieMotionHumanHeldUse.IGrasp;

    /** How it is performed. */
    manner?: IAutoMovieMotionManner;
  }

  /** One hand, or both hands on one clock. */
  export type Hands = AutoMovieHumanSide | "both";

  /**
   * The parameters of `tuckHair`: the acting hand and the manner; the ear, the
   * stroke and the hand's shape are `TUCK_HAIR`'s.
   */
  export interface ITuckHair {
    /** The hand; `right` when absent. `both` sweeps each ear on the same clock. */
    hand?: IAutoMovieMotionHumanHandToBody.Hands;

    /** How it is performed; neutral when absent. */
    manner?: IAutoMovieMotionManner;
  }

  /**
   * The values `coverFace` fixes of the hand-to-face law: the right hand, one
   * cover, no prop, no grasp and no other hand, and the hold on both cheeks as
   * one row.
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
   * The values `wipeTears` fixes of the hand-to-face law: no other prop handle
   * and the rub of one cheek as one row.
   */
  export interface IWipeTearsPreset {
    /** No other prop handle. */
    other: undefined;

    /** The rub of the right cheek as one row, mirrored for the left hand. */
    kind: IAutoMovieMotionHumanHandToFaceRows.IRow;
  }

  /**
   * The values `tuckHair` fixes of the arm phrase: the stroke on the right ear,
   * mirrored for the left hand, by the relaxed index fingertip.
   */
  export interface ITuckHairPreset {
    /** The phrase: a single stroke. */
    phrase: IAutoMovieMotionHumanArmPhrase.Phrase;

    /**
     * The target of the stroke's end: the right ear on the performer's own
     * body.
     */
    target: IAutoMovieMotionTarget;

    /**
     * Whether the target is written for the right hand and mirrored for the
     * left.
     */
    mirror: boolean;

    /** The hand's surface brought to the target. */
    surface: IAutoMovieMotionHumanHand.Surface;

    /** The hand's shape. */
    shape: IAutoMovieMotionHumanHand.Shape;

    /**
     * The target's point moved in the performer's frame, by shares of the arm's
     * length.
     */
    offset: IAutoMovieMotionHumanArmPhrase.IOffset;

    /** The stroke's start, by the same shares from the target's point. */
    from: IAutoMovieMotionHumanArmPhrase.IOffset;
  }
}
