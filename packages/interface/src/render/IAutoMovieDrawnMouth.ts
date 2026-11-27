import type { IAutoMovieHumanVisemeWeights } from "../human/IAutoMovieHumanVisemeWeights.js";

/**
 * The dialogue mouth a drawn subject read for one actor while it was placed at
 * the drawn second: the value it handed that actor's figure.
 *
 * Each member is present exactly when the subject read that form, so a figure
 * driven by the jaw is told apart from one driven by visemes.
 */
export interface IAutoMovieDrawnMouth {
  /** The actor whose mouth was read. */
  actor: string;

  /** The jaw opening read, in millimetres at the incisors; absent when unread. */
  jaw?: number;

  /** The MPEG-4 viseme weights read; absent when unread. */
  visemes?: IAutoMovieHumanVisemeWeights;
}
