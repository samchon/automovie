/**
 * One caption placement projected into the sound plan's intended dialogue
 * emission interval.
 */
export interface IAutoMovieProductionDialogueLine {
  /** Exact builder-owned caption id. */
  id: string;

  /** Spoken and captioned text. */
  text: string;

  /** Authored language tag retained from the caption. */
  language: string;

  /** Optional authored speaker identity. */
  speaker?: string;

  /** Film-global inclusive start frame. */
  startFrame: number;

  /** Film-global exclusive end frame. */
  endFrame: number;
}
