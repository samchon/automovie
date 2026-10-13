import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The world-space axis-aligned box a camera must contain to show a subject.
 *
 * Structurally the same record a compiled formation states its bounds in, so a
 * unit's own bounds pass straight through here without a conversion that could
 * disagree with them. It is spelled separately because a subject is not only a
 * formation: two actors, a prop and a crowd together, or one figure, all reduce
 * to the same box, and the framing solve reads nothing else.
 *
 * @author Samchon
 */
export interface IAutoMovieSubjectBox {
  /** Minimum world corner. */
  min: IAutoMovieVector3;

  /** Maximum world corner. */
  max: IAutoMovieVector3;
}
