import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * One head measurement read on a person's skin at rest: the value and the
 * points the instrument touched, so the reading can be marked on a render.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanHeadReading {
  /** The measured value, metres. */
  metres: number;

  /** The points the instrument touched, by role (`vertex`, `euryon-right`, ...), metres. */
  points: Record<string, IAutoMovieVector3>;
}
