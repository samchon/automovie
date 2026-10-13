/** One caption placement that also owns its synthesized dialogue timing. */
export interface IAutoMovieProductionDialogueLine {
  /** Exact builder-owned caption id. */
  id: string;

  /** Spoken and captioned text. */
  text: string;

  /** BCP-47-ish authored language label. */
  language: string;

  /** Optional authored speaker identity. */
  speaker?: string;

  /** Film-global inclusive start frame. */
  startFrame: number;

  /** Film-global exclusive end frame. */
  endFrame: number;
}
