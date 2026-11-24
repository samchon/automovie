# src/draw/bindAutoMovieDrawSceneSoftProps.ts#bindAutoMovieDrawSceneSoftProps

## @evidence contracts/development/common.md#meaningful-documentation

Documents exact-time reads, that each read describes the placement just made, placement order and disposal ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The draw host already places the capture cell's second, so this adapter reads the surface producer right after each placement, `seekShot`'s included, with that output second, and the producer describes the placement just made, as every reader of a draw subject does; it never interpolates particle data.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps the existing subject's scene and presentation data and extends only its seek and disposal boundaries.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A placement refusal propagates before a surface read; each successful placement uses the producer's current surfaces and their analysis status.

## @evidence contracts/development/implementation.md#efficient-algorithms

One awaited base seek and one producer call per requested second, plus the current frame's mesh projection.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The mounted mesh owner serves every seek in the subject's lifetime. Surface reads follow the current seek without retaining equivalent-time snapshots.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Owns the attached soft-prop projection until disposal and independently retires it and the original subject in one attempt.
