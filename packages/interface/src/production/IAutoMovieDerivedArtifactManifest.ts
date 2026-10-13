import { IAutoMovieDerivedArtifactRecord } from "./IAutoMovieDerivedArtifactRecord";

/**
 * Project-owned ledger for deterministic precomputation results.
 *
 * This is not external asset provenance. It records reproducible derivation from tracked source and declared project inputs and carries no acquisition, provider, license, or consumer fields.
 *
 * @evidence contracts/common.md#principled-implementation Version-one records bind deterministic outputs to generator and declared-input digests; generation validates repeat output and current basis before atomically publishing bytes and the canonically ordered ledger.
 * @evidence contracts/common.md#clear-and-simple-design Derived precomputation has its own ordered manifest, separate from externally acquired asset provenance because its authority is tracked source and inputs rather than provider or licence metadata.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A ledger entry cannot authorize stale derived bytes, and externally sampled acquisition is not relabeled as deterministic precomputation to bypass its provenance obligations.
 * @evidence contracts/common.md#meaningful-documentation Defines project-owned reproducible derivation, the separate external-asset boundary, schema version and canonical output ordering.
 * @author Samchon
 */
export interface IAutoMovieDerivedArtifactManifest {
  /** Derived-artifact manifest format. */
  version: 1;

  /** Artifact records sorted by canonical output path. */
  artifacts: IAutoMovieDerivedArtifactRecord[];
}
