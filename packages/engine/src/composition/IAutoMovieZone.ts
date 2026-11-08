import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A named region of a set, so a scene moves a subject "to the corner" or
 * "to the centre" without coordinates: a centre and a radius on the floor,
 * with optional named landmarks inside it. `resolveAutoMovieZone` reads
 * its points.
 */
export interface IAutoMovieZone {
  /** Stable zone id. */
  id: string;

  /** Floor centre, world metres. */
  center: IAutoMovieVector3;

  /** Radius a subject may stand within, metres; nonnegative. */
  radius: number;

  /** Named points of the set inside the zone, world metres. */
  landmarks?: Readonly<Record<string, IAutoMovieVector3>>;
}
