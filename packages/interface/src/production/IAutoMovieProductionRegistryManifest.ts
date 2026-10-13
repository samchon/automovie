import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/** Compiler-owned registry of targets that evidence tools may resolve. */
export interface IAutoMovieProductionRegistryManifest {
  /** Registry format. */
  version: 2;

  /** Compiler protocol that produced this registry. */
  builder: string;

  /** Exact production namespace. */
  productionId: string;

  /** Current aggregate builder input fingerprint. */
  inputFingerprint: AutoMovieContentDigest;

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
