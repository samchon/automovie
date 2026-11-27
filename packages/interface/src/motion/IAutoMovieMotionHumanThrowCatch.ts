import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanKickBall } from "./IAutoMovieMotionHumanKickBall";
import type { IAutoMovieMotionHumanJuggle } from "./IAutoMovieMotionHumanJuggle";
import type { IAutoMovieMotionHumanBallSport } from "./IAutoMovieMotionHumanBallSport";
import type { IAutoMovieMotionHumanFieldThrow } from "./IAutoMovieMotionHumanFieldThrow";
import type { IAutoMovieMotionHumanStickBall } from "./IAutoMovieMotionHumanStickBall";
import type { IAutoMovieMotionHumanCatchObject } from "./IAutoMovieMotionHumanCatchObject";
import type { IAutoMovieMotionHumanRelease } from "./IAutoMovieMotionHumanRelease";
import type { IAutoMovieMotionHumanThrowObjectForm } from "./IAutoMovieMotionHumanThrowObjectForm";
import type { IAutoMovieMotionHumanThrowObjectParams } from "./IAutoMovieMotionHumanThrowObjectParams";

/**
 * Throwing, catching and kicking an object or a ball, and juggling.
 *
 * `stageCatch` catches a real ball at its realized flight; the base catch law's
 * interception point lies within the flight's provisional planning horizon, so
 * a long pass is caught after the thrower's action has ended. `stageDeflect` is
 * a registered law and not a method here: `chain.registered("stageDeflect", {
 * partner, ball })`; it hands the same ball straight back.
 *
 * A method here is a method of `AutoMovieMotionHumanChain` when its name is in
 * `AutoMovieMotionHumanActionName`. Any other member is a registered law or
 * row: pass it in `laws: [...]` to the performance, taking it from
 * `AutoMovieMotionHumanThrowCatch` or from the row namespace of the family, and
 * append it with `chain.registered("<name>", params)`. A member that is a
 * function, a reader or a layer says so in its own comment.
 *
 * @template Chain The chain every method returns; the chain implements this
 *   interface.
 */
