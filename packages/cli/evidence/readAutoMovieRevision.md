# src/readAutoMovieRevision.ts#readAutoMovieRevision

## @evidence contracts/development/common.md#meaningful-documentation

States the three forms and when each is written.

## @evidence contracts/development/implementation.md#principled-implementation `git rev-parse HEAD` names the commit and `git status --porcelain` is empty exactly when nothing differs from it, so the revision says whether the commit alone repeats the capture.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two git calls, one fallback.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A missing revision is written as `unrecorded`, never as a guessed commit.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two short processes per capture.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per capture, since the tree may change between captures.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Both processes end before it returns.
