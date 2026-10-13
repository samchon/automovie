import { IAutoMovieOpeningOperation } from "./IAutoMovieOpeningOperation";
import { IAutoMovieOpeningProfile } from "./IAutoMovieOpeningProfile";

/** One traversable or visible opening through a boundary. */
export interface IAutoMovieBuiltOpening {
  /** Stable opening identity. */
  id: string;

  /** Open semantic label such as `door`, `window`, `arch`, or `passage`. */
  kind: string;

  /** Boundary containing this opening. */
  boundary: string;

  /** Door, sash, gate, or other filling element; null for an open cut. */
  fill: string | null;

  /**
   * The void this opening actually cuts in its host boundary's face.
   *
   * Omitting it keeps the pre-geometry record: the opening is a declared
   * relation and nothing is checked about where it is. Stating it demands the
   * host carry a {@link IAutoMovieBuiltBoundary.face}, and the void is then held
   * inside that face and apart from every other void on it.
   */
  profile?: IAutoMovieOpeningProfile;

  /**
   * Movable panels and the named states they stand in, or nothing for a fixed
   * cut such as an arch or a permanently open passage.
   */
  operation?: IAutoMovieOpeningOperation;
}
