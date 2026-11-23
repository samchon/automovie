# src/guidePassFramePattern.ts#guidePassFramePattern

## @evidence contracts/development/implementation.md#principled-implementation

The pattern is `framePattern` over the same pass-tagged extension `guidePassFrameName` uses, so ffmpeg's `%0Nd` sequence syntax matches exactly that pass's files.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

It shares `passExtension` with `guidePassFrameName`, so a name and its pattern cannot disagree on the pass tag.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No pass or extension is special-cased beyond the untagged beauty rule shared with the frame names.

## @evidence contracts/development/common.md#meaningful-documentation

The doc says which names the pattern matches, gives an example, and states that the arguments must match the naming call.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constructing the numbered input pattern costs linear time in the chosen extension and resulting string length, with no frame traversal.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call formats one short pattern, so caching would cost more than formatting.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The pattern string goes straight into an ffmpeg argument list owned by the caller; this function starts no ffmpeg process and keeps no reference.
