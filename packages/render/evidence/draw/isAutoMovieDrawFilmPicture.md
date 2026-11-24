# src/draw/isAutoMovieDrawFilmPicture.ts#isAutoMovieDrawFilmPicture

## @evidence contracts/development/common.md#meaningful-documentation

States what the film picture does, which draws are it, why a plain capture is, and that every other draw is one sharp placement.

## @evidence contracts/development/implementation.md#principled-implementation

Issue #4078 samples delivery draws and captures whose request is the plain `beauty` request, and draws every other picture as one sharp sample at its second; the plate follows the same rule with its shade read as `beauty`, so a plain plate composites as the film does.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The draw host's one decision of which pictures are the film's, named so it is tested at its owner rather than inside the host's GPU-bound draw; isAutoMoviePlainBeautyRequest keeps the request rule the Viewer shares.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No subject, second or optics value changes the rule; it reads only the call's shade, request and delivery flag.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Constant work.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.