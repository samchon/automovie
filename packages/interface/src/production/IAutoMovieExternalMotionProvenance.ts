import { IAutoMovieExternalMotionBasis } from "./IAutoMovieExternalMotionBasis";
import { IAutoMovieExternalMotionTake } from "./IAutoMovieExternalMotionTake";

/**
 * Byte-grounded motion facts recorded for an external animation asset.
 *
 * This is an inventory, not a take or retarget decision. Those choices remain in {@link IAutoMovieExternalMotionAdoption}.
 *
 * @evidence contracts/common.md#principled-implementation The gltf-motion profile retains declared hierarchy/rest basis and source-order take observations on asset provenance. The production byte-comparison/adoption reader is retired; current inspection and ledger agreement require explicit host preparation and are not proven by this record.
 * @evidence contracts/common.md#clear-and-simple-design Provenance keeps byte observations separate from actor, clip and retarget decisions, allowing one asset inventory to support multiple explicit adoptions without mutating source facts.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Declaring inspected takes does not select the first animation or infer a target actor, and model-only normalization profiles cannot masquerade as motion provenance.
 * @evidence contracts/common.md#meaningful-documentation Defines the motion-only ingest profile, resident-byte basis, stable take ordering and the explicit separation between inventory and user adoption.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionProvenance {
  /** Versioned ingest normalization profile selected for these bytes. */
  ingestProfile: "gltf-motion-v1";

  /**
   * Canonical hierarchy and rest basis inspected from the resident source bytes.
   */
  basis: IAutoMovieExternalMotionBasis;

  /** Inspected animation takes in source index order. */
  takes: IAutoMovieExternalMotionTake[];
}
