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
 * @evidence requirements/story/dialogue-language-and-silence.md#story-dialogue-action-interaction Exposes `IAutoMovieActionCall` as the portable data boundary for the story dialogue action interaction requirement.
 * @evidence specifications/narrative-and-intent/dialogue-language-theme-and-meaning.md#narrative-intent-utterance-timing-action Types `IAutoMovieActionCall` for the narrative intent utterance timing action system contract.
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
