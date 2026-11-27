import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A named region of a set, so a scene moves a subject "to the corner" or "to
 * the centre" without coordinates: a centre and a radius on the floor, with
 * optional named landmarks. `resolveZone` reads its points. The caller
 * admits finite centre, nonnegative finite radius and landmark coordinates.
 * Resolution validates the requested zone/landmark and radial share, but
 * neither checks zone geometry nor landmark containment.
 */
export interface IAutoMovieZone {
  /** Stable zone id. */
  id: string;

  /** Floor centre, world metres. */
  center: IAutoMovieVector3;

  /** Radius a subject may stand within, metres; nonnegative. */
  radius: number;

  /**
   * Named set points in world metres, not centre-relative offsets. Absence
   * provides no named landmarks; resolution returns a fresh coordinate copy.
   */
  landmarks?: Readonly<Record<string, IAutoMovieVector3>>;
}
