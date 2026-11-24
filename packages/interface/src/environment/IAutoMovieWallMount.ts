import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * A staged set piece placed against a wall, with that wall's inner face in
 * world metres.
 *
 * A furnishing producer emits one for each piece a `wall` relation placed, so a
 * support check can judge a piece that does not rest on a surface, such as a
 * wall mirror, against the wall it hangs on.
 */
export interface IAutoMovieWallMount {
  /** Staged node of the piece, as in its `IAutoMovieStageSetPiece`. */
  readonly node: string;

  /** Stable wall id, `<room occurrence id>/walls/<wall>`. */
  readonly wall: string;

  /** A world point on the wall's inner face, in metres. */
  readonly point: IAutoMovieVector3;

  /** World unit normal of the inner face, pointing into the room. */
  readonly normal: IAutoMovieVector3;
}
