import { IAutoMovieGeneratedFile } from "./IAutoMovieGeneratedFile";

/**
 * One materialized builder file and its write status.
 *
 * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `IAutoMovieMaterializedFile` as the portable data boundary for the asset generation provider independence requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `IAutoMovieMaterializedFile` for the asset spec generation provider choice system contract.
 */
export interface IAutoMovieMaterializedFile extends IAutoMovieGeneratedFile {
  /**
   * Whether bytes were first created, updated, or already current.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generation-provider-independence Exposes `status` as the portable data boundary for the asset generation provider independence requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-provider-choice Types `status` for the asset spec generation provider choice system contract.
   */
  status: "created" | "updated" | "unchanged";
}
