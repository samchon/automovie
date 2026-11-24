import type { IAutoMovieHumanVisemeWeights } from "../../human/expression/IAutoMovieHumanVisemeWeights.js";

/**
 * The dialogue mouth an actor's figures showed at the drawn second: the value
 * the draw page layered over the figure's authored expression after the
 * picture's last placement.
 *
 * Each member is present exactly when a figure bound under the actor's scene
 * node showed that form, so a figure driven by the jaw is told apart from one
 * driven by visemes, and an actor no figure showed has no record.
 */
export interface IAutoMovieDrawnMouth {
  /** The actor whose mouth was shown. */
  actor: string;

  /** The jaw opening shown, in millimetres at the incisors; absent when unshown. */
  jaw?: number;

  /** The MPEG-4 viseme weights shown; absent when unshown. */
  visemes?: IAutoMovieHumanVisemeWeights;
}
