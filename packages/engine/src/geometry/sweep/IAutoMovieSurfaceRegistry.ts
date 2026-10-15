import { IAutoMovieSurfaceSample } from "./IAutoMovieSurfaceSample";

/**
 * The vertices of a surface rig by identity, each with the writer that
 * evaluates it per pose, from `registerAutoMovieSurfaceVertices`.
 *
 * @evidence contracts/common.md#principled-implementation Vertices welded by exact identity, each bound once to the evaluation that places it.
 * @evidence contracts/common.md#clear-and-simple-design One map from identity to index and one ordered list of writers, which runs in dependency order because a vertex is registered after everything it reads.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is welded by distance; `existing` refuses an identity no patch made.
 * @evidence contracts/common.md#meaningful-documentation States the identity rule, the writer order and the finalization of sweep points.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; costs are on its producer.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record; it is the reuse.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record owned by its rig.
 * @author Samchon
 */
export interface IAutoMovieSurfaceRegistry {
  /** Writers in registration order, each filling its vertices into a target buffer. */
  writers: Array<(targets: Float64Array) => void>;

  /**
   * Number of vertices registered so far.
   *
   * @returns The count
   *
   * @evidence contracts/common.md#principled-implementation The number of vertices welded so far.
   * @evidence contracts/common.md#clear-and-simple-design One read.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is counted twice.
   * @evidence contracts/common.md#meaningful-documentation States what is counted.
   * @evidence contracts/performance.md#efficient-algorithms Constant time.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `registerAutoMovieSurfaceVertices`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `registerAutoMovieSurfaceVertices`.
   */
  count(): number;

  /**
   * Register a vertex whose writer the caller adds, such as a blend's interior.
   *
   * @param key Identity, not yet registered
   * @returns Its index
   *
   * @evidence contracts/common.md#principled-implementation Registers a vertex whose evaluation the caller owns.
   * @evidence contracts/common.md#clear-and-simple-design One call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The key must be new; callers reserve only unique blend keys.
   * @evidence contracts/common.md#meaningful-documentation States the premise.
   * @evidence contracts/performance.md#efficient-algorithms One map write.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `registerAutoMovieSurfaceVertices`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `registerAutoMovieSurfaceVertices`.
   */
  reserve(key: string): number;

  /**
   * Register a point by identity, making its writer only when it is new.
   *
   * @param key Identity
   * @param make Makes the point's writer
   * @returns Its index
   *
   * @evidence contracts/common.md#principled-implementation Welds a point by identity and binds its writer once.
   * @evidence contracts/common.md#clear-and-simple-design One call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Points are never welded by distance.
   * @evidence contracts/common.md#meaningful-documentation States when the writer is made.
   * @evidence contracts/performance.md#efficient-algorithms One map read, and a write when new.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `registerAutoMovieSurfaceVertices`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `registerAutoMovieSurfaceVertices`.
   */
  vertex(key: string, make: () => (out: Float64Array, at: number) => void): number;

  /**
   * Register a sampled point: a sweep point narrows its cell by the spacing this sampling reports, any other point is registered as `vertex` does.
   *
   * @param sample The sample
   * @returns Its index
   *
   * @evidence contracts/common.md#principled-implementation Welds a sampled point, narrowing a sweep point's cell.
   * @evidence contracts/common.md#clear-and-simple-design One call per sampling.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A sweep point's cell does not depend on which patch came first.
   * @evidence contracts/common.md#meaningful-documentation States both kinds of point.
   * @evidence contracts/performance.md#efficient-algorithms One map read and a constant-size update.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `registerAutoMovieSurfaceVertices`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `registerAutoMovieSurfaceVertices`.
   */
  admit(sample: IAutoMovieSurfaceSample): number;

  /**
   * Make every sweep point's writer from its finest reported spacing on each side, a side no sampling reached mirroring the other.
   *
   * @evidence contracts/common.md#principled-implementation Makes each sweep point's writer from its final cell.
   * @evidence contracts/common.md#clear-and-simple-design One call after all patches.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A side no sampling reached mirrors the other rather than defaulting.
   * @evidence contracts/common.md#meaningful-documentation States the mirror and zero rules.
   * @evidence contracts/performance.md#efficient-algorithms O(1) per sweep point.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `registerAutoMovieSurfaceVertices`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `registerAutoMovieSurfaceVertices`.
   */
  finalize(): void;

  /**
   * Index of a registered identity.
   *
   * @param key Identity
   * @param what What names it, for the diagnostic
   * @returns Its index
   * @throws Error when no patch made it
   *
   * @evidence contracts/common.md#principled-implementation Looks up a welded identity.
   * @evidence contracts/common.md#clear-and-simple-design One call.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts An identity no patch made is refused.
   * @evidence contracts/common.md#meaningful-documentation States the refusal.
   * @evidence contracts/performance.md#efficient-algorithms One map read.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work A signature; reuse is answered on `registerAutoMovieSurfaceVertices`.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A signature; retention is answered on `registerAutoMovieSurfaceVertices`.
   */
  existing(key: string, what: string): number;
}
