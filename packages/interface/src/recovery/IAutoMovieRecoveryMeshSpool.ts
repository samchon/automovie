import type {
  IAutoMovieByteDigest,
  IAutoMovieFileReceipt,
  IAutoMovieLocalHermiteStream64,
  IAutoMovieMesh,
  IAutoMovieRecoveryMeshChunkOwner,
  IAutoMovieRecoveryMeshCounts,
} from "..";

/**
 * Run-owned append-only mesh channels and immutable prefix publication ports.
 * The exposed arrays are identity placeholders:
 * createRecoveryMeshSpool keeps generated values in pending buffers
 * and persisted fragments, and publish substitutes those fragments when
 * serializing these exact array objects. Consumers must not treat their empty
 * resident lengths as the mesh population; counts is the live mutable
 * population record. Pending channels are bounded, while fragment/frontier
 * descriptors and immutable lineage files grow with output.
 */

export interface IAutoMovieRecoveryMeshSpool {
  /** Append-only generated mesh placeholders. */
  mesh: IAutoMovieMesh;

  /** Generated construction placeholders backed by persisted fragments. */
  construction: object[];

  /** Generated domain ownership placeholders. */
  ownership: object[];

  /** Current appended populations. */
  counts: IAutoMovieRecoveryMeshCounts;

  /** Append one admitted globally indexed engine chunk. */
  append: (
    chunk: IAutoMovieLocalHermiteStream64.Chunk,
    owner: IAutoMovieRecoveryMeshChunkOwner,
  ) => void;

  /** Flush all channels and publish a closed journal frontier. */
  commit: (output: string, context: object) => IAutoMovieFileReceipt;

  /** Publish an artifact using the same immutable fragment sources. */
  publish: (output: string, artifact: object) => IAutoMovieByteDigest;
}
