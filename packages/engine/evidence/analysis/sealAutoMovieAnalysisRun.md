# src/analysis/sealAutoMovieAnalysisRun.ts#sealAutoMovieAnalysisRun

## @evidence contracts/development/implementation.md#principled-implementation

Writes the record with the contract's `version: 1` and `automovie.analysis-run.v1` protocol, replaces the settings text with its SHA-256 digest, checks the draft with the contents rules shared with the validator, and only then seals it with `autoMovieAnalysisRunDigest`; because the digest is computed from the very draft returned, the received-run digest check would pass by construction.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Every analyzer emits runs through this one function, so the header constants, the settings digest and the refusal live in one place; it reuses the contents validator instead of the public one because the public one adds only the digest check this function makes true by construction.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The only fixed values are the contract's version and protocol; no solver, domain or outcome is special-cased, and the self-check is a production gate rather than a test hook.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states why building and checking are one call, which rules apply, the error's contents, that the settings text is kept only as a digest, and that solver and outcome are held by reference with the consequence of editing them.

## @evidence contracts/development/implementation.md#efficient-algorithms

Hashes settings before admission, then checks contents and hashes the canonical run text only for an admitted draft. Work scales with encoded string/byte lengths plus metrics, samples and warnings; a refused draft incurs no run-text hash.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The run digest is computed once and the contents are checked once; the former second hash, which the public validator would spend recomputing a digest this call just wrote from the same draft, is not paid.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The collector is call-local; the caller owns the returned run, retaining header strings, the borrowed solver/outcome objects and the settings/run digest strings. No source settings text or validation session is retained by this function.
