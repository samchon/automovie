import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/**
 * One builder-owned generated file.
 *
 * @evidence requirements/asset-authoring/generated-assets.md#asset-generated-adoption-modes Exposes `IAutoMovieGeneratedFile` as the portable data boundary for the asset generated adoption modes requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-adoption-output Types `IAutoMovieGeneratedFile` for the asset spec generation adoption output system contract.
 */
export interface IAutoMovieGeneratedFile {
  /**
   * Project-relative generated path.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generated-adoption-modes Exposes `path` as the portable data boundary for the asset generated adoption modes requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-adoption-output Types `path` for the asset spec generation adoption output system contract.
   */
  path: string;
  /**
   * Ownership marker.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generated-adoption-modes Exposes `owner` as the portable data boundary for the asset generated adoption modes requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-adoption-output Types `owner` for the asset spec generation adoption output system contract.
   */
  owner: "builder";
  /**
   * File-byte digest.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generated-adoption-modes Exposes `digest` as the portable data boundary for the asset generated adoption modes requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-adoption-output Types `digest` for the asset spec generation adoption output system contract.
   */
  digest: AutoMovieContentDigest;
  /**
   * Design or source targets that produced the file.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generated-adoption-modes Exposes `sourceTargets` as the portable data boundary for the asset generated adoption modes requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-adoption-output Types `sourceTargets` for the asset spec generation adoption output system contract.
   */
  sourceTargets: string[];
}
