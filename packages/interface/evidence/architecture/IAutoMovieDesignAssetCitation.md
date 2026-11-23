# src/architecture/IAutoMovieDesignAssetCitation.ts#IAutoMovieDesignAssetCitation

## @evidence contracts/development/design.md#principled-representation

Detects stale imported bytes by comparing two authored content digests, the one recorded at production time and the subject's current one, so any byte change that reaches the subject's digest is caught without the lineage reading the bytes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Subject id and digest form one direct byte-input citation beside the artifact stamp. Alternatives retain distinct variant fields while fairness compares their configuration/phase; citations remain specific to each artifact's declared direct inputs.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The duplicate digest is the signal rather than redundancy to reconcile, and the prose states the remaining gap that no gate hashes the asset bytes against the subject's digest.

## @evidence contracts/development/common.md#meaningful-documentation

States why imported bytes need their own citation, why the digest is deliberately duplicated, when a disagreement appears, which hashing nobody performs, and that the subject must be an input of the citing artifact.
