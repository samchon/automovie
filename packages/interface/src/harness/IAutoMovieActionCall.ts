import type { IAutoMovieAttachAction } from "./IAutoMovieAttachAction";
import type { IAutoMovieCameraAction } from "./IAutoMovieCameraAction";
import type { IAutoMovieEmoteAction } from "./IAutoMovieEmoteAction";
import type { IAutoMovieEnactAction } from "./IAutoMovieEnactAction";
import type { IAutoMovieGestureAction } from "./IAutoMovieGestureAction";
import type { IAutoMovieHoldAction } from "./IAutoMovieHoldAction";
import type { IAutoMovieLaunchAction } from "./IAutoMovieLaunchAction";
import type { IAutoMovieLocomoteAction } from "./IAutoMovieLocomoteAction";
import type { IAutoMovieLookAtAction } from "./IAutoMovieLookAtAction";
import type { IAutoMovieReachAction } from "./IAutoMovieReachAction";
import type { IAutoMovieReactAction } from "./IAutoMovieReactAction";

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
