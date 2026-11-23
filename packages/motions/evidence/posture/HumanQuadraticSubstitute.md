# src/posture/HumanQuadraticSubstitute.ts#HumanQuadraticSubstitute

## @evidence contracts/development/implementation.md#principled-implementation

Standard forward substitution solves U-transpose then backward substitution solves U; compatible dimensions and a finite nonsingular Cholesky factor are the existing caller premises.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Owns the same two sweeps for Band and polishing; forward reads exact contiguous copies and backward emits finite status/relaxation. With band zero, components are independent, so both unchanged divisions emit each final value in one pass.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves every original term, subtraction/division association, band limit and diagonal use without a new numerical guard or skipped coefficient.

## @evidence contracts/development/implementation.md#efficient-algorithms

With w=band+1, takes O(n*w) time and O(1) auxiliary storage; final scalar emission avoids another relaxation walk, and band zero avoids a separate intermediate vector write/read and second diagonal load.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads unchanged upper/forward copies across right-hand sides, preserving all terms and zero/nonfinite propagation. Band-zero components use exactly (b[i]/Uii)/Uii, with no reciprocal or cross-component dependency. Final values supply finite status and independent relaxation immediately; no solved values are retained.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates no arrays and changes only caller-owned x plus optional distinct relaxed; retains no input, matrix, state or resource after returning.

## @evidence contracts/development/common.md#meaningful-documentation

States the factored equation, upper/forward mappings, matching-factor and relaxation-nonaliasing premises, finite flag and output ownership.
