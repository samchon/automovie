import type { IAutoMovieVector3 } from "@automovie/interface";

/** Contact-manifold witness contracts. */
export namespace AutoMovieEnginePhysicsContactTypes {
  /** One patch point with its witness on each shape, world metres. */
  export interface IPoint {
    /** The first shape's witness. */
    pointA: IAutoMovieVector3;

    /** The second shape's witness. */
    pointB: IAutoMovieVector3;
  }
}