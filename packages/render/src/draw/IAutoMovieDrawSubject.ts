import type { IAutoMovieDrawScene } from "./IAutoMovieDrawScene.js";

/**
 * One subject a draw page offers: something that prepares a fresh scene to
 * draw.
 *
 * A subject module offers its subjects by name through `AutoMovieDrawSubjects`,
 * and the page's draw function creates the one the host names once, when it is
 * first described or drawn.
 */
export interface IAutoMovieDrawSubject {
  /** Prepare the subject's scene for one page. */
  create(): Promise<IAutoMovieDrawScene>;
}
