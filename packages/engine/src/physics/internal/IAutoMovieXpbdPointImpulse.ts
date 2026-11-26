import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieXpbdBody } from "../AutoMovieXpbdBody";

/** A unit positional impulse at a point of a body. */
export interface IAutoMovieXpbdPointImpulse {
  /** The body. */
  body: AutoMovieXpbdBody;

  /** The world point it acts at, metres. */
  point: IAutoMovieVector3;

  /** Its unit world direction. */
  direction: IAutoMovieVector3;
}
