import type { IAutoMovieLoftSectionFrame } from "../../../construction/IAutoMovieLoftSectionFrame";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * Type contracts exchanged by AutoMovieHumanHeadDomeHost; runtime evaluation
 * remains in Human.
 */
export namespace IAutoMovieHumanHeadDomeHost {
  /**
   * An original parent section selected by a plane query or actual cap contact.
   *
   * The composition owns the actual parent and original scalar preparation.
   */
  export interface IHost {
    /** Identical original parent, never a realized mesh. */
    part: IAutoMovieViewPart;
    /** Complete original signed-support/fullness/cap family. */
    source: IAutoMovieLoftViewSource.ISource;
    /**
     * World query point; only a non-null parameter certifies a bracketed native
     * surface contact.
     */
    point: [number, number, number];
    /** Actual parent source station whose plane contains that attachment. */
    station: number;
    /** The actual parent plane at that station. */
    frame: IAutoMovieLoftSectionFrame;
    /**
     * Distance along the unchanged nominal child axis, mm; null for a
     * plane-only query.
     */
    parameter: number | null;
  }
}
