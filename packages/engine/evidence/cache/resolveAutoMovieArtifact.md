# src/cache/resolveAutoMovieArtifact.ts#resolveAutoMovieArtifact

## @evidence contracts/development/implementation.md#principled-implementation

A constructive trace with a content-verified value (Mokhov et al. 2018): the key stands for all inputs, the recorded digest proves the value is the one written, and the optional recomputation is Bazel's rebuild-and-compare audit that purges a mismatch.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One function owns the read, verify, compute and write order; key composition, planning and storage are separate modules.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A corrupt entry is recomputed rather than served, a mismatch is reported rather than hidden, and compute failures are not caught.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most one read, one digest of the stored bytes, one computation, one digest of its bytes and one write; digest cost is linear in artifact size.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares a stored artifact across runs only when the composed key matches and its content digest verifies; equivalence of the computation itself rests on the key declaring every input.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Holds at most the stored and the computed bytes during the call and returns one of them; the store owns any handles.

## @evidence contracts/development/common.md#meaningful-documentation

States verification, repair, audit behavior, the purity premise and failure effects.
