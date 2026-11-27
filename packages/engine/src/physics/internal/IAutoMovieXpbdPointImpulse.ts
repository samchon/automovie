import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieEngineXpbdBody } from "../AutoMovieEngineXpbdBody";

/** A unit positional impulse at a point of a body. */
export interface IAutoMovieXpbdPointImpulse {
  /** The body. */
  body: AutoMovieEngineXpbdBody;

  /** The world point it acts at, metres. */
  point: IAutoMovieVector3;

  /** Its unit world direction. */
  direction: IAutoMovieVector3;
}
