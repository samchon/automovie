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
 * A single **action verb** an actor performs: the _thin_ unit the model emits
 * and the engine **fattens into dense motion**. The model says _what_ ("jab",
 * "walk to the door", "look at her", "get knocked back"); the engine's
 * primitives (locomotion bakers, two-bone IK, aim, ROM clamp, spring,
 * projectile, impact) synthesise the per-frame {@link IAutoMovieMotion}. This is
 * the authoring standard library's leverage: a legible schema, rich movement.
 *
 * Discriminated on `verb`. Every action carries an actor and a placement on the
 * shot's local timeline (`start`, and a `duration` or `"auto"` to let the
 * engine choose a natural length). The engine composes an actor's actions into
 * its performance clip (`arrangeMotion`, holding the last pose across gaps).
 * The camera is an actor too; its {@link IAutoMovieCameraAction}s are how it
 * moves.
 *
 * The engine's reference synthesizer animates `locomote`, `hold`, `lookAt`,
 * `emote`, `gesture`, `reach` and `react`; `attachTo`, `launch` and `frame`
 * are compiled by their own passes, and `enact` is resolved by the host from
 * its clip table. A verb the injected synthesizer answers with `null` is
 * skipped without a violation.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `verb`, so TypeScript narrows each member's fields and `performShot` dispatches validation and compilation with one literal comparison per action.
 * @evidence contracts/common.md#clear-and-simple-design Eleven verb interfaces sharing `IAutoMovieActionBase`, each adding only its own fields; the camera is one more verb, so a shot's timeline holds actors and the lens in one list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No verb is special-cased outside its own branch; verbs the reference synthesizer does not animate rely on dedicated compile passes or host clips, and a `null` synthesis is skipped by `compilePerformance` rather than reported.
 * @evidence contracts/common.md#meaningful-documentation States the thin-to-dense contract, the discriminant, the shared timeline fields, which engine pass realizes each verb family, that the camera is a verb, and what happens to a `null` synthesis.
 * @author Samchon
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
