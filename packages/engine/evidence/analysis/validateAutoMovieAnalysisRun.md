# src/analysis/validateAutoMovieAnalysisRun.ts#validateAutoMovieAnalysisRun

## @evidence contracts/development/implementation.md#principled-implementation

Runs the shared contents rules, checks the `digest` field against the lowercase `sha256:` pattern, recomputes `autoMovieAnalysisRunDigest` over the received contents and compares strings, then compares `inputRevision` with the optional current revision; a recomputed SHA-256 detects any edit to a field the canonical text covers.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This function owns only what a received run needs beyond the seal path, the digest and staleness; the contents rules live in `validateAutoMovieAnalysisRunContents` so the seal can apply them before hashing.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The digest pattern and the canonical text are contract rules shared with the seal, and no run, solver or domain is exempt from the recomputation.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states what the contents rules defend, that the digest is recomputed and why, what `revision` adds, the violation order and root, and the shape premise with its `TypeError` consequence.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the run's metrics, samples and warnings for the contents pass, then one SHA-256 pass over the canonical text, which dominates and is required because only rehashing proves the contents unedited.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

No digest is cached on the run or across calls: a received run must be re-proven each time, and the seal path no longer calls this function, so a freshly sealed run is hashed once rather than twice.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The collector and the recomputed digest string are call-local; the returned validation, owned by the caller, holds the violations, which may reference fragments of the run.
