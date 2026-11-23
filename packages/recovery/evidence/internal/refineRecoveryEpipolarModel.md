# src/index.ts#refineRecoveryEpipolarModel

## @evidence contracts/development/implementation.md#principled-implementation

Four-branch cheirality supplies a local pose initializer. Five-coordinate calibrated optimization minimizes its fixed subset, then the complete tentative population is rescored in original pixels. Repeating only on changed inlier identities gives bounded local re-estimation without dropping new contradictions.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

This owner coordinates subset identity and optimizer termination; the pose optimizer owns continuous fitting, and the later final qualification owns physical visibility, homography competition and sampling-budget diagnostics.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An exhausted optimizer or still-changing third refit remains nonconverged. No success flag from an older subset, final-only point deletion or expected pose upgrades the candidate.

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed three-refit bound, whole-population scoring, changed-subset invalidation and local-only convergence meaning.

## @evidence contracts/development/implementation.md#efficient-algorithms

At most three bounded N-inlier pose fits and complete M-match rescoring passes use O(M) scratch plus bounded optimizer work; identity comparison is linear in the inlier population.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each completed fit supplies the next pose initializer and pixel matrix. An unchanged ordered subset terminates immediately; a changed subset rebuilds its own local design.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Up to three fixed-size pose/counter summaries and one O(M) score return; local subset arrays expire, and no image, handle or global cache survives.
