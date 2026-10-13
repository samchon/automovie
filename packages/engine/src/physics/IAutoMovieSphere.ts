import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A world-space sphere collider: the simplest body to test a hit against (an
 * arrow vs. a rider's torso). Cheap, rotation-free, and enough to answer the
 * one question a strike needs: _did it connect, and when?_
 *
 * @author Samchon
 */
export interface IAutoMovieSphere {
  /** Sphere center in world space. */
  center: IAutoMovieVector3;
  /** Positive radius in world meters. */
  radius: number;
}
