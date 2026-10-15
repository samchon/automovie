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
   */
  count(): number;

  /**
   * Register a vertex whose writer the caller adds, such as a blend's interior.
   *
   * @param key Identity, not yet registered
   * @returns Its index
   */
  reserve(key: string): number;

  /**
   * Register a point by identity, making its writer only when it is new.
   *
   * @param key Identity
   * @param make Makes the point's writer
   * @returns Its index
   */
  vertex(key: string, make: () => (out: Float64Array, at: number) => void): number;

  /**
   * Register a sampled point: a sweep point narrows its cell by the spacing this sampling reports, any other point is registered as `vertex` does.
   *
   * @param sample The sample
   * @returns Its index
   */
  admit(sample: IAutoMovieSurfaceSample): number;

  /** Make every sweep point's writer from its finest reported spacing on each side, a side no sampling reached mirroring the other. */
  finalize(): void;

  /**
   * Index of a registered identity.
   *
   * @param key Identity
   * @param what What names it, for the diagnostic
   * @returns Its index
   * @throws Error when no patch made it
   */
  existing(key: string, what: string): number;
}
