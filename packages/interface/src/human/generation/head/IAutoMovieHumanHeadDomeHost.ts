import type { IAutoMovieLoftSectionFrame } from "../../../construction/IAutoMovieLoftSectionFrame";
import type { IAutoMovieLoftViewSource } from "../../../construction/IAutoMovieLoftViewSource";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * Type contracts exchanged by AutoMovieHumanHeadDomeHost; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanHeadDomeHost exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IHost. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanHeadDomeHost; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IHost contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanHeadDomeHost {
  /**
   * An original parent section selected by a plane query or actual cap contact.
   *
   * The composition owns the actual parent and original scalar preparation.
   *
   * @evidence contracts/development/design.md#principled-representation Carries the complete admitted source, query point, actual station/frame and an explicit distinction between plane incidence and a bracketed surface contact. `part`: Identical original parent, never a realized mesh. `source`: Complete original signed-support/fullness/cap family. `point`: World query point; only a non-null parameter certifies a bracketed native surface contact.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Keeps the parent-plane datum separate from the child's nominal base and embedding offset. Returned by AutoMovieHumanHeadDomeHost.attachment, AutoMovieHumanHeadDomeHost.contact, AutoMovieHumanHeadDomeHost.locate. Read by AutoMovieHumanHeadDomeHost.radius. Also types AutoMovieHumanHeadDomeHost.fixed, AutoMovieHumanHeadDomeHost.read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts World height and a buried child-base coordinate are not implicitly parent stations. Required fields are `part`, `source`, `point`, `station`, `frame`, `parameter`; callers supply the complete record.
   * @evidence contracts/development/common.md#meaningful-documentation All positions and physical source stations use calibration mm. An original parent section selected by a plane query or actual cap contact.
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
    frame: IAutoMovieLoftSectionFrame;
    /** Distance along the unchanged nominal child axis, mm; null for a plane-only query. */
    parameter: number | null;
  }
}
