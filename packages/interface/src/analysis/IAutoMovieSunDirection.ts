import type { IAutoMovieEnvironmentContext } from "./IAutoMovieEnvironmentContext";
import type { IAutoMovieSunPosition } from "./IAutoMovieSunPosition";

/**
 * Data contracts of `sunDirection`, which turns a solved sun position
 * into a world direction.
 */
export namespace IAutoMovieSunDirection {
  /**
   * The site's orientation and the sun position to orient.
   *
   * Only the context's `north` and `ground.up` are read, so a production that
   * stages a sun without an analysis study supplies just those two directions.
   */
  export type IProps = {
    /**
     * World north and ground up of the site. Both finite and non-zero, as
     * `validateEnvironmentContext` admits them; `north` must not be
     * parallel to `ground.up`.
     */
    context: Pick<IAutoMovieEnvironmentContext, "north" | "ground">;

    /** The sun's place in the sky, from `solveSunPosition`. */
    position: IAutoMovieSunPosition;
  };
}
