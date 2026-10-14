import type { IAutoMovieMeshSeparationQuery } from "@automovie/engine";

/**
 * The two compiled separation readers of one hair host skin.
 *
 * `source` reads the binary64 resident snapshot and `represented` its exact Float32 buffer preimage. Both are compiled once by the hair builder from the same current skin, so a complete row or cell is certified only when both frames prove the requested gap. The readers are pure over their immutable snapshots apart from spending the caller's shared budget.
 *
 * @evidence contracts/common.md#principled-implementation Two readers expose the binary64 source skin and exact Float32 buffer preimage of the same current host.
 * @evidence contracts/common.md#clear-and-simple-design The builder compiles both once and requires both to prove row or cell separation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts CPU separation under these representations does not certify arbitrary GPU transforms or visible appearance.
 * @evidence contracts/common.md#meaningful-documentation source and represented name their distinct coordinate snapshots while sharing the caller's query budget convention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Compiled mesh separation work belongs to the query owners, not this pair type.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The builder shares each reader across its lock checks and replaces them when current geometry changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The builder owns both immutable snapshots; this record holds references without an independent disposal operation.
 *
 * @author Samchon
 */
export interface IHumanFaceHairSeparationReaders {
  /** Separation reader over the binary64 source skin snapshot. */
  source: IAutoMovieMeshSeparationQuery;

  /** Separation reader over the exact Float32 representation of that skin. */
  represented: IAutoMovieMeshSeparationQuery;
}
