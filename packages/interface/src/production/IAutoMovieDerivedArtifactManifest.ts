import { IAutoMovieDerivedArtifactRecord } from "./IAutoMovieDerivedArtifactRecord";

/**
 * Project-owned ledger for deterministic precomputation results.
 *
 * The ledger records declared deterministic derivation from tracked source and project inputs, separately from external acquisition provenance. Generation compares two callback outputs; that observation does not prove all-run reproducibility or the absence of undeclared dependencies.
 *
 * @evidence contracts/common.md#principled-implementation Version-one records bind observed outputs to generator and declared-input digests; generation compares two output samples and rechecks the live basis, then atomically replaces the output file before separately replacing the ordered ledger. Later ledger failure does not roll back the output.
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
