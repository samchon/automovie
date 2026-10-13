import { IAutoMovieGeneratedAcquisition } from "../architecture/IAutoMovieGeneratedAcquisition";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieAssetLicense } from "./IAutoMovieAssetLicense";
import { IAutoMovieAssetProcessingStep } from "./IAutoMovieAssetProcessingStep";
import { IAutoMovieAssetUse } from "./IAutoMovieAssetUse";
import { IAutoMovieExternalModelProvenance } from "./IAutoMovieExternalModelProvenance";
import { IAutoMovieExternalMotionProvenance } from "./IAutoMovieExternalMotionProvenance";

/** Byte identity and consumer bindings for one project asset. */
export interface IAutoMovieAssetProvenance {
  /** Canonical project-relative current asset path. */
  path: string;

  /** SHA-256 of the current bytes at {@link path}. */
  digest: AutoMovieContentDigest;

  /** Optional descriptive record of an earlier source revision. */
  original?: {
    /** Descriptive source location. */
    url: string;

    /** SHA-256 of the acquired original bytes. */
    digest: AutoMovieContentDigest;
  };

  /** Optional descriptive generation record. */
  generated?: IAutoMovieGeneratedAcquisition;

  /** Optional descriptive license metadata. */
  license?: IAutoMovieAssetLicense;

  /** Optional ordered transformations associated with the current bytes. */
  processing?: IAutoMovieAssetProcessingStep[];

  /** Non-empty production usage ledger. */
  uses: IAutoMovieAssetUse[];

  /**
   * Required ingest/LOD/proxy ledger for external glTF, GLB, or VRM assets.
   *
   * Non-model assets omit it.
   */
  model?: IAutoMovieExternalModelProvenance;

  /**
   * Inspected motion facts when these bytes are adopted as animation input.
   * Omitted for non-motion assets; presence never selects a take.
   */
  motion?: IAutoMovieExternalMotionProvenance;
}
