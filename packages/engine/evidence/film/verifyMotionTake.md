# src/film/verifyMotionTake.ts#verifyMotionTake

## @evidence contracts/development/common.md#meaningful-documentation

Defines the admitted saved input, independently acquired facts, optional rederived anchor, comparison semantics and failures.

## @evidence contracts/development/implementation.md#principled-implementation

Compares exact stable ids, digests, versions, seeds and times; master identities are checked before the ledgers, each ledger is matched by unique key and the optional anchor is checked as a separate fact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps file/runtime measurement in the host, schema validation in admitMotionTake and pairwise comparison here.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Refuses every changed, missing or new input and provider; no stale digest or source hint is used to restore motion.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(N) time across N measured and saved ledger rows; each ledger creates and releases one temporary index.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Compares one set of current facts without loading or preparing a take.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Indexes current rows only for the duration of comparison and retains nothing.
