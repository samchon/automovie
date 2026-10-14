import { IAutoMovieGeneratedAcquisition } from "../architecture/IAutoMovieGeneratedAcquisition";
import { IAutoMovieAssetLicense } from "./IAutoMovieAssetLicense";
import { IAutoMovieAssetProcessingStep } from "./IAutoMovieAssetProcessingStep";
import { IAutoMovieAssetUse } from "./IAutoMovieAssetUse";
import { IAutoMovieExternalModelProvenance } from "./IAutoMovieExternalModelProvenance";
import { IAutoMovieExternalMotionProvenance } from "./IAutoMovieExternalMotionProvenance";

/**
 * Current byte identity, acquisition metadata and live uses of one project asset. The inventory hashes current bytes; original-source and licence facts are descriptive.
 *
 * @evidence contracts/common.md#principled-implementation Inventory compares declared SHA-256 with supplied current bytes and checks path spelling, nonempty uses and processing labels. Active graph consumers resolve locally; audio, image and design-reference consumers defer to later compiled gates. Optional model/motion metadata is compared with current inspection, while original/license/processing history remains descriptive and cannot authenticate acquisition or actual tool execution.
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
   * The suffix dispatch requires either model or motion provenance for those files, so a motion-only glTF-family asset can omit this appearance record. Presence alone does not select a recipe, take or conversion.
   */
  model?: IAutoMovieExternalModelProvenance;

  /**
   * Inspected motion facts when these bytes are adopted as animation input. Omitted for non-motion assets; presence never selects a take.
   */
  motion?: IAutoMovieExternalMotionProvenance;
}
