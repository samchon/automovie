/**
 * One dialogue line on the sound plan's film clock.
 *
 * A line with adopted speech spans its speech span: the half-open frame
 * interval from its start frame to the first frame whose boundary sample tick
 * is at least the start tick plus the line's sample count at the plan rate.
 * Ducking and visemes read this span unchanged. A caption line without adopted
 * speech keeps its caption window.
 */
export interface IAutoMovieProductionDialogueLine {
  /** Exact line id, unique within the film. */
  id: string;

  /** Spoken and captioned text. */
  text: string;

  /** Authored language tag. */
  language: string;

  /** Optional authored speaker identity. */
  speaker?: string;

  /** Film-global inclusive start frame. */
  startFrame: number;

  /**
   * Film-global exclusive end frame: the speech end frame for a spoken line,
   * the caption end otherwise.
   */
  endFrame: number;
}
