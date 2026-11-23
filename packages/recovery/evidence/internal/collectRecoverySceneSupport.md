# src/index.ts#collectRecoverySceneSupport

## @evidence contracts/development/implementation.md#principled-implementation

Each accepted landmark belongs to one fixed global nonconflicting track, whose unique target feature supplies at most one candidate per source. Candidate count is not geometric inlier support.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One revision-local support table serves camera ordering, resection and final registration diagnostics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No re-detection, synthetic target measurement, independent point identity or expected pose supplies support.

## @evidence contracts/development/common.md#meaningful-documentation

States source-order output, accepted-landmark indices, global identity premise and invalid internal ownership failure.

## @evidence contracts/development/implementation.md#efficient-algorithms

L accepted landmarks and E corresponding global observations require O(L+E+V) time/storage, avoiding a repeated V-by-L search for each consumer.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

One table is reused until accepted pose/point/measurement revision changes; fixed observations are not reacquired.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Call-owned candidate arrays borrow fixed observations only for the revision; no RGB, new descriptor or external resource is acquired.
