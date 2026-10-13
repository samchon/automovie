import { IAutoMovieExternalMotionBasis } from "./IAutoMovieExternalMotionBasis";
import { IAutoMovieExternalMotionTake } from "./IAutoMovieExternalMotionTake";

/**
 * Byte-grounded motion facts recorded for an external animation asset.
 *
 * This is an inventory, not a take or retarget decision. Those choices remain
 * in {@link IAutoMovieExternalMotionAdoption}.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionProvenance {
  /** Versioned ingest normalization profile selected for these bytes. */
  ingestProfile: "gltf-motion-v1";

  /**
   * Canonical hierarchy and rest basis inspected from the resident source
   * bytes.
   */
  basis: IAutoMovieExternalMotionBasis;

  /** Inspected animation takes in source index order. */
  takes: IAutoMovieExternalMotionTake[];
}
