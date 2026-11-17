import type { AutoMovieVector3Tuple } from "../AutoMovieVector3Tuple";
import type { IAutoMovieCurve64 } from "./IAutoMovieCurve64";

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
   * @evidence contracts/development/implementation.md#principled-implementation Resolved rotation-row dot products apply the admitted local-to-world proper basis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Direction transformation is separate from point translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown nodes and nonfinite results throw rather than returning a default axis.
   * @evidence contracts/development/common.md#meaningful-documentation States local/world charts, unit preservation and failure conditions.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed 3-by-3 arithmetic and one vector allocation, O(1).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the constructor-resolved basis rather than recomposing the hierarchy.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new vector and retains neither the input nor the result.
   */
  direction(
    bone: string,
    vector: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple>;

  /**
   * Transform a finite local millimetre point to world millimetres using the resolved affine matrix.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Matrix4.transformPoint applies the stored proper local-to-world matrix including millimetre translation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The point path owns translation while direction owns rotation alone.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No generated-curve fitting or later compensating placement occurs here.
   * @evidence contracts/development/common.md#meaningful-documentation States input/output units and unknown-node/nonfinite failure.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed 4-by-4 point transform and a new tuple, O(1).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the matrix resolved once during context construction.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The new point belongs to the caller; the input is not retained.
   */
  point(
    bone: string,
    point: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple>;

  /**
   * Rotate a finite world vector back to a node chart with the transpose of its resolved proper rotation.
   *
   * @evidence contracts/development/implementation.md#principled-implementation For the admitted orthonormal basis, transpose is the inverse; binary64 orthogonality tolerance remains the constructor premise.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The inverse direction path avoids applying a translation or constructing a generic matrix inverse.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown nodes and unresolved arithmetic throw; no direction is normalized or clamped.
   * @evidence contracts/development/common.md#meaningful-documentation States the world-to-local direction and the orthonormal premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed 3-by-3 products, O(1) time and one vector.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the retained resolved rotation instead of rebuilding or inverting the hierarchy.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only a new result tuple is allocated; no inverse-query state is retained.
   */
  inverseDirection(
    bone: string,
    vector: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple>;

  /**
   * Pull a world millimetre point into the node chart by subtracting world translation and applying the inverse direction transform.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The inverse of a rigid affine transform is R-transpose times the translated point.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses inverseDirection so the proper-basis inverse has one implementation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown nodes and nonfinite subtraction/rotation fail through the same checks as direction conversion.
   * @evidence contracts/development/common.md#meaningful-documentation States both coordinate charts and millimetre translation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three subtractions plus one fixed inverse direction operation, O(1).
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses stored world translation and the shared inverseDirection method.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Temporary difference/result tuples are caller-local and not retained.
   */
  inversePoint(
    bone: string,
    point: Readonly<AutoMovieVector3Tuple>,
  ): Readonly<AutoMovieVector3Tuple>;

  /**
   * Return an independent copy of a resolved world frame, with the original node and parent keys preserved.
   *
   * @evidence contracts/development/implementation.md#principled-implementation A structured clone prevents callers from mutating the context-owned resolved basis and translation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The snapshot exposes one node without exposing the retained maps.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Unknown nodes throw instead of synthesizing a root or default frame.
   * @evidence contracts/development/common.md#meaningful-documentation Clarifies that rotation/translation are resolved world values despite the original parent key.
   * @evidence contracts/development/implementation.md#efficient-algorithms One fixed-size frame clone, O(1) excluding key string lengths.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The resolved frame is reused as the snapshot source; returned snapshots are independent.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the clone and the context retains only its original frame.
   */
  frame(bone: string): IAutoMovieCurve64.Frame;

  /**
   * Admit an owner boundary once, clone and deep-freeze its complete field, then retain the genuine token for later binding. Deep freezing expects the supported acyclic plain coefficient record; arbitrary cyclic extra properties are outside this input contract.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Declared region/node/ID ownership is checked before a cloned field is recursively frozen and paired with the context revision.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Publication is the sole writer of the token map and owns immutable field sharing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A repeated or wrong owner fails; equal copied data is not a substitute for the actual publication.
   * @evidence contracts/development/common.md#meaningful-documentation States owner authentication, copy/freeze behavior, units inherited from the boundary and same-instance binding.
   * @evidence contracts/development/implementation.md#efficient-algorithms For B boundary entries, admission, clone and recursive freeze cost O(B); map lookup is keyed by ID.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All later consumers bind the same frozen field rather than cloning or regenerating its coefficients.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The context retains at most one token and coefficient clone per declared edge until the context is released.
   */
  publish(
    region: string,
    bone: string,
    boundary: IAutoMovieCurve64.Boundary,
  ): IAutoMovieCurve64.Operator;

  /**
   * Authenticate the declared consumer against this context's genuine publication and return the same immutable boundary object.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Edge endpoint checks, revision equality and publication-map object identity jointly authenticate the token.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One method owns consumer authorization without copying the shared field.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Forged, stale or wrong-owner/consumer tokens throw; matching serialized data alone does not grant access.
   * @evidence contracts/development/common.md#meaningful-documentation States exact-instance authentication and shared-return ownership.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed keyed lookups and scalar/key comparisons; no coefficient traversal or clone.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Returns the published field instance reused across dependent constructors.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The operation adds no retained references or handles; existing context publication ownership is unchanged.
   */
  bind(
    region: string,
    bone: string,
    operator: IAutoMovieCurve64.Operator,
  ): IAutoMovieCurve64.Boundary;
}
