import { IAutoMovieGeneratedAcquisition } from "../architecture/IAutoMovieGeneratedAcquisition";
import { IAutoMovieAssetLicense } from "./IAutoMovieAssetLicense";
import { IAutoMovieAssetProcessingStep } from "./IAutoMovieAssetProcessingStep";
import { IAutoMovieAssetUse } from "./IAutoMovieAssetUse";
import { IAutoMovieExternalModelProvenance } from "./IAutoMovieExternalModelProvenance";
import { IAutoMovieExternalMotionProvenance } from "./IAutoMovieExternalMotionProvenance";

/**
 * Declared byte identity, acquisition metadata and typed uses of one project asset. Current bytes must be verified by the host; original-source and licence facts are descriptive.
 *
 * @evidence contracts/common.md#principled-implementation Engine validateTextureAssets reads these rows to authorize exact production/model or scene image uses and checks host-supplied header facts, stale uses and color intent. It does not hash bytes or admit all consumer kinds; current digest, path safety and acquisition history remain host premises after production inventory retirement.
 * @evidence contracts/common.md#clear-and-simple-design One ledger entry keeps current identity separate from optional original acquisition, generation, licence and ordered processing history, avoiding a false equation between processed bytes and original source bytes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Descriptive source and licence fields cannot prove current byte identity or legal authority; model and motion provenance cannot select an unregistered appearance or animation take merely by being present.
 * @evidence contracts/common.md#meaningful-documentation Defines canonical project path, current and original digest ownership, ordered processing, nonempty live-use ledger, required external-model facts and the nonselecting role of motion inspection metadata.
 * @author Samchon
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
   * A motion-only glTF-family asset can omit this appearance record. This type has no suffix-dispatched admission after production inventory retirement, and presence alone does not select a model, take or conversion.
   */
  model?: IAutoMovieExternalModelProvenance;

  /**
   * Inspected motion facts when these bytes are adopted as animation input. Omitted for non-motion assets; presence never selects a take.
   */
  motion?: IAutoMovieExternalMotionProvenance;
}
