# src/analysis/autoMovieAnalysisRunDigest.ts#autoMovieAnalysisRunDigest

## @evidence contracts/development/implementation.md#principled-implementation

SHA-256 hashes fixed-order JSON-array lines whose syntax delimits fields and escapes strings. Validated finite JSON values produce deterministic text; signed zeros share an encoding, nonfinite numbers become null outside the admitted domain and equal hashes do not prove identity. Typed records with ordinary data fields are the caller premise.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One exported function owns the canonical form for the seal, the validator and test fixtures alike, with the text builder kept private because no caller needs the text itself.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every covered field is encoded the same way, with no run, domain or solver special-cased; the only fixed choice is the field order, which is the canonical form itself.

## @evidence contracts/development/common.md#meaningful-documentation

Lists covered header fields and line order, signed-zero/nonfinite encoding limits, collision limits, entry-order sensitivity and ignored digest input.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in metrics M, samples S (at most 4096 in a valid run) and warnings W to build the text, then one pure-TypeScript SHA-256 pass over its UTF-8 bytes, which dominates; no part of the run is traversed twice.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure function of one run; reuse belongs to callers, and the seal now calls it once per run while a received run must be rehashed to be proven.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The line array, the joined text and the byte array exist only for the call, growing with M + S + W, and only the digest string is returned.
