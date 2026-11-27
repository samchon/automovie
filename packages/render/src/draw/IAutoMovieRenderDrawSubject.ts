import type { IAutoMovieRenderDrawScene } from "./IAutoMovieRenderDrawScene";

/**
 * One subject a draw page offers: something that prepares a fresh scene to
 * draw.
 *
 * A subject module offers its subjects by name through `AutoMovieRenderDrawSubjects`,
 * and the page's draw function creates the one the host names once, when it is
 * first described or drawn.
 */
export interface IAutoMovieRenderDrawSubject {
  /** Prepare the subject's scene for one page. */
  create(): Promise<IAutoMovieRenderDrawScene>;
}
