import type { IAutoMovieVector3 } from "@automovie/interface";

/** Shape wire contracts for exact pair-distance queries. */
export namespace AutoMovieEnginePhysicsPairDistanceTypes {
  /** A shape's wire frame in its own frame: segments widened by a radius. */
  export interface IWires {
    /** The segments, shape-local metres; a point is a segment of no length. */
    segments: readonly (readonly [IAutoMovieVector3, IAutoMovieVector3])[];

    /** The radius the segments are widened by, metres. */
    radius: number;
  }
}