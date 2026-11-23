# src/core/ArchetypeBinary64.ts#ArchetypeBinary64

## @evidence contracts/development/common.md#meaningful-documentation

States IEEE binary64 significand/exponent rules, finite domain, caller-owned view premise, return and resource lifetime.

## @evidence contracts/development/implementation.md#principled-implementation

DataView reads the same 64-bit encoding written by setFloat64. Masking fraction/exponent and restoring the normal hidden bit gives value=integer*2^exponent exactly, with bias 1023, 52 fraction bits and an independent sign bit.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit one view, then return a finite-input reader with one write and bit decomposition.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No magnitude cap, tolerance, decimal conversion, physical default or shared global view changes a value; the caller owns the exclusive view during synchronous reads.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each read handles one fixed-width encoding and a significand of at most 53 bits in constant time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One representation owner serves fracture's exact inequality and mass's exceptional rational arithmetic; one view is reused across every term of that operation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader closes over only its own eight-byte view or the explicitly supplied view/backing buffer. No numeric input, history, task or external handle is retained; consumers keep the reader only for one synchronous calculation.
