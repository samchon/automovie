# src/actions/walkHipTwist.ts#walkHipTwist

## @evidence contracts/development/common.md#meaningful-documentation

States the table, unit, chosen limit and refusal.

## @evidence contracts/development/implementation.md#principled-implementation

Takes each hip's smaller internal and external range, then the smaller hip, so the common heading limit holds on either side.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One read per hip and one minimum.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing hip interval is refused rather than assigned a fallback range.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Two fixed interval reads, independent of table size.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

The caller owns any retained limit; this entry reads the given table.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
