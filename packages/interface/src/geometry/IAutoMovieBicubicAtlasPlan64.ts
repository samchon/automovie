import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";
import type { IAutoMovieBicubicAtlas64 } from "./IAutoMovieBicubicAtlas64";
import type { IAutoMoviePrepareBicubicAtlasBoundary64 } from "./IAutoMoviePrepareBicubicAtlasBoundary64";

/** Admitted atlas preparation and shared per-invocation vertex accounting. */
export namespace IAutoMovieBicubicAtlasPlan64 {
  /**
   * Prepared boundary authorities, patch plans and render-vertex accounting for
   * one millimetre atlas invocation. Keep borrowed control and binding data
   * stable from planning through emission. Invalid control ordinals cause
   * structural refusal. An arithmetic omission still retains its patch's plan
   * slot.
   */
  export type IResult = {
    /**
     * Admitted canonical authority/control bindings shared by planning,
     * registry and emission. Retain their identity throughout this generator
     * invocation.
     */
    boundary: IAutoMoviePrepareBicubicAtlasBoundary64.IResult;
    /**
     * Per-invocation cache mapping physical identity then normal-fan identity
     * to an emitted render vertex. Different normal fans can share a position
     * identity without sharing a render index.
     */
    fanVertices: Map<string, Map<string, IAutoMovieBicubicAtlas64.Vertex>>;
    /**
     * Euclidean norm of three components in their original unit. This
     * arithmetic helper assumes its caller owns numeric admission.
     */
    norm: (p: AutoMovieVector3Tuple) => number;
    /**
     * Three-dimensional cross product returning a new tuple. Output units are
     * the product of operand units; this callback does not normalize the
     * result.
     */
    cross: (
      a: AutoMovieVector3Tuple,
      b: AutoMovieVector3Tuple,
    ) => AutoMovieVector3Tuple;
    /**
     * One adaptive plan per input patch in input order, sharing the admitted
     * global cell budget. Empty or incomplete cells and diagnostics remain
     * visible for omitted work.
     */
    plans: IAutoMovieBicubicAtlas64.Plan[];
  };
}
