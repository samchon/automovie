import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionTarget } from "./IAutoMovieMotionTarget";
import type { IAutoMovieMotionHumanArmPhrase } from "./IAutoMovieMotionHumanArmPhrase";
import type { IAutoMovieMotionManner } from "./IAutoMovieMotionManner";
import type { IAutoMovieMotionHumanHandToFaceRows } from "./IAutoMovieMotionHumanHandToFaceRows";
import type { IAutoMovieMotionHumanHeldUse } from "./IAutoMovieMotionHumanHeldUse";
import type { IAutoMovieMotionHumanHand } from "./IAutoMovieMotionHumanHand";
import type { IAutoMovieMotionHumanHandToFace } from "./IAutoMovieMotionHumanHandToFace";

/**
 * Inputs, choices and presets for hand-to-body actions.
 */
export namespace IAutoMovieMotionHumanHandToBody {
  /**
   * Seconds at the face after the repetitions: one duration, or two bounds the
   * seed draws one between, evenly.
   */
  export type Hold = number | IAutoMovieMotionHumanHandToFace.IHoldRange;

  /** @deprecated Use `IAutoMovieMotionHumanHandToFace.IHoldRange`. */
  export type IHoldBetween = IAutoMovieMotionHumanHandToFace.IHoldRange;

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
