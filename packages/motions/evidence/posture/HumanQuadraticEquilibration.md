# src/posture/HumanQuadraticEquilibration.ts#HumanQuadraticEquilibration

## @evidence contracts/development/implementation.md#principled-implementation

Applies Stellato et al. 2020 algorithm 2 to admitted matrices using the existing ten passes, norm limits and q-dependent cost equilibration.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds or reuses proved original CSR/raw snapshots and stable factor/transpose positions, then scales fresh canonical numeric buffers; exact-zero curvature positions avoid unchanged zero work, and P/q norms accumulate at their producer in original nonzero order, with an idempotent repeated diagonal maximum evaluated once.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Omits only coefficients equal to zero, retaining original CSR nonzero/duplicate order and empty-row offsets; factor-only positions may sort by column without changing any K-cell accumulation sequence, while transpose positions retain each rhs column's original sequence. No cutoff, merged cancellation or changed scaling constants is used.

## @evidence contracts/development/implementation.md#efficient-algorithms

Compression/snapshots take O(S+R+n*w), transpose positions O(n+Z+m), and unordered factor positions their helper's sorting cost, before ten O(K+Z+m) scaling passes (one with `fixed`), with K=n for diagonal P, stored positions for sparse P and full band for dense P. Space remains O(S+n*w+Z+n+m), including exact positions and input/final finite admission.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Runs on any changed P/q/A dependency or scaling; exact groups may share the previous preparation's raw data or topology while all current scaling passes run. Final finite scans may share only an exactly equal finished P/A pair; q, D/E/c, inverses and q norms stay current and preserve their original exceptional behavior.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The result holds two n-entry scaling buffers, the previous preparation's at the same n, fully reset even after failure; m-entry row-scale scratch is the caller's and becomes its lo only after all scaling reads finish.

## @evidence contracts/development/common.md#meaningful-documentation

States exact-zero compression, the unchanged Ruiz policy, copied dependencies, the recorded scaling and finite invertibility check.

# src/posture/HumanQuadraticEquilibration.ts#HumanQuadraticEquilibration.finite

## @evidence contracts/development/implementation.md#principled-implementation

Requires finite prepared matrix and factor entries and optionally proves exact equality with an existing admitted buffer.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One indexed scan owns finite-value rejection and optional comparison for each prepared buffer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Tests finiteness directly without a magnitude cutoff, coercion or replacement value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Takes O(buffer length) time and O(1) auxiliary storage.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads every newly computed entry before retention; matching dimensions and Object.is values prove reuse without hiding nonfinite results.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains no buffer; rejection throws a position-bearing RangeError, while the boolean result reports equality with the optional previous buffer.

## @evidence contracts/development/common.md#meaningful-documentation

Describes full finite admission, optional exact comparison and unchanged numeric values.
