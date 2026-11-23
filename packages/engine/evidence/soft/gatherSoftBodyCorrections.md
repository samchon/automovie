# src/soft/gatherSoftBodyCorrections.ts#gatherSoftBodyCorrections

## @evidence contracts/development/implementation.md#principled-implementation

Every correction reads the same predicted buffer, then groups the canonical twelve offsets into six mirror-pair sums and a fixed family fold. Prepared rest lengths, inverse masses, valences and stiffness are premises; finite rounding and collapsed current edges retain their original handling.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shared sweep owner serves static and moving-boundary integration while the caller applies the completed correction buffer afterward.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Anchored or isolated particles receive zero correction and zero-length current edges are skipped explicitly; no sequential update, fixture correction or claimed global contraction substitutes for the Jacobi scheme.

## @evidence contracts/development/common.md#meaningful-documentation

States simultaneous reads, ordered mirror folding and the caller's prepared-buffer responsibility.

## @evidence contracts/development/implementation.md#efficient-algorithms

For P particles and a fixed twelve-neighbour stencil, each sweep costs O(P) with one constant eighteen-scalar fold buffer; caller-owned correction storage is O(P).

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The eighteen-slot fold buffer is reused for every particle, while prepared topology/rest lengths are supplied once by the solve; no prior sweep's corrections are reused after positions change.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Predicted and preparation arrays are read only, correction is overwritten, and the fold buffer is released when the sweep returns.
