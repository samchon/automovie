# src/geometry/construction/AutoMovieSolidDomain.ts#AutoMovieSolidDomain.contains

## @evidence contracts/development/implementation.md#principled-implementation

Uses exact inclusive comparisons against the current borrowed domain, without an ownership epsilon.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pure scalar admission is reusable before callbacks or line-search work.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not wrap phase, clamp station or infer a missing bound from sampled geometry.

## @evidence contracts/development/common.md#meaningful-documentation

Parameters use the surface's chart units; absent bounds authorize finite stations only.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant finite/range tests with no jet evaluation.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

This predicate retains no previous query.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Allocates and retains no result object or resource.

# src/geometry/construction/AutoMovieSolidDomain.ts#AutoMovieSolidDomain.jet

## @evidence contracts/development/implementation.md#principled-implementation

Feasible-domain safeguarding rejects outside trials before the source is read; only the explicit numeric admission class becomes nullable failure.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same returned jet supplies all equations at an accepted chart point.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Callback/getter and stale-binding errors keep their identity; missing physical2 is not zero-filled or replaced by a finite Point0.

## @evidence contracts/development/common.md#meaningful-documentation

Null means infeasible, unavailable or nonfinite required numeric output, not proof of no intersection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant admission and 18-component output tests/copies surround at most one producer query.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the admitted result instead of reevaluating for its finite check.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Six fresh vectors belong to the caller, so later producer queries cannot overwrite an accepted iterate, anchor or stored point; the call retains no producer result.
