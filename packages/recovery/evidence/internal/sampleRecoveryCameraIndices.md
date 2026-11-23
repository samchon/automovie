# src/internal/sampleRecoveryCameraIndices.ts#sampleRecoveryCameraIndices

## @evidence contracts/development/implementation.md#principled-implementation

A partial Fisher-Yates shuffle chooses each remaining index once using the engine's deterministic half-open pseudorandom sample. Finite 32-bit output has discrete sampling bias and provides reproducibility rather than a cryptographic or exact continuous-random guarantee.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Model-domain and trial arguments keep homography and epipolar proposal streams distinct without a mutable global generator.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No ambient entropy, preferred feature, retry-until-unique loop or measured pose changes the sample; malformed populations refuse before allocation.

## @evidence contracts/development/common.md#meaningful-documentation

Gives subset uniqueness, deterministic identity, full-population premise and finite-generator limitation.

## @evidence contracts/development/implementation.md#efficient-algorithms

For population N and sample s, filling one index array costs O(N), and s swaps cost O(s); finite admitted feature populations bound this small RANSAC workload without rejection-loop tails.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only the requested prefix is shuffled; each proposal's explicit identity recreates the same subset without retaining earlier streams.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The call owns one N-index array and returns an s-index copy; no feature, image, stateful generator or external handle remains.
