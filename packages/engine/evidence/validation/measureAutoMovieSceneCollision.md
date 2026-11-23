# src/validation/measureAutoMovieSceneCollision.ts#measureAutoMovieSceneCollision

## @evidence contracts/development/common.md#meaningful-documentation

Names world units, the clock, ordered paths, explicit internal exclusions and the limits of the convex witness.

## @evidence contracts/development/implementation.md#principled-implementation

Orders external group candidates by their conservative X minima, rejects separated world boxes and invokes the existing placed-solid contact query only for surviving supported leaves. Exact pair windows limit allowed depth.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Group and region bounds are derived from the same prepared leaves. Box ordering, numerical admission, allowed contact and native measurement stay distinct inside the query.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Declared source groups alone suppress internal pairs. Overlapping envelopes and native-precision ambiguity remain candidates. Refused shapes and exhausted budgets report incomplete coverage.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preparation visits each part once and sorts groups and members. Region envelopes are folded only for a group in an overlapping external pair. Traversal retains no all-pairs list and caps comparison work with the supplied deterministic limit.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Bounds and active allowances are computed once per layer and reused throughout its traversal.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

borrows the displayed parts and native query only during the call. Preparation records are discarded and returned arrays own their ordinary data.
