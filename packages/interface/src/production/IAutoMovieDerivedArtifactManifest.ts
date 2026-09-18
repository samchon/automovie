import { IAutoMovieDerivedArtifactRecord } from "./IAutoMovieDerivedArtifactRecord";

/**
 * Project-owned ledger for deterministic precomputation results.
 *
 * This is not external asset provenance. It records reproducible derivation
 * from tracked source and declared project inputs and carries no acquisition,
 * provider, license, or consumer fields.
 *
 * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-provenance-separation Keeps deterministic project derivation out of the external asset manifest.
 * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-manifest Defines the separate versioned ledger and canonical artifact order.
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifactManifest {
  /**
   * Derived-artifact manifest format.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-compile-refusal Makes incompatible or malformed ledger semantics explicitly rejectable.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-manifest Selects the version-one manifest contract.
   */
  version: 1;
  /**
   * Artifact records sorted by canonical output path.
   *
   * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-portable-publication Keeps the same artifact ordering across Windows and POSIX.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-manifest Provides one portable record per owned output.
   * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-generation Represents only completed artifact records in the manifest published after their output bytes.
   */
  artifacts: IAutoMovieDerivedArtifactRecord[];
}
