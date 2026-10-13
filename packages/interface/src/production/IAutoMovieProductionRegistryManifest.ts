
/**
 * Compiler-owned registry of current targets that evidence tools may resolve.
 *
 * @evidence contracts/common.md#principled-implementation Generated model and shot target ids map to their materialized artifact paths under one production namespace and compile fingerprint; film remains null until its canonical edit is materialized.
 * @evidence contracts/common.md#clear-and-simple-design A compact target index supplies evidence addressing without duplicating model, shot or film payloads in the registry.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Registry entries identify current builder-owned artifacts, not arbitrary filesystem paths or proof of visual review; compile freshness and generated-byte ownership still gate resolution.
 * @evidence contracts/common.md#meaningful-documentation Defines registry version, builder and production identity, aggregate input binding, generated target paths and nullable film identity.
 * @author Samchon
 */
export interface IAutoMovieProductionRegistryManifest {
  /** Registry format. */
  version: 2;

  /** Compiler protocol that produced this registry. */
  builder: string;

  /** Exact production namespace. */
  productionId: string;

  /** Current aggregate builder input fingerprint. */
  inputFingerprint: string;

  /** Built model/asset targets with their generated paths. */
  assets: Array<{
    /** Exact model recipe id. */
    id: string;

    /** Compiler-owned generated model path. */
    path: string;
  }>;

  /** Built shot targets with their generated paths. */
  shots: Array<{
    /** Exact shot registration id. */
    id: string;

    /** Compiler-owned generated shot path. */
    path: string;
  }>;

  /** Current builder-owned film id, or null before film materialization. */
  film: string | null;
}
