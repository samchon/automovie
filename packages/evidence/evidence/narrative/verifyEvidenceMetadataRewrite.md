# src/narrative/verifyEvidenceMetadataRewrite.ts#verifyEvidenceMetadataRewrite

## @evidence contracts/development/implementation.md#principled-implementation

Validate physical file safety and strict UTF-8, compare ownership-specific byte projections, check corruption signals and bind bulk samples to changed metadata.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One synchronous coordinator aggregates diagnostics while grammar, byte mapping and sample checks have separate helpers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

BOM, authored text and unowned endings stay protected; added, removed or symlinked selected paths fail rather than becoming metadata edits.

## @evidence contracts/development/common.md#meaningful-documentation

The comment defines ownership boundaries and byte preservation; failure throws aggregated diagnostics and success returns hashes and sample data.

## @evidence contracts/development/implementation.md#efficient-algorithms

Across F files and B bytes, reads, validation, projection, hashing and token scans dominate; malformed-block lookahead may rescan, sorting is O(F log F), and retained projections scale with total bytes.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each projection serves equality, source diagnostics, metadata comparison, hashing and sample checks within this invocation; filesystem results are not cached across operations.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The call owns synchronous reads, diagnostics, reports and its projection Map until return or throw; no handles stay open and memory has no fixed cap beyond selected inputs.
