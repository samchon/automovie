import type { IAutoMovieHumanPersonSourceSurface } from "./IAutoMovieHumanPersonSourceSurface";

/**
 * The two complementary skin surfaces whose source partitions are admitted
 * together: the face's and the body's.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanPersonSourcePartitionsProps {
  /** The face's skin surface. */
  face: IAutoMovieHumanPersonSourceSurface;

  /** The body's skin surface. */
  body: IAutoMovieHumanPersonSourceSurface;
}
