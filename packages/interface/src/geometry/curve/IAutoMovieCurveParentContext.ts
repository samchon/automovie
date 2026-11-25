import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMovieCurveBoundary64 } from "./IAutoMovieCurveBoundary64";
import type { IAutoMovieCurveBoundaryPublication64 } from "./IAutoMovieCurveBoundaryPublication64";
import type { IAutoMovieCurveHierarchyFrame64 } from "./IAutoMovieCurveHierarchyFrame64";

/**
 * Resolve a parent-first proper rigid hierarchy before constructing controls,
 * then authenticate named boundary sharing within this exact context. Points
 * use millimetres; rotations preserve the units of directions and derivative
 * vectors. Composition accumulates binary64 roundoff, so a transpose inverse is
 * subject to the admitted-basis tolerance and accumulated error.
 */
export interface IAutoMovieCurveParentContext {
  /**
   * JSON serialization of resolved frames and edges in insertion order; equal
   * strings do not authenticate another context's copied operator.
   */
  readonly revision: string;

  /**
   * Rotate a finite local vector into world coordinates without translation,
   * preserving its physical units.
   */
  direction(
    bone: string,
    vector: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple>;

  /**
   * Transform a finite local millimetre point to world millimetres using the
   * resolved affine matrix.
   */
  point(
    bone: string,
    point: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple>;

  /**
   * Rotate a finite world vector back to a node chart with the transpose of its
   * resolved proper rotation.
   */
  inverseDirection(
    bone: string,
    vector: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple>;

  /**
   * Pull a world millimetre point into the node chart by subtracting world
   * translation and applying the inverse direction transform.
   */
  inversePoint(
    bone: string,
    point: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple>;

  /**
   * Return an independent copy of a resolved world frame, with the original
   * node and parent keys preserved.
   */
  frame(bone: string): IAutoMovieCurveHierarchyFrame64;

  /**
   * Admit an owner boundary once, clone and deep-freeze its complete field,
   * then retain the genuine token for later binding. Deep freezing expects the
   * supported acyclic plain coefficient record; arbitrary cyclic extra
   * properties are outside this input contract.
   */
  publish(
    region: string,
    bone: string,
    boundary: IAutoMovieCurveBoundary64,
  ): IAutoMovieCurveBoundaryPublication64;

  /**
   * Authenticate the declared consumer against this context's genuine
   * publication and return the same immutable boundary object.
   */
  bind(
    region: string,
    bone: string,
    operator: IAutoMovieCurveBoundaryPublication64,
  ): IAutoMovieCurveBoundary64;
}
