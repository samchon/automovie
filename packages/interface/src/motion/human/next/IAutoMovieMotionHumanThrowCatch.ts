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
   */
  export interface IStylePreset {
    /** The throw's style. */
    style: IAutoMovieMotionHumanThrowObjectForm.Style;
  }

  /**
   * A catch preset that fixes how many hands take the object: the glove catch and the two-hand catch. Spread into `catchObject`'s parameters with the anchor of the throw caught.
   */
  export interface IHandsPreset {
    /** How many hands take the object. */
    hands: IAutoMovieMotionHumanCatchObject.Hands;
  }

  /**
   * A kick preset that fixes the kicking foot: the right-foot and left-foot kicks. Spread into `kickBall`'s parameters with the ball.
   */
  export interface IFootPreset {
    /** The kicking foot. */
    foot: AutoMovieHumanSide;
  }
}