export interface IAutoMovieMotionHumanThrowCatch<Chain> {
  /**
   * Throw the held object at a target: the style fixes the release angle, the
   * windup and the trunk's turn and tilt, and the speed follows from the
   * distance and the angle by the range equation, so a farther target is a
   * faster throw.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims only the parts it moves; it can be cut into `catchObject` from its
   * `release` instant, and `stand` and `walk` from its `followThrough`
   * instant.
   *
   * @param params The `target`, `style`, `hand`, `prop`, `angle`, `attitude`,
   *   `implement` and `manner` of `IAutoMovieMotionHumanThrowObjectParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  throwObject(
    params: IAutoMovieMotionHumanThrowObjectParams,
    anchor?: string,
  ): Chain;

  /**
   * Catching an object thrown by another action: the hands meet it where its
   * path enters the reach, give with it, and bring it to the chest.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims only the parts it moves; it can be cut into `ballSport`,
   * `throwObject`, `stand` and `walk` from its `secured` instant.
   *
   * @param params The `partner`, `hands`, `hand`, `ball` and `glove` of
   *   `IAutoMovieMotionHumanCatchObject.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  catchObject(
    params: IAutoMovieMotionHumanCatchObject.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Catching a real ball another performer's anchored action launched, at its
   * realized flight: `partner` is the anchor of the action that releases the
   * ball (a `throwObject`, a `release` or a `ballSport` release); the ball must
   * be a portable prop with no drag, and the anchored action must publish
   * exactly one launch of it. `intercept` is the seconds after the release at
   * which the hands meet the ball, a bounce included; absent, the base catch
   * law's interception point sets it.
   *
   * @param params The `partner`, `hands`, `hand`, `ball`, `glove` and
   *   `intercept` of `IAutoMovieMotionHumanCatchObject.IStageParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  stageCatch(
    params: IAutoMovieMotionHumanCatchObject.IStageParams,
    anchor?: string,
  ): Chain;

  /**
   * Letting go: a hand opens on what it holds, and the held prop leaves it.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It
   * claims only the opening hand's arm; it can be cut into any action from its
   * `open` instant.
   *
   * @param params The `hand`, `prop` and `launch` of
   *   `IAutoMovieMotionHumanRelease.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  release(params: IAutoMovieMotionHumanRelease.IParams, anchor?: string): Chain;

  /**
   * Kicking the ball prop lying beside the support foot with the instep, from
   * standing: the kicking leg swings back, then through the ball and on.
   *
   * @param params The `ball`, `foot`, `target`, `speed`, `lift` and `manner` of
   *   `IAutoMovieMotionHumanKickBall.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  kickBall(
    params: IAutoMovieMotionHumanKickBall.IParams,
    anchor?: string,
  ): Chain;

  /**
   * Toss juggling: the cascade, an odd number of balls each thrown from inside
   * to the other hand and caught on the outside, and the shower, the balls
   * travelling round, thrown high from one hand and passed low back from the
   * other.
   *
   * Registered law: `registered("juggle", params)`; not a chain method.
   *
   * @param params The `pattern`, `balls`, `height`, `throws` and `drops` of
   *   `IAutoMovieMotionHumanJuggle.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  juggle(params: IAutoMovieMotionHumanJuggle.IParams, anchor?: string): Chain;

  /**
   * A field event's throw: the shot, the discus or the hammer from a throwing
   * circle, or the javelin from the end of its runway.
   *
   * Registered law: `registered("fieldThrow", params)`; not a chain method.
   *
   * @param params The `event`, `implement`, `area` and `distance` of
   *   `IAutoMovieMotionHumanFieldThrow.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  fieldThrow(
    params: IAutoMovieMotionHumanFieldThrow.IParams,
    anchor?: string,
  ): Chain;

  /**
   * A two-hand sports-stick action layered on the authored standing or moving
   * support.
   *
   * Registered law: `registered("stickBall", params)`; not a chain method.
   *
   * Overlay law: it rides a carrier that yields the channels it claims. It owns
   * both arms and hands in the stroke while the carrier keeps its support.
   *
   * @param params The `kind`, `stick`, `ball`, `target`, `hand`, `duration` and
   *   `speed` of `IAutoMovieMotionHumanStickBall.IParams`.
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
   * @param params The `kind`, `hand`, `count`, `manner`, `prop`, `at`,
   *   `flightSeconds` and `contactAt` of
   *   `IAutoMovieMotionHumanBallSport.IParams`.
   * @param anchor The action's id for `sync` and `until`; none when absent.
   * @returns The chain with the action appended.
   */
  ballSport(
    params: IAutoMovieMotionHumanBallSport.IParams,
    anchor?: string,
  ): Chain;
}

/** The parameter types of the ThrowCatch methods. */
export namespace IAutoMovieMotionHumanThrowCatch {
  /**
   * A throw preset that fixes the throw's style: the pitch, the underarm pitch,
   * the softball windmill, the cricket bowl, the bowling delivery, the push
   * pass, the rugby pass and the two gridiron throws. Spread into
   * `throwObject`'s parameters with the target; the style fixes the release
   * angle and the windup (`IAutoMovieMotionHumanThrowObjectForm.Style`).
   */
  export interface IStylePreset {
    /** The throw's style. */
    style: IAutoMovieMotionHumanThrowObjectForm.Style;
  }

  /**
   * A catch preset that fixes how many hands take the object: the glove catch
   * and the two-hand catch. Spread into `catchObject`'s parameters with the
   * anchor of the throw caught.
   */
  export interface IHandsPreset {
    /** How many hands take the object. */
    hands: IAutoMovieMotionHumanCatchObject.Hands;
  }

  /**
   * A kick preset that fixes the kicking foot: the right-foot and left-foot
   * kicks. Spread into `kickBall`'s parameters with the ball.
   */
  export interface IFootPreset {
    /** The kicking foot. */
    foot: AutoMovieHumanSide;
  }
}
