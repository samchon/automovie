import type { IAutoMovieVector3 } from "../../geometry/IAutoMovieVector3";

/**
 * A named region of a set, so a scene moves a subject "to the corner" or
 * "to the centre" without coordinates: a centre and a radius on the floor,
 * with optional named landmarks. `resolveAutoMovieZone` reads
 * its points.
 * The caller admits finite centre, nonnegative finite radius and landmark
 * coordinates. Resolution validates the requested zone/landmark and radial
 * share, but neither checks zone geometry nor landmark containment.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives world metre geometry and clarifies that landmarks are absolute and need not be containment-checked.
 * @evidence contracts/development/design.md#principled-representation A zone has a centre and nonnegative radius for polar selection; finite geometry and unique intended ids are caller obligations, not resolver validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Production set descriptions own these values; resolveAutoMovieZone finds the first matching id and returns coordinate copies.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Optional landmarks add named points without introducing another competing definition of the centre or radius.
 */
export interface IAutoMovieZone {
  /** Stable zone id. */
  id: string;

  /** Floor centre, world metres. */
  center: IAutoMovieVector3;

  /** Radius a subject may stand within, metres; nonnegative. */
  radius: number;

  /** Named set points in world metres, not centre-relative offsets. Absence provides no named landmarks; resolution returns a fresh coordinate copy. */
  landmarks?: Readonly<Record<string, IAutoMovieVector3>>;
}
