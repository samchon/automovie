import { IAutoMovieDerivedArtifactRecord } from "./IAutoMovieDerivedArtifactRecord";

/**
 * Project-owned ledger for deterministic precomputation results.
 *
 * This is not external asset provenance. It records reproducible derivation
 * from tracked source and declared project inputs and carries no acquisition,
 * provider, license, or consumer fields.
 *
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifactManifest {
  /** Derived-artifact manifest format. */
  version: 1;

  /** Artifact records sorted by canonical output path. */
  artifacts: IAutoMovieDerivedArtifactRecord[];
}
