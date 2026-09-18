import { IAutoMovieGeneratedAcquisition } from "../architecture/IAutoMovieGeneratedAcquisition";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieAssetLicense } from "./IAutoMovieAssetLicense";
import { IAutoMovieAssetProcessingStep } from "./IAutoMovieAssetProcessingStep";
import { IAutoMovieAssetUse } from "./IAutoMovieAssetUse";
import { IAutoMovieExternalModelProvenance } from "./IAutoMovieExternalModelProvenance";
import { IAutoMovieExternalMotionProvenance } from "./IAutoMovieExternalMotionProvenance";

/**
 * Byte identity and consumer bindings for one project asset.
 *
 * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `IAutoMovieAssetProvenance` as the portable data boundary for the asset external provenance digest requirement.
 * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-adoption-output Types `IAutoMovieAssetProvenance` for the asset spec adoption output system contract.
 */
export interface IAutoMovieAssetProvenance {
  /**
   * Canonical project-relative current asset path.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `path` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-adoption-output Types `path` for the asset spec adoption output system contract.
   */
  path: string;
  /**
   * SHA-256 of the current bytes at {@link path}.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `digest` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-adoption-output Types `digest` for the asset spec adoption output system contract.
   */
  digest: AutoMovieContentDigest;
  /**
   * Optional descriptive record of an earlier source revision.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `original` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-adoption-output Types `original` for the asset spec adoption output system contract.
   */
  original?: {
    /** Descriptive source location. */
    url: string;
    /** SHA-256 of the acquired original bytes. */
    digest: AutoMovieContentDigest;
  };
  /**
   * Optional descriptive generation record.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `generated` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-adoption-output Types `generated` for the asset spec adoption output system contract.
   */
  generated?: IAutoMovieGeneratedAcquisition;
  /**
   * Optional descriptive license metadata.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `license` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-adoption-output Types `license` for the asset spec adoption output system contract.
   */
  license?: IAutoMovieAssetLicense;
  /**
   * Optional ordered transformations associated with the current bytes.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `processing` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-adoption-output Types `processing` for the asset spec adoption output system contract.
   */
  processing?: IAutoMovieAssetProcessingStep[];
  /**
   * Non-empty production usage ledger.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `uses` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-adoption-output Types `uses` for the asset spec adoption output system contract.
   */
  uses: IAutoMovieAssetUse[];
  /**
   * Required ingest/LOD/proxy ledger for external glTF, GLB, or VRM assets.
   *
   * Non-model assets omit it.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `model` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-adoption-output Types `model` for the asset spec adoption output system contract.
   */
  model?: IAutoMovieExternalModelProvenance;
  /**
   * Inspected motion facts when these bytes are adopted as animation input.
   * Omitted for non-motion assets; presence never selects a take.
   *
   * @evidence requirements/motion/external-motion-inputs.md#motion-external-adoption-mode Brings motion bytes into the manifest's digest and provenance boundary.
   * @evidence specifications/interchange-and-adoption/conversion-receipts-and-determinism.md#interchange-canonical-receipt-result Records the deterministic ingest identity without making an adoption decision.
   *
   * @evidence requirements/asset-authoring/external-assets.md#asset-external-provenance-digest Exposes `motion` as the portable data boundary for the asset external provenance digest requirement.
   * @evidence specifications/asset-and-representation/identity-resources-and-lifecycle.md#asset-spec-adoption-output Types `motion` for the asset spec adoption output system contract.
   */
  motion?: IAutoMovieExternalMotionProvenance;
}
