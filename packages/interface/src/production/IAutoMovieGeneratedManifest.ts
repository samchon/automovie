import { AutoMovieContentDigest } from "./AutoMovieContentDigest";
import { IAutoMovieGeneratedFile } from "./IAutoMovieGeneratedFile";

/**
 * Manifest proving the identity and ownership of generated output.
 *
 * @evidence requirements/asset-authoring/generated-assets.md#asset-generated-adoption-modes Exposes `IAutoMovieGeneratedManifest` as the portable data boundary for the asset generated adoption modes requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-adoption-output Types `IAutoMovieGeneratedManifest` for the asset spec generation adoption output system contract.
 */
export interface IAutoMovieGeneratedManifest {
  /**
   * Generated-manifest format.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generated-adoption-modes Exposes `version` as the portable data boundary for the asset generated adoption modes requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-adoption-output Types `version` for the asset spec generation adoption output system contract.
   */
  version: 1;
  /**
   * Compiler identity.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generated-adoption-modes Exposes `builder` as the portable data boundary for the asset generated adoption modes requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-adoption-output Types `builder` for the asset spec generation adoption output system contract.
   */
  builder: {
    /** Package version. */
    packageVersion: string;
    /** Content protocol version. */
    protocolVersion: string;
  };
  /**
   * Ordered design and source input fingerprint.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generated-adoption-modes Exposes `inputFingerprint` as the portable data boundary for the asset generated adoption modes requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-adoption-output Types `inputFingerprint` for the asset spec generation adoption output system contract.
   */
  inputFingerprint: AutoMovieContentDigest;
  /**
   * Compiler-owned files.
   *
   * @evidence requirements/asset-authoring/generated-assets.md#asset-generated-adoption-modes Exposes `files` as the portable data boundary for the asset generated adoption modes requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-generation-adoption-output Types `files` for the asset spec generation adoption output system contract.
   */
  files: IAutoMovieGeneratedFile[];
}
