# src/index.ts#releaseMountedViewer

## @evidence contracts/development/implementation.md#principled-implementation

Attempts loop stop first, scene shadow retirement with the still-live renderer second and independent renderer/compositor release last, preserving every failure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One mount lifecycle composition uses existing shadow and renderer owners rather than duplicating their resource collections.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A failed earlier listener cannot skip later owners, borrowed geometry/materials are not disposed and public cleanup completion is not independent OS/GPU kernel settlement proof.

## @evidence contracts/development/common.md#meaningful-documentation

Documents shutdown ordering, borrowed model ownership, shadow exclusive-context/external-borrower boundary and independent failure handling.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed owner coordination delegates scene shadow traversal and distinct target retirement plus fixed compositor/renderer disposal; it adds no per-pixel work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The mount terminal guard owns one sticky shutdown attempt; this lower-level release composition itself performs requested cleanup rather than memoizing arbitrary repeated native disposal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

No new resource is acquired; scheduling withdrawal precedes resource release, each owner gets an attempt and failure remains explicit rather than certifying freed native storage.
