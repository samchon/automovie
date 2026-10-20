import { IAutoMovieAttachAction } from "./IAutoMovieAttachAction";
import { IAutoMovieCameraAction } from "./IAutoMovieCameraAction";
import { IAutoMovieEmoteAction } from "./IAutoMovieEmoteAction";
import { IAutoMovieEnactAction } from "./IAutoMovieEnactAction";
import { IAutoMovieGestureAction } from "./IAutoMovieGestureAction";
import { IAutoMovieHoldAction } from "./IAutoMovieHoldAction";
import { IAutoMovieLaunchAction } from "./IAutoMovieLaunchAction";
import { IAutoMovieLocomoteAction } from "./IAutoMovieLocomoteAction";
import { IAutoMovieLookAtAction } from "./IAutoMovieLookAtAction";
import { IAutoMovieReachAction } from "./IAutoMovieReachAction";
import { IAutoMovieReactAction } from "./IAutoMovieReactAction";

/**
 * A single action verb an actor performs: the thin unit the model emits and the
 * engine expands into dense motion. The model says what ("jab", "walk to the
 * door", "look at her", "get knocked back"), and the engine's primitives
 * (locomotion bakers, two-bone IK, aim, spring, projectile, impact) synthesize
 * the per-frame {@link IAutoMovieMotion}.
 *
 * Discriminated on `verb`. Every action carries an actor and a placement on the
 * shot's local timeline. `compilePerformance` composes an actor's actions into
 * one performance clip, layering disjoint body regions and arranging the rest
 * with `arrangeMotion`, which holds the last pose across gaps. The camera is an
 * actor too; its {@link IAutoMovieCameraAction}s are how it moves.
 *
 * The engine's reference synthesizer animates `locomote`, `hold`, `lookAt`,
 * `emote`, `gesture`, `reach`, and `react`; `attachTo`, `launch`, and `frame`
 * are compiled by their own passes, and `enact` is resolved by the host from
 * its clip table. A verb the injected synthesizer answers with `null` is
 * skipped without a violation.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `verb` lets `performShot` validate each verb's own fields by narrowing and lets `compilePerformance` hand body verbs to the injected synthesizer while `attachTo`, `launch` and `frame` go to `compileAttach`, `compileLaunch` and `compileCameraMove`.
 * @evidence contracts/common.md#clear-and-simple-design Eleven verbs share `IAutoMovieActionBase` and add only what their motion needs, so the authored record stays thin and every dense detail is the engine's to compute.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null synthesis is skipped rather than substituted; admitted action presence alone therefore does not prove an actor performed it. Enact uses the same mask/composite ROM path at performShot, while direct compilePerformance alone owns assembly rather than shot admission. Layered motion uses sampled union/boundary times and can interpolate short transitions instead of preserving every source curve continuously.
 * @evidence contracts/common.md#meaningful-documentation States the model-versus-engine division, the discriminator, how actions compose into one clip, that the camera is an actor, which verbs the reference synthesizer animates, which have their own passes, and what happens to an unanswered verb.
 */
export type IAutoMovieActionCall =
  | IAutoMovieLocomoteAction
  | IAutoMovieGestureAction
  | IAutoMovieReachAction
  | IAutoMovieLookAtAction
  | IAutoMovieAttachAction
  | IAutoMovieLaunchAction
  | IAutoMovieReactAction
  | IAutoMovieEmoteAction
  | IAutoMovieHoldAction
  | IAutoMovieEnactAction
  | IAutoMovieCameraAction;
