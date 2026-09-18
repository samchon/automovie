import type { IAutoMovieSemanticMaskReceipt } from "../render/IAutoMovieSemanticMaskReceipt";
import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * One byte-exact file proving a final production deliverable.
 *
 * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `IAutoMovieProductionDeliverableFile` as the portable data boundary for the asset generation provider independence requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `IAutoMovieProductionDeliverableFile` for the asset spec generation provider choice system contract.
 */
export interface IAutoMovieProductionDeliverableFile {
  /**
   * Render-root-relative regular file path.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `path` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `path` for the asset spec generation provider choice system contract.
   */
  path: string;
  /**
   * Exact file-byte digest.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `digest` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `digest` for the asset spec generation provider choice system contract.
   */
  digest: AutoMovieContentDigest;
  /**
   * Exact non-zero file size.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `bytes` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `bytes` for the asset spec generation provider choice system contract.
   */
  bytes: number;
  /**
   * Explicit media type, such as video/mp4 or text/vtt.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `mediaType` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `mediaType` for the asset spec generation provider choice system contract.
   */
  mediaType: string;
  /**
   * Semantic identity carried by a mask sidecar.
   *
   * Omitted for every ordinary media file. When present, its sidecar path is
   * this file's path and the final reader reopens the JSON bytes against the
   * shot, frame, palette digest, and coverage recorded here.
   *
   * @evidence requirements/rendering/passes-channels-and-products.md#rendering-identity-mask-channels Carries the owner-and-instance mapping a delivered mask frame depends on into the same ledger entry as its bytes.
   * @evidence specifications/editorial-render-and-delivery/render-products-visibility-and-color.md#spec-render-pass-products Records the semantic-channel dependency closure of a delivered mask product beside its file identity.
   */
  semanticMask?: IAutoMovieSemanticMaskReceipt;
}
