import type { IAutoMovieGeneratedAcquisition } from "../architecture/IAutoMovieGeneratedAcquisition";
import type { IAutoMovieAssetLicense } from "./IAutoMovieAssetLicense";
import type { IAutoMovieAssetProcessingStep } from "./IAutoMovieAssetProcessingStep";
import type { IAutoMovieAssetUse } from "./IAutoMovieAssetUse";
import type { IAutoMovieExternalModelProvenance } from "./IAutoMovieExternalModelProvenance";
import type { IAutoMovieExternalMotionProvenance } from "./IAutoMovieExternalMotionProvenance";

/**
 * Declared byte identity, acquisition metadata and typed uses of one project
 * asset. Current bytes must be verified by the host; original-source and
 * licence facts are descriptive.
 */
export interface IAutoMovieAssetProvenance {
  /** Canonical project-relative current asset path. */
  path: string;

  /** SHA-256 of the current bytes at {@link path}. */
  digest: string;

  /** Optional descriptive record of an earlier source revision. */
  original?: {
    /** Descriptive source location. */
    url: string;

    /** SHA-256 of the acquired original bytes. */
    digest: string;
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
   * Appearance ingest/LOD/proxy ledger for external glTF, GLB or VRM assets.
   *
   * A motion-only glTF-family asset can omit this appearance record. This type
   * has no suffix-dispatched admission after production inventory retirement,
   * and presence alone does not select a model, take or conversion.
   */
  model?: IAutoMovieExternalModelProvenance;

  /**
   * Inspected motion facts when these bytes are adopted as animation input.
   * Omitted for non-motion assets; presence never selects a take.
   */
  motion?: IAutoMovieExternalMotionProvenance;
}
