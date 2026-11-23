import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMovieCurveBoundary64 } from "./IAutoMovieCurveBoundary64";
import type { IAutoMovieCurveBoundaryPublication64 } from "./IAutoMovieCurveBoundaryPublication64";
import type { IAutoMovieCurveHierarchyFrame64 } from "./IAutoMovieCurveHierarchyFrame64";

/**
 * Resolve a parent-first proper rigid hierarchy before constructing controls, then authenticate named boundary sharing within this exact context. Points use millimetres; rotations preserve the units of directions and derivative vectors. Composition accumulates binary64 roundoff, so a transpose inverse is subject to the admitted-basis tolerance and accumulated error.
 *
 * @evidence contracts/development/design.md#principled-representation Each local row-basis is admitted within 64 epsilons, requires positive determinant, and composes through column-major parent matrices. Binding checks both serialized context revision and exact published object identity.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The constructor resolves all frames and clones all edges before revision serialization; frame/matrix maps own placement while edge/publication maps own routing and token authenticity.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reflections, absent parents, nonfinite transforms and copied/stale operator tokens are refused; no pose fitting or anatomy-specific placement is inserted.
 * @evidence contracts/development/common.md#meaningful-documentation Documents parent-first inputs, millimetre charts, throw-before-use construction failure, copied frame snapshots, immutable shared fields and same-instance publication binding.
 */
export interface IAutoMovieCurveParentContext {
  /**
   * JSON serialization of resolved frames and edges in insertion order; equal strings do not authenticate another context's copied operator.
   */
  readonly revision: string;

  /**
   * Rotate a finite local vector into world coordinates without translation, preserving its physical units.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States local/world charts, unit preservation and failure conditions.
   */
  direction(
    bone: string,
    vector: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple>;

  /**
   * Transform a finite local millimetre point to world millimetres using the resolved affine matrix.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States input/output units and unknown-node/nonfinite failure.
   */
  point(
    bone: string,
    point: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple>;

  /**
   * Rotate a finite world vector back to a node chart with the transpose of its resolved proper rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the world-to-local direction and the orthonormal premise.
   */
  inverseDirection(
    bone: string,
    vector: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple>;

  /**
   * Pull a world millimetre point into the node chart by subtracting world translation and applying the inverse direction transform.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both coordinate charts and millimetre translation.
   */
  inversePoint(
    bone: string,
    point: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple>;

  /**
   * Return an independent copy of a resolved world frame, with the original node and parent keys preserved.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Clarifies that rotation/translation are resolved world values despite the original parent key.
   */
  frame(bone: string): IAutoMovieCurveHierarchyFrame64;

  /**
   * Admit an owner boundary once, clone and deep-freeze its complete field, then retain the genuine token for later binding. Deep freezing expects the supported acyclic plain coefficient record; arbitrary cyclic extra properties are outside this input contract.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States owner authentication, copy/freeze behavior, units inherited from the boundary and same-instance binding.
   */
  publish(
    region: string,
    bone: string,
    boundary: IAutoMovieCurveBoundary64,
  ): IAutoMovieCurveBoundaryPublication64;

  /**
   * Authenticate the declared consumer against this context's genuine publication and return the same immutable boundary object.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States exact-instance authentication and shared-return ownership.
   */
  bind(
    region: string,
    bone: string,
    operator: IAutoMovieCurveBoundaryPublication64,
  ): IAutoMovieCurveBoundary64;
}
