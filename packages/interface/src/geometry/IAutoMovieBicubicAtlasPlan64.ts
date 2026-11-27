import type { AutoMovieVector3Tuple } from "./AutoMovieVector3Tuple";
import type { IAutoMovieBicubicAtlas64 } from "./IAutoMovieBicubicAtlas64";
import type { IAutoMoviePrepareBicubicAtlasBoundary64 } from "./IAutoMoviePrepareBicubicAtlasBoundary64";

/** Admitted atlas preparation and shared per-invocation vertex accounting. */
export namespace IAutoMovieBicubicAtlasPlan64 {
  /**
   * Prepared canonical coefficients, adaptive leaves and shared
   * arithmetic/cache services for one atlas invocation. Input controls and
   * bindings remain borrowed by boundary closures; keep them unchanged
   * throughout registry and emission.
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
     * Euclidean norm of the supplied three components, preserving their units;
     * no direction normalization or finite-value admission is implied.
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
