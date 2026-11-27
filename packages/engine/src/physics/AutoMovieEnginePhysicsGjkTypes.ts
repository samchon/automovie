import type { IAutoMovieVector3 } from "@automovie/interface";

/** Type-only contracts for support-mapped convex-solid distance queries. */
export namespace AutoMovieEnginePhysicsGjkTypes {
  /** World support point in the given direction. */
  export type Support = (direction: IAutoMovieVector3) => IAutoMovieVector3;

  /** A convex solid: the convex hull of its core's points widened by a radius. */
  export interface ISolid {
    /** The core's points, world metres; at least one. */
    points: readonly IAutoMovieVector3[];

    /** The radius the core is widened by, metres. */
    radius: number;
  }

  /** Bounds on two solids' signed distance. */
  export interface IBound {
    /** A lower bound, metres; negative infinity where the cores meet, so no bound below is known. */
    lower: number;

    /** An upper bound, metres. */
    upper: number;
  }
}