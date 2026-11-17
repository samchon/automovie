import type { IAutoMovieLoftFrame } from "../../../construction/IAutoMovieLoftFrame";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/** Type contracts exchanged by AutoMovieHumanHeadDomeHost; runtime evaluation remains in Human. */
export namespace IAutoMovieHumanHeadDomeHost {
  /**
   * An original parent section selected by a plane query or actual cap contact.
   *
   * @evidence contracts/common.md#principled-implementation Carries the complete admitted source, query point, actual station/frame and an explicit distinction between plane incidence and a bracketed surface contact.
   * @evidence contracts/common.md#clear-and-simple-design Keeps the parent-plane datum separate from the child's nominal base and embedding offset.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts World height and a buried child-base coordinate are not implicitly parent stations.
   * @evidence contracts/common.md#meaningful-documentation All positions and physical source stations use calibration mm.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Data performs no work.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work The factory owns source admission and plane inversion.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The composition owns the actual parent and original scalar preparation.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation An original parent section selected by a plane query or actual cap contact.
   * @evidence contracts/development/design.md#principled-representation `part`: Identical original parent, never a realized mesh. `source`: Complete original signed-support/fullness/cap family. `point`: World query point; only a non-null parameter certifies a bracketed native surface contact.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanHeadDomeHost.attachment, AutoMovieHumanHeadDomeHost.contact, AutoMovieHumanHeadDomeHost.locate. Read by AutoMovieHumanHeadDomeHost.radius. Also types AutoMovieHumanHeadDomeHost.fixed, AutoMovieHumanHeadDomeHost.read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `part`, `source`, `point`, `station`, `frame`, `parameter`; callers supply the complete record.
   */
  export interface IHost {
    /** Identical original parent, never a realized mesh. */
    part: IAutoMovieViewPart;
    /** Complete original signed-support/fullness/cap family. */
    source: IAutoMovieLoftViewSource.ISource;
    /** World query point; only a non-null parameter certifies a bracketed native surface contact. */
    point: [number, number, number];
    /** Actual parent source station whose plane contains that attachment. */
    station: number;
    /** The actual parent plane at that station. */
    frame: IAutoMovieLoftFrame.IFrame;
    /** Distance along the unchanged nominal child axis, mm; null for a plane-only query. */
    parameter: number | null;
  }
}
