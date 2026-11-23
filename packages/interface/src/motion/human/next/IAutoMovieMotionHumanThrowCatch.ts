import type { AutoMovieHumanSide } from "../../../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanKickBall } from "../ballStrike/IAutoMovieMotionHumanKickBall";
import type { IAutoMovieMotionHumanJuggle } from "../exercise/IAutoMovieMotionHumanJuggle";
import type { IAutoMovieMotionHumanBallSport } from "../sport/IAutoMovieMotionHumanBallSport";
import type { IAutoMovieMotionHumanFieldThrow } from "../sport/IAutoMovieMotionHumanFieldThrow";
import type { IAutoMovieMotionHumanStickBall } from "../sport/IAutoMovieMotionHumanStickBall";
import type { IAutoMovieMotionHumanCatchObject } from "../throwing/IAutoMovieMotionHumanCatchObject";
import type { IAutoMovieMotionHumanRelease } from "../throwing/IAutoMovieMotionHumanRelease";
import type { IAutoMovieMotionHumanThrowObjectForm } from "../throwing/IAutoMovieMotionHumanThrowObjectForm";
import type { IAutoMovieMotionHumanThrowObjectParams } from "../throwing/IAutoMovieMotionHumanThrowObjectParams";

/**
 * Throwing, catching and kicking an object or a ball, and juggling.
 *
 * @template Chain The chain every method returns; the chain implements this interface.
 * @evidence contracts/development/common.md#meaningful-documentation States the family's shared model and what its methods have in common.
 * @evidence contracts/development/design.md#principled-representation One method per law of the ThrowCatch family, each taking the law's own parameter type.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The ThrowCatch laws and nothing the other families own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Each method takes the existing parameter type of its law; nothing is redefined.
 */
export interface IAutoMovieMotionHumanThrowCatch<Chain> {
  /**
   * Throw the held object at a target: the style fixes the release angle, the windup and the trunk's turn and tilt, and the speed follows from the distance and the angle by the range equation, so a farther target is a faster throw.
   *
   * @param params The `at`, `style`, `hand`, `prop`, `angle`, `attitude`, `implement` and `manner` of `IAutoMovieMotionHumanThrowObjectParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  throwObject(
    params: IAutoMovieMotionHumanThrowObjectParams,
    anchor?: string,
  ): Chain;

  /**
   * Catching an object thrown by another action: the hands meet it where its path enters the reach, give with it, and bring it to the chest.
   *
   * @param params The `from`, `hands`, `side`, `ball` and `glove` of `IAutoMovieMotionHumanCatchObject.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  catchObject(
    params: IAutoMovieMotionHumanCatchObject.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Letting go: a hand opens on what it holds, and the held prop leaves it.
   *
   * @param params The `hand`, `prop` and `launch` of `IAutoMovieMotionHumanRelease.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  release(params: IAutoMovieMotionHumanRelease.IParams, anchor?: string): Chain;

  /**
   * Kicking the ball prop lying beside the support foot with the instep, from standing: the kicking leg swings back, then through the ball and on.
   *
   * @param params The `ball`, `foot`, `toward`, `speed`, `lift` and `manner` of `IAutoMovieMotionHumanKickBall.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  kickBall(
    params: IAutoMovieMotionHumanKickBall.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Toss juggling (#3997): the cascade, an odd number of balls each thrown from inside to the other hand and caught on the outside, and the shower, the balls travelling round, thrown high from one hand and passed low back from the other.
   *
   * @param params The `pattern`, `balls`, `height`, `throws` and `drops` of `IAutoMovieMotionHumanJuggle.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  juggle(params: IAutoMovieMotionHumanJuggle.IParams, anchor?: string): Chain;

  /**
   * A field event's throw (#3872): the shot, the discus or the hammer from a throwing circle, or the javelin from the end of its runway.
   *
   * @param params The `event`, `implement`, `area` and `distance` of `IAutoMovieMotionHumanFieldThrow.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  fieldThrow(
    params: IAutoMovieMotionHumanFieldThrow.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A two-hand sports-stick action layered on the authored standing or moving support.
   *
   * @param params The `kind`, `stick`, `ball`, `toward`, `hand`, `seconds` and `speed` of `IAutoMovieMotionHumanStickBall.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  stickBall(
    params: IAutoMovieMotionHumanStickBall.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Team ball skills.
   *
   * @param params The `kind`, `side`, `count`, `manner`, `prop`, `at`, `flightSeconds` and `contactAt` of `IAutoMovieMotionHumanBallSport.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  ballSport(
    params: IAutoMovieMotionHumanBallSport.IParams,
    anchor?: string,
  ): Chain;
}

/**
 * The parameter types of the ThrowCatch methods.
 */
export namespace IAutoMovieMotionHumanThrowCatch {
  /**
   * A throw preset that fixes the throw's style: the pitch, the underarm pitch, the softball windmill, the cricket bowl, the bowling delivery, the push pass, the rugby pass and the two gridiron throws. Spread into `throwObject`'s parameters with the target; the style fixes the release angle and the windup (`IAutoMovieMotionHumanThrowObjectForm.Style`).
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes, how it is applied and where the style's values are.
   * @evidence contracts/development/design.md#principled-representation One required member, the throw's own style, so a preset fixes exactly it and the throw keeps every other default.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; the `AutoMovieMotionHumanThrowCatch` throw presets are its data and the sport-throw rows read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the member is named once here instead of an inline pick of the throw's parameters.
   */
  export interface IStylePreset {
    /** The throw's style. */
    style: IAutoMovieMotionHumanThrowObjectForm.Style;
  }

  /**
   * A catch preset that fixes how many hands take the object: the glove catch and the two-hand catch. Spread into `catchObject`'s parameters with the anchor of the throw caught.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes and how it is applied.
   * @evidence contracts/development/design.md#principled-representation One required member, the catch's own hand count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; the catch presets are its data and the sport-throw rows read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the member is named once here instead of an inline pick of the catch's parameters.
   */
  export interface IHandsPreset {
    /** How many hands take the object. */
    hands: IAutoMovieMotionHumanCatchObject.Hands;
  }

  /**
   * A kick preset that fixes the kicking foot: the right-foot and left-foot kicks. Spread into `kickBall`'s parameters with the ball.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the preset fixes and how it is applied.
   * @evidence contracts/development/design.md#principled-representation One required member, the kicking foot, on the canonical side type.
   * @evidence contracts/development/design.md#minimal-and-owned-surface This family owns the preset shape; the kick presets are its data and the sport-throw rows read them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the member is named once here instead of an inline pick of the kick's parameters.
   */
  export interface IFootPreset {
    /** The kicking foot. */
    foot: AutoMovieHumanSide;
  }
}
