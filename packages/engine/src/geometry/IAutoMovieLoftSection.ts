import { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/**
 * One station of a loft: where it sits along the path and what it looks like.
 */
export interface IAutoMovieLoftSection {
  /**
   * Where the section sits along the path, `0` at its first point and `1` at
   * its last, measured by chord length.
   */
  at: number;
  /** The enclosing ring, in the path frame's right / up axes, in metres. */
  outer: readonly IAutoMovieProfilePoint[];
  /** Rings removed from the section; omitted means a solid section. */
  holes?: ReadonlyArray<readonly IAutoMovieProfilePoint[]>;
}
